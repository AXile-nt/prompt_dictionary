import { cn } from "@/lib/utils";

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export default function TagFilter({ availableTags, selectedTags, onToggle }: TagFilterProps) {
  if (availableTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {availableTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={cn(
            "inline-flex items-center rounded-md px-2.5 py-1 text-xs transition-colors",
            selectedTags.includes(tag)
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
