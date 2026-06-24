import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  detailPanelOpen: boolean;
  selectedPromptId: string | null;
  toggleSidebar: () => void;
  openDetailPanel: (promptId: string) => void;
  closeDetailPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  detailPanelOpen: false,
  selectedPromptId: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openDetailPanel: (promptId: string) =>
    set({ detailPanelOpen: true, selectedPromptId: promptId }),
  closeDetailPanel: () =>
    set({ detailPanelOpen: false, selectedPromptId: null }),
}));
