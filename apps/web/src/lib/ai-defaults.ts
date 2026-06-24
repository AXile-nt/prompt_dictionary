// AI provider default configuration values.
// Mirrored from apps/server/src/ai/interface.ts to avoid cross-package imports in Vite.

export const PROVIDER_DEFAULTS = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
  claude: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
  ollama: { baseUrl: 'http://localhost:11434/v1', model: 'llama3' },
  lmstudio: { baseUrl: 'http://localhost:1234/v1', model: 'default' },
} as const;

export type AIProvider = 'none' | 'openai' | 'claude' | 'ollama' | 'lmstudio';
