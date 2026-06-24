import { useState } from "react";

interface ParsedItem {
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  suggestedCategory?: string;
  suggestedTags?: string[];
}

interface ImportPreviewProps {
  items: ParsedItem[];
  onConfirm: (items: ParsedItem[]) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ImportPreview({ items, onConfirm, onCancel, loading }: ImportPreviewProps) {
  const [editedItems, setEditedItems] = useState(items);

  const updateItem = (index: number, field: string, value: any) => {
    setEditedItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">预览 ({items.length} 条提示词)</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="h-9 rounded-md border border-input px-4 text-sm hover:bg-accent">取消</button>
          <button
            onClick={() => onConfirm(editedItems)}
            disabled={loading}
            className="h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "导入中..." : `确认导入 ${items.length} 条`}
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {editedItems.map((item, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">标题</label>
                <input
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">分类</label>
                <input
                  value={item.category || item.suggestedCategory || ""}
                  onChange={(e) => updateItem(index, "category", e.target.value)}
                  className="h-8 w-full rounded border border-input bg-background px-2 text-sm"
                  placeholder={item.suggestedCategory}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground">内容预览</label>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.content.substring(0, 200)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
