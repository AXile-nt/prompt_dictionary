export enum PromptSource {
  DEFAULT = "DEFAULT",
  CUSTOM = "CUSTOM",
}

export enum ImportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export type SyncInterval = "daily" | "weekly" | "manual";
export type ThemeMode = "light" | "dark" | "system";
export type AIProvider = "openai" | "claude" | "ollama" | "lmstudio" | "none";
