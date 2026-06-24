// Hook for AI optimize and classify API calls.

import { useState, useCallback } from 'react';

interface OptimizeResponse {
  original: string;
  optimized: string;
  changes_summary: string;
}

/** Hook for AI-powered prompt operations. */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Call the optimize API for a given prompt. */
  const optimize = useCallback(
    async (promptId: string, goal: string): Promise<OptimizeResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/prompts/${promptId}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Optimization failed');
          return null;
        }

        return data.data as OptimizeResponse;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { optimize, loading, error };
}
