# Prompt Dictionary Project Notes

## 项目定位

Prompt Dictionary 是一个本地优先的提示词管理应用。它面向经常使用 AI 工具的个人用户和开发者，帮助他们把零散提示词整理成可搜索、可分类、可版本管理的本地知识库。

核心目标：

- 本地保存个人提示词，不把私有内容默认上传到第三方。
- 支持同步公开提示词模板，作为默认模板库。
- 支持从本地文件导入自定义提示词。
- 支持可选 AI 分类和优化，但不强制绑定任何在线模型。

## 当前架构

```text
apps/web
  React + Vite 前端。负责仪表盘、提示词列表、详情页、导入页、同步页和设置页。

apps/server
  Express API 服务。负责提示词 CRUD、搜索、分类、导入、同步、设置和 AI 调用。

packages/database
  Prisma + SQLite。保存提示词、分类、标签、版本历史、设置和导入任务。

packages/shared
  共享类型和默认分类常量。

scripts
  本地初始化脚本。处理 .env 创建、Prisma 生成、迁移和默认数据初始化。
```

## 数据模型

主要表：

- `Prompt`: 提示词主体，包含标题、描述、正文、来源、外部来源、收藏、使用次数、归档和同步时间。
- `Category`: 分类，内置代码开发、代码优化、Bug 修复、UI/前端设计、架构设计等默认分类。
- `PromptTag`: 标签。
- `PromptTagRelation`: 提示词和标签的多对多关系。
- `PromptVersion`: 提示词版本历史。
- `AppSetting`: 本地应用设置，包括 AI 配置、同步偏好和主题。
- `ImportJob`: 导入任务状态。

SQLite 数据库默认位于：

```text
packages/database/prisma/dev.db
```

该数据库是本机运行数据，已被 `.gitignore` 排除。

## API 概览

服务入口：

```text
http://localhost:3001/api
```

主要路由：

- `GET /api/health`: 健康检查。
- `/api/prompts`: 提示词列表、详情、创建、更新、删除和复制。
- `/api/search`: 搜索提示词。
- `/api/categories`: 分类列表。
- `/api/import`: 上传、预览和确认导入本地提示词。
- `/api/sync`: 同步公开默认模板。
- `/api/settings`: 读取、保存和测试 AI 设置。

## 默认模板同步

默认模板同步目前从公开 GitHub 内容读取：

- `f/prompts.chat`
- `PlexPt/awesome-chatgpt-prompts-zh`
- `dair-ai/Prompt-Engineering-Guide`

同步过程只写入本地 SQLite，不会把本地自定义提示词推送到远端。

## AI 配置

AI 功能是可选能力。未配置时，应用会使用关键词规则进行基础分类。

支持的提供商：

- OpenAI
- Claude
- Ollama
- LM Studio

在线提供商的 API Key 保存在本地数据库中，当前实现是轻量混淆而不是加密。不要发布或分享包含真实密钥的本地数据库。

## 本地初始化

推荐初始化命令：

```bash
pnpm install
pnpm setup:local
pnpm dev
```

`setup-local.mjs` 会做这些事：

1. 如果 `.env` 不存在，从 `.env.example` 创建。
2. 生成 Prisma Client。
3. 执行数据库迁移。
4. 初始化默认分类和默认设置。
5. 在 Windows 非 ASCII 路径下使用临时 ASCII junction 规避 Prisma 路径问题。

## 发布内容

应该提交：

- 源码
- Prisma schema 和 migrations
- `.env.example`
- README、LICENSE、docs 文档
- 封面图等项目展示素材
- `pnpm-lock.yaml`

不应该提交：

- `.env`
- SQLite 数据库文件
- `node_modules`
- `dist`
- `.turbo`
- 本地 prompt 目录
- API Key、访问令牌、个人路径、日志和缓存

## 发布验证

发布前执行：

```bash
pnpm lint
pnpm build
```

并检查：

```bash
git status --short --ignored
rg -n "USERPROFILE|HOME|API_KEY=.+|sk-[A-Za-z0-9]|LOCAL_PROMPT_DIR=.+" .
Get-ChildItem packages/database/prisma -Include *.db,*.db.bak,*.sqlite -Recurse
```

如果存在 `.env`、数据库、真实密钥、个人路径或本地 prompt 内容，不应提交。

## Release 说明

当前发布版本跟随 `package.json` 版本。`v0.1.0` 是首次 GitHub 源码发布版本，包含：

- React/Vite 前端
- Express API 服务
- Prisma/SQLite 本地数据库
- 默认模板同步
- 本地文件导入
- 可选 AI 分类和优化
- 隐私发布检查和 MIT License
