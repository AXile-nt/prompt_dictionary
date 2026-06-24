import { useState, useEffect, useCallback, useRef } from "react";
import { api, PromptListParams } from "@/lib/api";

interface PromptListResult {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function usePrompts(params: PromptListParams) {
  const [data, setData] = useState<PromptListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchPrompts = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getPrompts(params);
      if (requestId !== requestIdRef.current) return;
      if (response.success && response.data) {
        setData({
          items: response.data,
          total: response.meta?.total || 0,
          page: response.meta?.page || 1,
          limit: response.meta?.limit || 20,
          totalPages: response.meta?.totalPages || 0,
        });
      } else {
        setError(response.error || "Failed to fetch prompts");
        setData(null);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [params.q, params.source, params.category, params.tags, params.favorite, params.sort, params.order, params.page, params.limit]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return { data, loading, error, refetch: fetchPrompts };
}
