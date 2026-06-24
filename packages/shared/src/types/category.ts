export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  promptCount?: number;
}

export interface CategoryCreateInput {
  name: string;
  slug: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface CategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}
