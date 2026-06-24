# Privacy Guide

This repository should not include personal prompt content, API keys, local databases, or machine-specific paths.

## Never Commit

- `.env`
- SQLite database files such as `packages/database/prisma/dev.db`
- Database backups such as `*.db.bak`
- Local prompt folders
- `node_modules/`
- `dist/`
- `.turbo/`
- `.codex-run/`
- `.playwright-mcp/`
- Logs and temporary files

## Local Prompt Import

Local prompts are imported only when the user explicitly runs:

```bash
pnpm import:local-prompts -- <path-to-folder>
```

The folder path can also be provided through `LOCAL_PROMPT_DIR` in `.env`. Keep `.env` private.

The import script uses a generic source id, `local-custom-prompts`, so published code does not disclose any personal folder naming convention.

## API Keys

AI API keys are optional. If configured through the app, they are stored in the local SQLite database. The database is intentionally ignored by Git.

The current storage is lightweight obfuscation, not encryption. Do not publish or share your local database if it may contain secrets or private prompts.

## Before Publishing

Run these checks from the repository root:

```bash
rg -n "USERPROFILE|HOME|API_KEY=.+|sk-[A-Za-z0-9]|LOCAL_PROMPT_DIR=.+" .
Get-ChildItem packages/database/prisma -Include *.db,*.db.bak,*.sqlite -Recurse
```

Both checks should return no private values in the files you plan to publish.
