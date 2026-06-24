import { useState, useEffect, useCallback } from "react";
import { X, History, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionItem {
  versionNumber: number;
  title: string;
  changeNote: string | null;
  createdAt: string;
}

interface VersionDetail {
  versionNumber: number;
  title: string;
  content: string;
  changeNote: string | null;
  createdAt: string;
}

interface VersionHistoryProps {
  promptId: string;
  onRestore: (versionNumber: number) => void;
}

export default function VersionHistory({ promptId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionDetail, setVersionDetail] = useState<VersionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`);
      const data = await res.json();
      if (data.success) {
        setVersions(data.data || []);
      } else {
        setError(data.error || "Failed to load versions");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const fetchVersionDetail = useCallback(async (versionNumber: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions/${versionNumber}`);
      const data = await res.json();
      if (data.success) {
        setVersionDetail(data.data);
      }
    } catch {
      setVersionDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [promptId]);

  const handleVersionClick = (versionNumber: number) => {
    setSelectedVersion(versionNumber);
    fetchVersionDetail(versionNumber);
  };

  const handleRestore = (versionNumber: number) => {
    onRestore(versionNumber);
    setConfirmRestore(null);
    setSelectedVersion(null);
    setVersionDetail(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-muted-foreground">Loading versions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <History className="h-8 w-8 mb-2" />
        <p className="text-sm">No version history</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {versions.map((v) => (
          <button
            key={v.versionNumber}
            onClick={() => handleVersionClick(v.versionNumber)}
            className={cn(
              "w-full text-left rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent",
              selectedVersion === v.versionNumber && "ring-2 ring-ring"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                v{v.versionNumber}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(v.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
            {v.title && (
              <p className="text-sm text-foreground mt-1 truncate">{v.title}</p>
            )}
            {v.changeNote && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{v.changeNote}</p>
            )}
          </button>
        ))}
      </div>

      {/* Detail overlay */}
      {selectedVersion !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-2xl max-h-[80vh] mx-4 rounded-lg border border-border bg-background shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">
                Version {selectedVersion}
              </h3>
              <button
                onClick={() => {
                  setSelectedVersion(null);
                  setVersionDetail(null);
                  setConfirmRestore(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {detailLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : versionDetail ? (
                <div className="space-y-4">
                  {versionDetail.title && (
                    <div>
                      <span className="text-xs text-muted-foreground">Title</span>
                      <p className="text-sm text-foreground mt-1">{versionDetail.title}</p>
                    </div>
                  )}
                  {versionDetail.changeNote && (
                    <div>
                      <span className="text-xs text-muted-foreground">Change Note</span>
                      <p className="text-sm text-foreground mt-1">{versionDetail.changeNote}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground">Content</span>
                    <pre className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-sm text-foreground font-sans leading-relaxed max-h-[40vh] overflow-y-auto">
                      {versionDetail.content}
                    </pre>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(versionDetail.createdAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive">Failed to load version details</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              {confirmRestore === selectedVersion ? (
                <>
                  <span className="text-sm text-muted-foreground mr-auto">Restore this version?</span>
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="inline-flex items-center gap-2 h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm hover:bg-primary/90"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmRestore(null)}
                    className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmRestore(selectedVersion)}
                  className="inline-flex items-center gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore this version
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
