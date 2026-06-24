// AI Client abstract interface and shared types.
// All AI provider implementations must conform to this interface.

/** Result returned by AI auto-classification. */
export interface ClassifyResult {
  title: string;
  description: string;
  category: string;
  tags: string[];
  target_models: string[];
  use_cases: string[];
}

/** Result returned by AI prompt optimization. */
export interface OptimizeResult {
  optimized_content: string;
  changes_summary: string;
}

/** Configuration for instantiating an AI client. */
export interface AIClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** Provider-agnostic AI client interface. */
export interface AIClient {
  classify(prompt: string): Promise<ClassifyResult>;
  optimize(prompt: string, goal: string): Promise<OptimizeResult>;
  testConnection(): Promise<boolean>;
}

/** Supported AI provider identifiers. */
export type AIProvider = 'openai' | 'claude' | 'ollama' | 'lmstudio' | 'none';

/** Full AI settings as stored in / retrieved from the backend. */
export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** Default base URLs per provider. */
export const PROVIDER_DEFAULTS: Record<Exclude<AIProvider, 'none'>, { baseUrl: string; model: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
  },
  lmstudio: {
    baseUrl: 'http://localhost:1234/v1',
    model: 'default',
  },
};
