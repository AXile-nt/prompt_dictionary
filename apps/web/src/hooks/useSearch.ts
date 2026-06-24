import { useCallback, useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/searchStore";

const API_BASE = "/api";

export function useSearch() {
  const { query, setResults, setIsSearching, addToHistory } = useSearchStore();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim()) {
        setResults(null, 0);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsSearching(true);
        try {
          const res = await fetch(
            `${API_BASE}/search?q=${encodeURIComponent(q)}&limit=20`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (!controller.signal.aborted) {
            setResults(data.data || [], data.meta?.total || 0);
            addToHistory(q);
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            setResults([], 0);
          }
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [setResults, setIsSearching, addToHistory]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { search };
}
