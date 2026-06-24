import { Star, Copy, Eye, Heart } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { cn } from "@/lib/utils";

interface PromptCardProps {
  prompt: {
    id: string;
    title: string;
    description: string;
    contentPreview: string;
    source: string;
    favorite: boolean;
    usageCount: number;
    updatedAt: string;
    category?: { name: string; slug: string } | null;
    tags: string[];
  };
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export default function PromptCard({ prompt, selected = false, onSelect }: PromptCardProps) {
  const { copied, copy } = useClipboard();

  const isDefault = prompt.source === "DEFAULT";

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border",
      )}
      onClick={() => onSelect?.(prompt.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{prompt.title}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                isDefault
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              )}
            >
              {isDefault ? "Default Template" : "My Prompt"}
            </span>
          </div>
          {prompt.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{prompt.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copy(prompt.contentPreview);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="复制内容"
          >
            <Copy className={cn("h-4 w-4", copied && "text-green-500")} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(prompt.id);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tags and metadata */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {prompt.category && (
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {prompt.category.name}
          </span>
        )}
        {prompt.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {prompt.favorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
        <span>使用 {prompt.usageCount} 次</span>
        <span>{new Date(prompt.updatedAt).toLocaleDateString("zh-CN")}</span>
      </div>
    </div>
  );
}
