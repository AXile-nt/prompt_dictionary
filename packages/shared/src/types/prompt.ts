export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  categoryId: string | null;
  source: PromptSource;
  externalId: string | null;
  externalSource: string | null;
  targetModels: string[];
  useCases: string[];
  placeholders: string[];
  favorite: boolean;
  usageCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  lastSyncedAt: string | null;
  tags: string[];
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  title: string;
  description: string;
  content: string;
  categoryId: string | null;
  tags: string[];
  changeNote: string;
  createdAt: string;
}

export interface PromptCreateInput {
  title: string;
  description?: string;
  content: string;
  categoryId?: string | null;
  source?: PromptSource;
  externalId?: string | null;
  externalSource?: string | null;
  targetModels?: string[];
  useCases?: string[];
  placeholders?: string[];
  tags?: string[];
  favorite?: boolean;
  notes?: string;
}

export interface PromptUpdateInput {
  title?: string;
  description?: string;
  content?: string;
  categoryId?: string | null;
  targetModels?: string[];
  useCases?: string[];
  placeholders?: string[];
  tags?: string[];
  favorite?: boolean;
  isArchived?: boolean;
  changeNote?: string;
  saveAsVersion?: boolean;
}

export type PromptListItem = Omit<Prompt, "content"> & {
  contentPreview: string;
};

export enum PromptSource {
  DEFAULT = "DEFAULT",
  CUSTOM = "CUSTOM",
}
