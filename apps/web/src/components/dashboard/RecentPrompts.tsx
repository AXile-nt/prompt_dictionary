import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";

interface RecentPrompt {
  id: string;
  title: string;
  source: string;
  category: { name: string; slug: string } | null;
  updatedAt: string;
}

export default function RecentPrompts() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<RecentPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      setLoading(true);
      try {
        const res = await fetch("/api/prompts?sort=updated&order=desc&limit=5");
        const data = await res.json();
        if (data.success) {
          setPrompts(data.data || []);
        }
      } catch {
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Prompts</h3>
        <button
          onClick={() => navigate("/prompts")}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No prompts yet
          </div>
        ) : (
          prompts.map((prompt) => {
            const isDefault = prompt.source === "DEFAULT";
            return (
              <button
                key={prompt.id}
                onClick={() => navigate(`/prompts/${prompt.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {prompt.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        isDefault
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      )}
                    >
                      {isDefault ? "Default" : "Custom"}
                    </span>
                    {prompt.category && (
                      <span className="text-xs text-muted-foreground">
                        {prompt.category.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(prompt.updatedAt).toLocaleDateString("zh-CN")}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
