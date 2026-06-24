import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface SyncStatus {
  lastSyncAt: string | null;
  stats: { total: number; new: number; updated: number; skipped: number; errors: number } | null;
  defaultPromptCount: number;
}

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sync/status");
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync/default-prompts", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult(data.data);
        fetchStatus();
      } else {
        setError(data.error || "同步失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-6">默认模板同步</h2>

      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">数据来源</p>
            <a href="https://github.com/f/prompts.chat" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              f/prompts.chat
            </a>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">默认模板数量</p>
            <p className="text-lg font-semibold">{status?.defaultPromptCount ?? "-"}</p>
          </div>
        </div>

        {status?.lastSyncAt && (
          <p className="text-sm text-muted-foreground mb-4">
            上次同步: {new Date(status.lastSyncAt).toLocaleString("zh-CN")}
          </p>
        )}

        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 h-10 rounded-md bg-primary text-primary-foreground px-6 text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "同步中..." : "立即同步"}
        </button>
      </div>

      {syncResult && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">同步完成</h3>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold">{syncResult.stats.total}</p><p className="text-xs text-muted-foreground">总计</p></div>
            <div><p className="text-2xl font-bold text-green-600">{syncResult.stats.new}</p><p className="text-xs text-muted-foreground">新增</p></div>
            <div><p className="text-2xl font-bold text-blue-600">{syncResult.stats.updated}</p><p className="text-xs text-muted-foreground">更新</p></div>
            <div><p className="text-2xl font-bold text-yellow-600">{syncResult.stats.skipped}</p><p className="text-xs text-muted-foreground">跳过</p></div>
          </div>
          {syncResult.stats.errors > 0 && (
            <p className="mt-3 text-sm text-destructive">{syncResult.stats.errors} 条错误</p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 mt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
