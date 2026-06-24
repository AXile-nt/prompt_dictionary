# Prompt Dictionary

![Prompt Dictionary cover](docs/assets/cover.png)

Local-first prompt management for collecting, searching, categorizing, and improving prompt templates.

## Features

- Prompt CRUD with categories, tags, favorites, usage counts, and version history.
- In-page prompt detail panel for fast browsing.
- Search with multiple sort modes, including best-match ranking.
- Online default prompt sync from public prompt-template sources.
- Local custom prompt import from Markdown or text files.
- Optional OpenAI-compatible AI classification and optimization.

## Tech Stack

- pnpm workspace + Turborepo
- React + Vite + Tailwind CSS
- Express API server
- Prisma + SQLite

## Requirements

- Node.js 18 or newer
- pnpm 9 or newer

If pnpm is not installed:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## Quick Start

```bash
git clone https://github.com/AXile-nt/prompt_dictionary.git
cd prompt_dictionary
pnpm install
pnpm setup:local
pnpm dev
```

Then open:

```text
http://localhost:5173
```

The API server runs at:

```text
http://localhost:3001
```

## Environment

`pnpm setup:local` creates `.env` from `.env.example` if it does not already exist.

Default local settings:

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

AI settings are optional. Leave them empty if you only need prompt storage, search, import, and sync.

## Useful Commands

```bash
pnpm dev                  # Start web and API in development mode
pnpm build                # Build all packages
pnpm lint                 # Type-check all packages
pnpm setup:local          # Create local env, apply migrations, seed defaults
pnpm db:studio            # Open Prisma Studio
pnpm sync:default-prompts # Pull public default prompt templates
```

Import local prompts from a folder:

```bash
pnpm import:local-prompts -- ./my-prompts
```

Or set `LOCAL_PROMPT_DIR` in your local `.env` and run:

```bash
pnpm import:local-prompts
```

## Privacy Notes

This project is designed so private runtime data is not committed:

- `.env` is ignored.
- SQLite databases under `packages/database/prisma/` are ignored.
- Build outputs, local logs, and tool runtime folders are ignored.
- Local prompt import paths are provided by the user at runtime and are not hard-coded.

Before publishing a fork, read [docs/PRIVACY.md](docs/PRIVACY.md).

## Default Prompt Sources

The app can sync public prompt templates from configured online sources. Synced templates are stored in your local SQLite database only.

## Project Layout

```text
apps/web        React/Vite frontend
apps/server     Express API and import/sync services
packages/shared Shared TypeScript types and constants
packages/database Prisma schema, migrations, and seed
```

## GitHub Publishing Checklist

1. Run `pnpm lint` and `pnpm build`.
2. Confirm `.env` and `packages/database/prisma/*.db` are not present in the files to publish.
3. Confirm no personal prompt folders or API keys are referenced.
4. Publish the cleaned source tree, not `node_modules`, `dist`, `.turbo`, or local runtime folders.
