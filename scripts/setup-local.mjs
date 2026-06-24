import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const needsAsciiPathWorkaround = process.platform === "win32" && !/^[\x00-\x7F]+$/.test(root);
const commandRoot = resolveCommandRoot(root);
const envPath = resolve(root, ".env");
const envExamplePath = resolve(root, ".env.example");
const databaseRoot = resolve(commandRoot, "packages", "database");
const realDatabaseRoot = resolve(root, "packages", "database");

const DEFAULT_CATEGORIES = [
  { name: "代码开发", slug: "code-development", description: "功能开发、编码相关提示词", sortOrder: 1 },
  { name: "代码优化", slug: "code-optimization", description: "性能优化、重构相关提示词", sortOrder: 2 },
  { name: "Bug修复", slug: "bug-fix", description: "调试、排错、修复相关提示词", sortOrder: 3 },
  { name: "UI/前端设计", slug: "ui-frontend", description: "界面设计、前端组件相关提示词", sortOrder: 4 },
  { name: "架构设计", slug: "architecture", description: "系统架构、技术设计相关提示词", sortOrder: 5 },
  { name: "测试", slug: "testing", description: "单元测试、集成测试相关提示词", sortOrder: 6 },
  { name: "文档", slug: "documentation", description: "文档生成、注释相关提示词", sortOrder: 7 },
  { name: "学习解释", slug: "learning", description: "学习、概念解释相关提示词", sortOrder: 8 },
  { name: "数据处理", slug: "data-processing", description: "数据处理、转换、分析相关提示词", sortOrder: 9 },
  { name: "产品设计", slug: "product-design", description: "产品设计、需求分析相关提示词", sortOrder: 10 },
  { name: "DevOps/部署", slug: "devops", description: "部署、CI/CD、运维相关提示词", sortOrder: 11 },
  { name: "AI Agent/工作流", slug: "ai-agent", description: "AI Agent、自动化工作流相关提示词", sortOrder: 12 },
  { name: "其他", slug: "other", description: "其他未分类提示词", sortOrder: 13 },
];

const DEFAULT_SETTINGS = [
  { key: "ai_provider", value: "" },
  { key: "ai_api_key", value: "" },
  { key: "ai_model", value: "" },
  { key: "ai_base_url", value: "" },
  { key: "sync_interval", value: "manual" },
  { key: "last_sync_at", value: "" },
  { key: "theme", value: "light" },
];

function parseDotEnv(filePath) {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function runBin(name, args, cwd = commandRoot, extraEnv = {}) {
  const binName = process.platform === "win32" ? `${name}.cmd` : name;
  const binPath = [
    resolve(cwd, "node_modules", ".bin", binName),
    resolve(databaseRoot, "node_modules", ".bin", binName),
    resolve(commandRoot, "node_modules", ".bin", binName),
  ].find((candidate) => existsSync(candidate));
  if (!binPath) {
    console.error(`Missing ${name}. Run pnpm install first.`);
    process.exit(1);
  }

  console.log(`\n> ${name} ${args.join(" ")}`);
  const command = process.platform === "win32" ? "cmd.exe" : binPath;
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", [binPath, ...args].map(quoteForCmd).join(" ")]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: { ...process.env, ...parseDotEnv(envPath), ...extraEnv },
    shell: false,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function quoteForCmd(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function runMigrations() {
  if (!needsAsciiPathWorkaround) {
    runBin("prisma", ["migrate", "deploy"], databaseRoot);
    return;
  }

  const tempDbRoot = resolve(tmpdir(), "prompt-dictionary-setup", "db");
  const tempPrismaRoot = resolve(tempDbRoot, "prisma");
  rmSync(tempDbRoot, { recursive: true, force: true });
  mkdirSync(tempDbRoot, { recursive: true });
  cpSync(resolve(realDatabaseRoot, "prisma"), tempPrismaRoot, {
    recursive: true,
    filter: (source) => !/\.(db|sqlite)(-|\.|$)/i.test(source),
  });

  runBin(
    "prisma",
    ["migrate", "deploy", "--schema", "prisma/schema.prisma"],
    tempDbRoot,
    { DATABASE_URL: "file:./dev.db" },
  );

  copyFileSync(
    resolve(tempPrismaRoot, "dev.db"),
    resolve(realDatabaseRoot, "prisma", "dev.db"),
  );
}

async function createDatabaseWithSqlJs() {
  console.log("\n> sql.js create SQLite database from migrations");
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  const migrationsRoot = resolve(realDatabaseRoot, "prisma", "migrations");
  const migrationDirs = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const dir of migrationDirs) {
    const sqlPath = resolve(migrationsRoot, dir, "migration.sql");
    if (!existsSync(sqlPath)) continue;
    const sql = readFileSync(sqlPath, "utf8");
    if (sql.includes("USING fts5")) {
      console.log(`Skipping ${dir} in sql.js fallback because FTS5 is unavailable.`);
      continue;
    }
    db.exec(sql);
  }

  const now = new Date().toISOString();
  for (const category of DEFAULT_CATEGORIES) {
    db.run(
      `INSERT OR REPLACE INTO Category
       (id, name, slug, description, isDefault, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        `category-${category.slug}`,
        category.name,
        category.slug,
        category.description,
        category.sortOrder,
        now,
        now,
      ],
    );
  }

  for (const setting of DEFAULT_SETTINGS) {
    db.run(
      `INSERT OR REPLACE INTO AppSetting (key, value, updatedAt) VALUES (?, ?, ?)`,
      [setting.key, setting.value, now],
    );
  }

  writeFileSync(resolve(realDatabaseRoot, "prisma", "dev.db"), Buffer.from(db.export()));
  db.close();
}

function resolveCommandRoot(realRoot) {
  if (process.platform !== "win32" || /^[\x00-\x7F]+$/.test(realRoot)) {
    return realRoot;
  }

  const linkParent = resolve(tmpdir(), "prompt-dictionary-setup");
  const linkPath = resolve(linkParent, "repo");
  mkdirSync(linkParent, { recursive: true });
  rmSync(linkPath, { recursive: true, force: true });
  symlinkSync(realRoot, linkPath, "junction");
  console.log(`Using temporary ASCII path for Prisma setup: ${linkPath}`);
  return linkPath;
}

async function main() {
  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    console.log("Created .env from .env.example");
  } else {
    console.log(".env already exists; keeping your local settings");
  }

  runBin("prisma", ["generate"], databaseRoot);
  if (needsAsciiPathWorkaround) {
    await createDatabaseWithSqlJs();
  } else {
    runMigrations();
    runBin("tsx", ["prisma/seed.ts"], databaseRoot);
  }

  console.log("\nSetup complete. Start the app with: pnpm dev");
}

await main();
