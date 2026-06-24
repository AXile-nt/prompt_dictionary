import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DiffViewProps {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
}

type DiffLine = {
  type: "unchanged" | "added" | "removed";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
};

type ViewMode = "unified" | "split";

export function DiffView({ oldText, newText, oldLabel = "Before", newLabel = "After" }: DiffViewProps) {
  const [mode, setMode] = useState<ViewMode>("unified");

  const { diffLines, addedCount, removedCount } = useMemo(() => {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");

    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);

    const lines: DiffLine[] = [];
    let oldIdx = 0;
    let newIdx = 0;
    let added = 0;
    let removed = 0;

    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldIdx < oldLines.length ? oldLines[oldIdx] : null;
      const newLine = newIdx < newLines.length ? newLines[newIdx] : null;

      if (oldLine !== null && newLine !== null && oldLine === newLine) {
        lines.push({ type: "unchanged", content: oldLine, oldLineNum: oldIdx + 1, newLineNum: newIdx + 1 });
        oldIdx++;
        newIdx++;
      } else {
        if (oldLine !== null && !newSet.has(oldLine)) {
          lines.push({ type: "removed", content: oldLine, oldLineNum: oldIdx + 1 });
          oldIdx++;
          removed++;
        }
        if (newLine !== null && !oldSet.has(newLine)) {
          lines.push({ type: "added", content: newLine, newLineNum: newIdx + 1 });
          newIdx++;
          added++;
        }
        if (oldLine !== null && newLine !== null && oldLine !== newLine) {
          if (oldLine !== null && !newSet.has(oldLine) === false) {
            lines.push({ type: "unchanged", content: oldLine, oldLineNum: oldIdx + 1, newLineNum: newIdx + 1 });
            oldIdx++;
            newIdx++;
          }
        }
      }
    }

    // Drain remaining lines
    while (oldIdx < oldLines.length) {
      const line = oldLines[oldIdx];
      if (!newSet.has(line)) {
        lines.push({ type: "removed", content: line, oldLineNum: oldIdx + 1 });
        removed++;
      }
      oldIdx++;
    }
    while (newIdx < newLines.length) {
      const line = newLines[newIdx];
      if (!oldSet.has(line)) {
        lines.push({ type: "added", content: line, newLineNum: newIdx + 1 });
        added++;
      }
      newIdx++;
    }

    return { diffLines: lines, addedCount: added, removedCount: removed };
  }, [oldText, newText]);

  const lineClass = (type: DiffLine["type"]) =>
    cn(
      "px-3 py-0.5 text-sm font-mono whitespace-pre",
      type === "added" && "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      type === "removed" && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      type === "unchanged" && "text-foreground"
    );

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode("unified")}
            className={cn(
              "h-7 rounded-md px-3 text-xs font-medium transition-colors",
              mode === "unified"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            Unified
          </button>
          <button
            onClick={() => setMode("split")}
            className={cn(
              "h-7 rounded-md px-3 text-xs font-medium transition-colors",
              mode === "split"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            Split
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-green-700 dark:text-green-400">+{addedCount} added</span>
          <span className="text-red-700 dark:text-red-400">-{removedCount} removed</span>
        </div>
      </div>

      {/* Diff content */}
      {mode === "unified" ? (
        <div className="overflow-x-auto">
          {diffLines.map((line, idx) => (
            <div key={idx} className={cn("flex border-b border-border/50 last:border-b-0", lineClass(line.type))}>
              <span className="w-10 shrink-0 text-right pr-2 text-muted-foreground select-none text-xs leading-6">
                {line.type === "removed" || line.type === "unchanged" ? line.oldLineNum : ""}
              </span>
              <span className="w-10 shrink-0 text-right pr-2 text-muted-foreground select-none text-xs leading-6">
                {line.type === "added" || line.type === "unchanged" ? line.newLineNum : ""}
              </span>
              <span className="w-5 shrink-0 select-none">
                {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
              </span>
              <span className="flex-1">{line.content}</span>
            </div>
          ))}
          {diffLines.length === 0 && (
            <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
              No differences
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-x divide-border overflow-x-auto">
          {/* Left column (old) */}
          <div>
            <div className="border-b border-border px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50">
              {oldLabel}
            </div>
            {diffLines
              .filter((l) => l.type !== "added")
              .map((line, idx) => (
                <div
                  key={idx}
                  className={cn("flex border-b border-border/50 last:border-b-0", lineClass(line.type))}
                >
                  <span className="w-8 shrink-0 text-right pr-2 text-muted-foreground select-none text-xs leading-6">
                    {line.oldLineNum ?? ""}
                  </span>
                  <span className="flex-1">{line.content}</span>
                </div>
              ))}
          </div>
          {/* Right column (new) */}
          <div>
            <div className="border-b border-border px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50">
              {newLabel}
            </div>
            {diffLines
              .filter((l) => l.type !== "removed")
              .map((line, idx) => (
                <div
                  key={idx}
                  className={cn("flex border-b border-border/50 last:border-b-0", lineClass(line.type))}
                >
                  <span className="w-8 shrink-0 text-right pr-2 text-muted-foreground select-none text-xs leading-6">
                    {line.newLineNum ?? ""}
                  </span>
                  <span className="flex-1">{line.content}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
