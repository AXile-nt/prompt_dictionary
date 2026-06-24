// Zustand store for application settings.
// Loads from and saves to the backend API.

import { create } from 'zustand';

interface SettingsState {
  settings: Record<string, string> | null;
  loading: {
    settings: boolean;
    save: boolean;
    testConnection: boolean;
    export: boolean;
  };
  testStatus: boolean | null;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveSettings: (updates: Record<string, string>) => Promise<void>;
  testConnection: (config: {
    provider: string;
    baseUrl: string;
    apiKey: string;
    model: string;
  }) => Promise<void>;
  exportCustomPrompts: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: {
    settings: false,
    save: false,
    testConnection: false,
    export: false,
  },
  testStatus: null,
  error: null,

  loadSettings: async () => {
    set((s) => ({ loading: { ...s.loading, settings: true }, error: null }));
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        set({ settings: data.data });
      } else {
        set({ error: data.error });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load settings' });
    } finally {
      set((s) => ({ loading: { ...s.loading, settings: false } }));
    }
  },

  saveSettings: async (updates) => {
    set((s) => ({ loading: { ...s.loading, save: true }, error: null }));
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        set({ settings: data.data });
      } else {
        set({ error: data.error });
        throw new Error(data.error);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save settings' });
      throw err;
    } finally {
      set((s) => ({ loading: { ...s.loading, save: false } }));
    }
  },

  testConnection: async (config) => {
    set((s) => ({
      loading: { ...s.loading, testConnection: true },
      testStatus: null,
      error: null,
    }));
    try {
      const response = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      set({
        testStatus: data.success && data.data?.connected === true,
        error: data.success ? null : data.error,
      });
    } catch (err) {
      set({
        testStatus: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      set((s) => ({ loading: { ...s.loading, testConnection: false } }));
    }
  },

  exportCustomPrompts: async () => {
    set((s) => ({ loading: { ...s.loading, export: true }, error: null }));
    try {
      const response = await fetch('/api/prompts?source=custom&limit=9999');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Export failed');
      }

      const prompts = data.data?.items ?? data.data ?? [];
      const blob = new Blob([JSON.stringify(prompts, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-dictionary-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Export failed' });
    } finally {
      set((s) => ({ loading: { ...s.loading, export: false } }));
    }
  },
}));
