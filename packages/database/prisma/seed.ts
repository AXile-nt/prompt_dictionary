import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "代码开发", slug: "code-development", description: "功能开发、编码相关提示词", isDefault: true, sortOrder: 1 },
  { name: "代码优化", slug: "code-optimization", description: "性能优化、重构相关提示词", isDefault: true, sortOrder: 2 },
  { name: "Bug修复", slug: "bug-fix", description: "调试、排错、修复相关提示词", isDefault: true, sortOrder: 3 },
  { name: "UI/前端设计", slug: "ui-frontend", description: "界面设计、前端组件相关提示词", isDefault: true, sortOrder: 4 },
  { name: "架构设计", slug: "architecture", description: "系统架构、技术设计相关提示词", isDefault: true, sortOrder: 5 },
  { name: "测试", slug: "testing", description: "单元测试、集成测试相关提示词", isDefault: true, sortOrder: 6 },
  { name: "文档", slug: "documentation", description: "文档生成、注释相关提示词", isDefault: true, sortOrder: 7 },
  { name: "学习解释", slug: "learning", description: "学习、概念解释相关提示词", isDefault: true, sortOrder: 8 },
  { name: "数据处理", slug: "data-processing", description: "数据处理、转换、分析相关提示词", isDefault: true, sortOrder: 9 },
  { name: "产品设计", slug: "product-design", description: "产品设计、需求分析相关提示词", isDefault: true, sortOrder: 10 },
  { name: "DevOps/部署", slug: "devops", description: "部署、CI/CD、运维相关提示词", isDefault: true, sortOrder: 11 },
  { name: "AI Agent/工作流", slug: "ai-agent", description: "AI Agent、自动化工作流相关提示词", isDefault: true, sortOrder: 12 },
  { name: "其他", slug: "other", description: "其他未分类提示词", isDefault: true, sortOrder: 13 },
];

async function main() {
  console.log("Seeding database...");

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);

  const defaultSettings = [
    { key: "ai_provider", value: "" },
    { key: "ai_api_key", value: "" },
    { key: "ai_model", value: "" },
    { key: "ai_base_url", value: "" },
    { key: "sync_interval", value: "manual" },
    { key: "last_sync_at", value: "" },
    { key: "theme", value: "light" },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`Seeded ${defaultSettings.length} default settings.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
