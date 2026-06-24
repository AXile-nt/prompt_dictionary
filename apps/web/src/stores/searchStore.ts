import { create } from "zustand";

interface SearchState {
  query: string;
  results: any[] | null;
  total: number;
  isSearching: boolean;
  searchHistory: string[];
  setQuery: (q: string) => void;
  setResults: (results: any[] | null, total: number) => void;
  setIsSearching: (v: boolean) => void;
  addToHistory: (q: string) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  results: null,
  total: 0,
  isSearching: false,
  searchHistory: [],
  setQuery: (q) => set({ query: q }),
  setResults: (results, total) => set({ results, total }),
  setIsSearching: (v) => set({ isSearching: v }),
  addToHistory: (q) =>
    set((state) => ({
      searchHistory: [q, ...state.searchHistory.filter((h) => h !== q)].slice(0, 10),
    })),
  clearResults: () => set({ results: null, total: 0, query: "" }),
}));
