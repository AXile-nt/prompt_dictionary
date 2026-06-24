import { useParams, useNavigate } from "react-router-dom";
import { usePrompt } from "@/hooks/usePrompt";
import { useClipboard } from "@/hooks/useClipboard";
import { useAI } from "@/hooks/useAI";
import { api } from "@/lib/api";
import { ArrowLeft, Copy, Star, Edit, Trash2, FileDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import OptimizePanel from "@/components/prompts/OptimizePanel";

export default function PromptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { prompt, loading, error, refetch } = usePrompt(id);
  const { copied, copy } = useClipboard();
  const { optimize: aiOptimize } = useAI();
  const [actionLoading, setActionLoading] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  if (error || !prompt) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive mb-4">{error || "提示词未找到"}</p>
        <button onClick={() => navigate("/prompts")} className="text-primary hover:underline">返回列表</button>
      </div>
    );
  }

  const isDefault = prompt.source === "DEFAULT";

  const handleAction = async (action: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await action();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptimize = useCallback(
    async (goal: string) => {
      const result = await aiOptimize(prompt.id, goal);
      if (!result) throw new Error("优化失败");
      return { optimized: result.optimized, changes_summary: result.changes_summary };
    },
    [prompt.id, aiOptimize],
  );

  const handleSaveAsVersion = useCallback(async (content: string) => {
    await api.updatePrompt(prompt.id, { content, saveAsVersion: true } as Record<string, unknown>);
    refetch();
  }, [prompt.id, refetch]);

  const handleReplaceCurrent = useCallback(async (content: string) => {
    await api.updatePrompt(prompt.id, { content } as Record<string, unknown>);
    refetch();
  }, [prompt.id, refetch]);

  const handleSaveAsNew = useCallback(async (content: string) => {
    const result = await api.createPrompt({ title: prompt.title + " (优化版)", content });
    if (result.success && result.data) {
      navigate(`/prompts/${(result.data as { id: string }).id}`);
    }
  }, [prompt.title, navigate]);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{prompt.title}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                isDefault
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              )}
            >
              {isDefault ? "Default Template" : "My Prompt"}
            </span>
          </div>
          {prompt.category && (
            <p className="text-sm text-muted-foreground mt-1">{prompt.category.name}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { copy(prompt.content); api.recordUsage(prompt.id); }}
          className="inline-flex items-center gap-2 h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm hover:bg-primary/90"
        >
          <Copy className="h-4 w-4" />
          {copied ? "已复制!" : "一键复制"}
        </button>

        <button
          onClick={() => handleAction(async () => {
            const res = await api.toggleFavorite(prompt.id);
            if (res.success) refetch();
          })}
          className={cn(
            "inline-flex items-center gap-2 h-9 rounded-md border px-4 text-sm",
            prompt.favorite
              ? "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
              : "border-input bg-background hover:bg-accent"
          )}
        >
          <Star className={cn("h-4 w-4", prompt.favorite && "fill-yellow-400 text-yellow-400")} />
          {prompt.favorite ? "已收藏" : "收藏"}
        </button>

        {/* AI Optimize Button */}
        <button
          onClick={() => setOptimizeOpen(true)}
          className="inline-flex items-center gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
        >
          <Sparkles className="h-4 w-4" />
          AI 优化
        </button>

        {isDefault && (
          <button
            onClick={() => handleAction(async () => {
              const res = await api.copyPrompt(prompt.id);
              if (res.success && res.data) navigate(`/prompts/${res.data.id}`);
            })}
            className="inline-flex items-center gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
          >
            <FileDown className="h-4 w-4" />
            复制为自定义
          </button>
        )}

        {!isDefault && (
          <>
            <button
              onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
              className="inline-flex items-center gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
            >
              <Edit className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={() => {
                if (confirm("确定删除此提示词？")) {
                  handleAction(async () => {
                    const res = await api.deletePrompt(prompt.id);
                    if (res.success) navigate("/prompts");
                  });
                }
              }}
              className="inline-flex items-center gap-2 h-9 rounded-md border border-destructive text-destructive px-4 text-sm hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">提示词内容</h3>
        <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
          {prompt.content}
        </pre>
      </div>

      {/* Metadata */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        {prompt.description && (
          <div className="col-span-2">
            <span className="text-muted-foreground">描述：</span>
            <span className="text-foreground">{prompt.description}</span>
          </div>
        )}
        {prompt.tags.length > 0 && (
          <div className="col-span-2">
            <span className="text-muted-foreground mr-2">标签：</span>
            {prompt.tags.map((tag: string) => (
              <span key={tag} className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground mr-1">{tag}</span>
            ))}
          </div>
        )}
        <div><span className="text-muted-foreground">创建时间：</span>{new Date(prompt.createdAt).toLocaleString("zh-CN")}</div>
        <div><span className="text-muted-foreground">更新时间：</span>{new Date(prompt.updatedAt).toLocaleString("zh-CN")}</div>
        <div><span className="text-muted-foreground">使用次数：</span>{prompt.usageCount}</div>
        <div><span className="text-muted-foreground">来源：</span>{isDefault ? "默认模板" : "自定义"}</div>
      </div>

      {/* Optimize Panel */}
      <OptimizePanel
        originalContent={prompt.content}
        open={optimizeOpen}
        onClose={() => setOptimizeOpen(false)}
        onSaveAsVersion={handleSaveAsVersion}
        onReplaceCurrent={handleReplaceCurrent}
        onSaveAsNew={handleSaveAsNew}
        onOptimize={handleOptimize}
      />
    </div>
  );
}
