import { create } from "zustand";

interface PromptFilters {
  q: string;
  source: string;
  category: string;
  tags: string;
  favorite: boolean | undefined;
  sort: "best" | "updated" | "usage" | "created";
  order: "asc" | "desc";
  page: number;
  limit: number;
}

interface PromptState {
  filters: PromptFilters;
  setFilter: <K extends keyof PromptFilters>(key: K, value: PromptFilters[K]) => void;
  setFilters: (updates: Partial<PromptFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: PromptFilters = {
  q: "",
  source: "",
  category: "",
  tags: "",
  favorite: undefined,
  sort: "best",
  order: "desc",
  page: 1,
  limit: 20,
};

export const usePromptStore = create<PromptState>((set) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...{ [key]: value } as Partial<PromptFilters>,
        page: key !== "page" ? 1 : (value as number),
      },
    })),
  setFilters: (updates) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...updates,
        page: updates.page ?? 1,
      },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
