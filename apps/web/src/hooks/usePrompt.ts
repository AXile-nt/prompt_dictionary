import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export function usePrompt(id: string | undefined) {
  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompt = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getPrompt(id);
      if (response.success && response.data) {
        setPrompt(response.data);
      } else {
        setError(response.error || "Failed to fetch prompt");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  return { prompt, loading, error, refetch: fetchPrompt };
}
