// Split-view optimize panel with diff highlighting.
// Triggered from PromptDetailPage "Optimize" button.

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';

const OPTIMIZE_PRESETS = [
  { value: '更适合Claude Code', label: '更适合 Claude Code' },
  { value: '更适合Codex', label: '更适合 Codex' },
  { value: '更适合UI设计', label: '更适合 UI 设计' },
  { value: '更适合代码重构', label: '更适合代码重构' },
  { value: '更结构化', label: '更结构化' },
  { value: '更短', label: '更简短' },
  { value: '更严格', label: '更严格' },
  { value: '逐步执行', label: '逐步执行' },
] as const;

interface OptimizePanelProps {
  originalContent: string;
  open: boolean;
  onClose: () => void;
  onSaveAsVersion: (optimizedContent: string) => Promise<void>;
  onReplaceCurrent: (optimizedContent: string) => Promise<void>;
  onSaveAsNew: (optimizedContent: string) => Promise<void>;
  onOptimize: (goal: string) => Promise<{ optimized: string; changes_summary: string }>;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

function computeDiff(original: string, optimized: string): DiffLine[] {
  const origLines = original.split('\n');
  const optLines = optimized.split('\n');
  const origSet = new Set(origLines);
  const optSet = new Set(optLines);
  const result: DiffLine[] = [];

  for (const line of origLines) {
    if (!optSet.has(line)) {
      result.push({ type: 'removed', content: line });
    } else {
      result.push({ type: 'unchanged', content: line });
    }
  }

  for (const line of optLines) {
    if (!origSet.has(line)) {
      result.push({ type: 'added', content: line });
    }
  }

  return result;
}

export default function OptimizePanel({
  originalContent,
  open,
  onClose,
  onSaveAsVersion,
  onReplaceCurrent,
  onSaveAsNew,
  onOptimize,
}: OptimizePanelProps) {
  const [goal, setGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const effectiveGoal = goal === '__custom__' ? customGoal : goal;

  const diffLines = useMemo(() => {
    if (!optimizedContent) return [];
    return computeDiff(originalContent, optimizedContent);
  }, [originalContent, optimizedContent]);

  const handleOptimize = useCallback(async () => {
    if (!effectiveGoal.trim()) return;
    setOptimizing(true);
    setError('');
    setOptimizedContent('');
    setChangesSummary('');

    try {
      const result = await onOptimize(effectiveGoal);
      setOptimizedContent(result.optimized);
      setChangesSummary(result.changes_summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败');
    } finally {
      setOptimizing(false);
    }
  }, [effectiveGoal, onOptimize]);

  const handleAction = useCallback(
    async (action: 'version' | 'replace' | 'new') => {
      if (!optimizedContent) return;
      setSaving(true);
      try {
        switch (action) {
          case 'version':
            await onSaveAsVersion(optimizedContent);
            break;
          case 'replace':
            await onReplaceCurrent(optimizedContent);
            break;
          case 'new':
            await onSaveAsNew(optimizedContent);
            break;
        }
        resetAndClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存失败');
      } finally {
        setSaving(false);
      }
    },
    [optimizedContent, onSaveAsVersion, onReplaceCurrent, onSaveAsNew],
  );

  const resetAndClose = useCallback(() => {
    setGoal('');
    setCustomGoal('');
    setOptimizedContent('');
    setChangesSummary('');
    setError('');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">优化提示词</h2>
            <p className="text-sm text-muted-foreground">
              选择优化目标或输入自定义目标，让 AI 改进你的提示词
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Goal Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">优化目标</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">选择预设目标...</option>
              {OPTIMIZE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              <option value="__custom__">自定义目标...</option>
            </select>

            {goal === '__custom__' && (
              <textarea
                placeholder="描述你的优化目标..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            )}
          </div>

          {/* Optimize Button */}
          <button
            onClick={handleOptimize}
            disabled={optimizing || !effectiveGoal.trim()}
            className="h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {optimizing && <Loader2 className="h-4 w-4 animate-spin" />}
            {optimizing ? 'AI 正在优化...' : '开始优化'}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Changes Summary */}
          {changesSummary && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">优化摘要</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {changesSummary}
              </p>
            </div>
          )}

          {/* Split View: Original vs Optimized */}
          {optimizedContent && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">原始内容</p>
                <div className="border rounded-md p-3 bg-muted/50 max-h-80 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {originalContent}
                  </pre>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">优化后</p>
                <div className="border rounded-md p-3 bg-muted/50 max-h-80 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {optimizedContent}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Diff View */}
          {diffLines.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">差异对比</p>
              <div className="border rounded-md p-3 bg-muted/50 max-h-60 overflow-y-auto font-mono text-sm">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      line.type === 'added' && 'bg-green-500/10 text-green-700 dark:text-green-400',
                      line.type === 'removed' && 'bg-red-500/10 text-red-700 dark:text-red-400 line-through',
                    )}
                  >
                    <span className="inline-block w-6 text-right mr-2 opacity-50">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {optimizedContent && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={resetAndClose}
                disabled={saving}
                className="h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
              >
                放弃
              </button>
              <button
                onClick={() => handleAction('version')}
                disabled={saving}
                className="h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存为新版本'}
              </button>
              <button
                onClick={() => handleAction('replace')}
                disabled={saving}
                className="h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '替换当前内容'}
              </button>
              <button
                onClick={() => handleAction('new')}
                disabled={saving}
                className="h-9 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存为新提示词'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
