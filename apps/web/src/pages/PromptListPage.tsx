import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { usePrompts } from "@/hooks/usePrompts";
import { usePromptStore } from "@/stores/promptStore";
import PromptCard from "@/components/prompts/PromptCard";
import PromptFilters from "@/components/prompts/PromptFilters";
import PromptDetailPanel from "@/components/prompts/PromptDetailPanel";

export default function PromptListPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const params = useParams<{ slug: string }>();
  const { filters, setFilter, setFilters } = usePromptStore();
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(searchParams.get("selected"));

  const routeFilters = useMemo(() => {
    if (location.pathname === "/default-prompts") return { source: "DEFAULT", sort: "best" as const };
    if (location.pathname === "/my-prompts") return { source: "CUSTOM", sort: "best" as const };
    if (location.pathname === "/favorites") return { favorite: true, sort: "updated" as const };
    if (location.pathname === "/recent") return { sort: "updated" as const, order: "desc" as const };
    if (location.pathname.startsWith("/categories/")) return { category: params.slug || "", sort: "best" as const };
    return {};
  }, [location.pathname, params.slug]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const source = searchParams.get("source") || routeFilters.source || "";
    const category = searchParams.get("category") || routeFilters.category || "";
    const favoriteParam = searchParams.get("favorite");
    const favorite = favoriteParam === "true" ? true : routeFilters.favorite;
    const sort = searchParams.get("sort") || routeFilters.sort || (q ? "best" : "updated");
    const order = searchParams.get("order") || routeFilters.order || "desc";
    const selected = searchParams.get("selected");

    setFilters({
      q,
      source,
      category,
      favorite,
      sort: sort as any,
      order: order as any,
    });
    if (selected) setSelectedPromptId(selected);
  }, [
    location.pathname,
    searchParams,
    routeFilters.source,
    routeFilters.category,
    routeFilters.favorite,
    routeFilters.sort,
    routeFilters.order,
    setFilters,
  ]);

  const { data, loading, error, refetch } = usePrompts(filters);

  useEffect(() => {
    if (!data || data.items.length === 0) {
      setSelectedPromptId(null);
      return;
    }
    if (!selectedPromptId || !data.items.some((item: any) => item.id === selectedPromptId)) {
      setSelectedPromptId(data.items[0].id);
    }
  }, [data, selectedPromptId]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <PromptFilters />

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            共 {data.total} 条提示词
          </p>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid content-start gap-4">
              {data.items.map((prompt: any) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  selected={prompt.id === selectedPromptId}
                  onSelect={setSelectedPromptId}
                />
              ))}
            </div>
            <PromptDetailPanel
              promptId={selectedPromptId}
              onClose={() => setSelectedPromptId(null)}
              onChanged={refetch}
            />
          </div>

          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setFilter("page", Math.max(1, data.page - 1))}
                disabled={data.page <= 1}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-muted-foreground">
                {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setFilter("page", Math.min(data.totalPages, data.page + 1))}
                disabled={data.page >= data.totalPages}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <p className="text-lg">暂无提示词</p>
          <p className="mt-1 text-sm">试试调整筛选条件或添加新的提示词</p>
        </div>
      )}
    </div>
  );
}
