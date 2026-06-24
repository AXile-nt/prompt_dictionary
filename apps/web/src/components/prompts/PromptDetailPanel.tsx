import { Copy, Edit, FileDown, Loader2, Sparkles, Star, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePrompt } from "@/hooks/usePrompt";
import { useClipboard } from "@/hooks/useClipboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PromptDetailPanelProps {
  promptId: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export default function PromptDetailPanel({ promptId, onClose, onChanged }: PromptDetailPanelProps) {
  const navigate = useNavigate();
  const { prompt, loading, error, refetch } = usePrompt(promptId || undefined);
  const { copied, copy } = useClipboard();

  const refresh = async () => {
    await refetch();
    onChanged?.();
  };

  if (!promptId) {
    return (
      <aside className="hidden xl:flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground">
        Select a prompt to inspect it here.
      </aside>
    );
  }

  return (
    <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Prompt Detail</p>
          <h2 className="truncate text-sm font-semibold text-foreground">
            {prompt?.title || "Loading..."}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="Close detail panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading prompt
        </div>
      ) : error || !prompt ? (
        <div className="p-4 text-sm text-destructive">{error || "Prompt not found"}</div>
      ) : (
        <div className="max-h-[calc(100vh-5rem)] overflow-y-auto p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                prompt.source === "DEFAULT"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
              )}
            >
              {prompt.source === "DEFAULT" ? "Default Template" : "My Prompt"}
            </span>
            {prompt.category && (
              <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {prompt.category.name}
              </span>
            )}
          </div>

          {prompt.description && (
            <p className="mb-4 text-sm leading-6 text-muted-foreground">{prompt.description}</p>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                copy(prompt.content);
                api.recordUsage(prompt.id);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={async () => {
                const res = await api.toggleFavorite(prompt.id);
                if (res.success) refresh();
              }}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm",
                prompt.favorite
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                  : "border-input bg-background hover:bg-accent",
              )}
            >
              <Star className={cn("h-4 w-4", prompt.favorite && "fill-yellow-400 text-yellow-400")} />
              Favorite
            </button>
            <button
              onClick={() => navigate(`/prompts/${prompt.id}`)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
            >
              <Sparkles className="h-4 w-4" />
              Full view
            </button>
          </div>

          <pre className="mb-4 max-h-[48vh] overflow-auto rounded-md border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground whitespace-pre-wrap">
            {prompt.content}
          </pre>

          {prompt.tags?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {prompt.tags.map((tag: string) => (
                <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {prompt.source === "DEFAULT" ? (
              <button
                onClick={async () => {
                  const res = await api.copyPrompt(prompt.id);
                  if (res.success && res.data?.id) {
                    onChanged?.();
                    navigate(`/prompts?source=CUSTOM&selected=${res.data.id}`);
                  }
                }}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
              >
                <FileDown className="h-4 w-4" />
                Copy to mine
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this prompt?")) return;
                    const res = await api.deletePrompt(prompt.id);
                    if (res.success) {
                      onChanged?.();
                      onClose();
                    }
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive px-3 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
