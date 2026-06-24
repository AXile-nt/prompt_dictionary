# Prompt Dictionary

![Prompt Dictionary cover](docs/assets/cover.png)

Prompt Dictionary 是一个本地优先的提示词管理工具，用来收集、检索、分类、导入、同步和优化提示词模板。它默认把数据保存在本机 SQLite 数据库中，适合个人整理 AI 编程、写作、产品、测试、架构和工作流提示词。

## 功能特性

- 提示词增删改查：支持标题、描述、正文、分类、标签、收藏、使用次数和归档状态。
- 快速检索：支持关键词搜索、分类筛选、来源筛选、收藏筛选和多种排序方式。
- 默认模板同步：可从公开提示词来源同步默认模板，写入本地数据库。
- 本地提示词导入：支持 JSON、Markdown、TXT、CSV 文件导入，并在导入前预览。
- 版本历史：编辑提示词时保留版本记录，便于回溯和对比。
- AI 辅助：可选 OpenAI、Claude、Ollama、LM Studio 等兼容提供商，用于自动分类和提示词优化。
- 本地优先隐私：`.env`、SQLite 数据库、构建产物和本地运行目录默认不会提交到仓库。

## 技术栈

- Monorepo: pnpm workspace + Turborepo
- Frontend: React + Vite + Tailwind CSS + Zustand + React Router
- Backend: Express + TypeScript
- Database: Prisma + SQLite
- AI: OpenAI-compatible chat completions interface

## 环境要求

- Node.js 18+
- pnpm 9+
- Git

如果本机没有 pnpm，可以先启用 Corepack：

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## 快速开始

```bash
git clone https://github.com/AXile-nt/prompt_dictionary.git
cd prompt_dictionary
pnpm install
pnpm setup:local
pnpm dev
```

启动后访问：

```text
http://localhost:5173
```

API 服务默认运行在：

```text
http://localhost:3001
```

## 本地配置

`pnpm setup:local` 会在仓库根目录创建 `.env`，并执行 Prisma Client 生成、数据库迁移和默认分类初始化。

`.env.example` 提供默认配置：

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=file:./dev.db

AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
LOCAL_PROMPT_DIR=
```

说明：

- `DATABASE_URL=file:./dev.db` 指向 `packages/database/prisma/dev.db`。
- `AI_*` 为空时，应用仍可正常使用，只是不会调用在线 AI 分类和优化。
- `LOCAL_PROMPT_DIR` 只在本机使用，发布仓库时应保持为空。
- Windows 中文路径下，`setup-local.mjs` 会自动使用临时 ASCII 路径处理 Prisma 初始化。

## 常用命令

```bash
pnpm dev                  # 启动前端和后端开发服务
pnpm build                # 构建所有 workspace 包
pnpm lint                 # TypeScript 类型检查
pnpm setup:local          # 初始化 .env、数据库迁移和默认数据
pnpm db:studio            # 打开 Prisma Studio
pnpm sync:default-prompts # 同步公开默认提示词模板
pnpm import:local-prompts # 从 LOCAL_PROMPT_DIR 或命令参数导入提示词
```

从指定目录导入本地提示词：

```bash
pnpm import:local-prompts -- ./my-prompts
```

## 默认模板来源

应用当前支持从以下公开来源同步默认提示词：

- `f/prompts.chat`
- `PlexPt/awesome-chatgpt-prompts-zh`
- `dair-ai/Prompt-Engineering-Guide`

同步结果只写入本地 SQLite 数据库，不会自动上传到任何远端服务。

## 项目结构

```text
apps/web                 React/Vite 前端应用
apps/server              Express API、导入、同步和 AI 服务
packages/shared          共享 TypeScript 类型和常量
packages/database        Prisma schema、迁移和数据库客户端
docs                     项目说明、隐私说明和发布素材
scripts                  本地初始化脚本
```

## 隐私与安全

本仓库按本地优先方式整理，发布内容不应包含个人提示词、API Key、SQLite 数据库或机器路径。

默认忽略：

- `.env`
- `node_modules/`
- `dist/`
- `.turbo/`
- `.codex-run/`
- `.playwright-mcp/`
- `packages/database/prisma/*.db`
- `packages/database/prisma/*.sqlite`
- 日志、临时文件和本地 IDE 配置

发布或 fork 前建议阅读：

- [隐私说明](docs/PRIVACY.md)
- [项目说明](docs/PROJECT.md)

## GitHub 发布检查

```bash
pnpm lint
pnpm build
rg -n "USERPROFILE|HOME|API_KEY=.+|sk-[A-Za-z0-9]|LOCAL_PROMPT_DIR=.+" .
Get-ChildItem packages/database/prisma -Include *.db,*.db.bak,*.sqlite -Recurse
```

预期结果：

- `pnpm lint` 和 `pnpm build` 通过。
- 不提交 `.env`、SQLite 数据库、个人 prompt 目录、API Key、缓存或构建产物。
- Release 使用 GitHub CLI 创建，源码包使用 `git archive` 生成。

## License

MIT License. See [LICENSE](LICENSE).
