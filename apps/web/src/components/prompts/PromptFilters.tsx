import { Search, X } from "lucide-react";
import { usePromptStore } from "@/stores/promptStore";
import { cn } from "@/lib/utils";

export default function PromptFilters() {
  const { filters, setFilter, resetFilters } = usePromptStore();
  const disableOrder = filters.sort === "best";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="搜索提示词..."
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <select
        value={filters.source}
        onChange={(e) => setFilter("source", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">全部来源</option>
        <option value="DEFAULT">默认模板</option>
        <option value="CUSTOM">我的提示词</option>
      </select>

      <button
        onClick={() => setFilter("favorite", filters.favorite === true ? undefined : true)}
        className={cn(
          "inline-flex h-9 items-center rounded-md border px-3 text-sm transition-colors",
          filters.favorite === true
            ? "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
            : "border-input bg-background text-muted-foreground hover:bg-accent",
        )}
      >
        收藏
      </button>

      <select
        value={filters.sort}
        onChange={(e) => setFilter("sort", e.target.value as any)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="best">Best match</option>
        <option value="updated">最近更新</option>
        <option value="usage">使用最多</option>
        <option value="created">最近创建</option>
      </select>

      <button
        onClick={() => setFilter("order", filters.order === "desc" ? "asc" : "desc")}
        disabled={disableOrder}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        title={disableOrder ? "Best match uses relevance ranking" : filters.order === "desc" ? "降序" : "升序"}
      >
        {filters.order === "desc" ? "↓" : "↑"}
      </button>

      <button
        onClick={resetFilters}
        className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <X className="h-3.5 w-3.5" />
        重置
      </button>
    </div>
  );
}
