import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, BookOpen, PenLine, Heart, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import RecentPrompts from "@/components/dashboard/RecentPrompts";
import CategoryGrid from "@/components/dashboard/CategoryGrid";

interface StatCounts {
  total: number;
  defaultTemplates: number;
  custom: number;
  favorites: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<StatCounts>({
    total: 0,
    defaultTemplates: 0,
    custom: 0,
    favorites: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchCount = useCallback(async (params: Record<string, string>): Promise<number> => {
    try {
      const qs = new URLSearchParams({ ...params, limit: "1" }).toString();
      const res = await fetch(`/api/prompts?${qs}`);
      const data = await res.json();
      return data.meta?.total ?? 0;
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      const [total, defaultTemplates, custom, favorites] = await Promise.all([
        fetchCount({}),
        fetchCount({ source: "DEFAULT" }),
        fetchCount({ source: "CUSTOM" }),
        fetchCount({ favorite: "true" }),
      ]);
      setStats({ total, defaultTemplates, custom, favorites });
      setStatsLoading(false);
    }
    loadStats();
  }, [fetchCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/prompts?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your prompt library</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts..."
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Prompts"
            value={stats.total}
            icon={<FileText className="h-5 w-5" />}
          />
          <StatCard
            title="Default Templates"
            value={stats.defaultTemplates}
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatCard
            title="My Prompts"
            value={stats.custom}
            icon={<PenLine className="h-5 w-5" />}
          />
          <StatCard
            title="Favorites"
            value={stats.favorites}
            icon={<Heart className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Two-column: Recent + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPrompts />
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Categories</h3>
          </div>
          <CategoryGrid />
        </div>
      </div>
    </div>
  );
}
