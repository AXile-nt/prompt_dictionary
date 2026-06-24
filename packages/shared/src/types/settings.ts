export interface AppSettings {
  ai_provider: string;
  ai_api_key: string;
  ai_model: string;
  ai_base_url: string;
  sync_interval: "daily" | "weekly" | "manual";
  last_sync_at: string;
  theme: "light" | "dark" | "system";
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export type AIProvider = "openai" | "claude" | "ollama" | "lmstudio" | "none";
