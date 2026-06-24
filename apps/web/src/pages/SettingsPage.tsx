// Full settings page with AI configuration, sync interval, theme, and export.

import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import { PROVIDER_DEFAULTS, type AIProvider } from '@/lib/ai-defaults';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    settings,
    loading,
    testStatus,
    loadSettings,
    saveSettings,
    testConnection,
    exportCustomPrompts,
  } = useSettingsStore();

  const { theme, setTheme } = useTheme();

  const [provider, setProvider] = useState<AIProvider>('none');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [syncInterval, setSyncInterval] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setProvider((settings.ai_provider as AIProvider) || 'none');
      if (!apiKey && settings.ai_api_key && !settings.ai_api_key.includes('***')) {
        setApiKey(settings.ai_api_key);
      }
      setBaseUrl(settings.ai_base_url || '');
      setModel(settings.ai_model || '');
      setSyncInterval(settings.sync_interval || 'manual');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const handleProviderChange = useCallback((value: string) => {
    const p = value as AIProvider;
    setProvider(p);
    if (p !== 'none' && PROVIDER_DEFAULTS[p]) {
      setBaseUrl(PROVIDER_DEFAULTS[p].baseUrl);
      setModel(PROVIDER_DEFAULTS[p].model);
    }
    if (p === 'none') {
      setApiKey('');
      setBaseUrl('');
      setModel('');
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await saveSettings({
        ai_provider: provider,
        ai_api_key: apiKey,
        ai_base_url: baseUrl,
        ai_model: model,
        sync_interval: syncInterval,
        theme,
      });
      setSaveMessage('设置已保存');
    } catch {
      setSaveMessage('保存失败');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [provider, apiKey, baseUrl, model, syncInterval, theme, saveSettings]);

  const handleTestConnection = useCallback(async () => {
    await testConnection({ provider, baseUrl, apiKey, model });
  }, [provider, baseUrl, apiKey, model, testConnection]);

  const handleExport = useCallback(async () => {
    await exportCustomPrompts();
  }, [exportCustomPrompts]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-1">
          配置 AI 提供商、同步偏好和外观设置
        </p>
      </div>

      {/* AI Configuration */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">AI 配置</h2>
        <p className="text-sm text-muted-foreground mb-4">
          配置 AI 提供商用于自动分类和提示词优化。支持 OpenAI、Claude、Ollama 和 LM Studio。
        </p>

        <div className="space-y-4">
          {/* Provider */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="ai-provider">AI 提供商</label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">无（使用关键词规则）</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="ollama">Ollama (本地)</option>
              <option value="lmstudio">LM Studio (本地)</option>
            </select>
          </div>

          {provider !== 'none' && (
            <>
              {/* API Key */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="api-key">API Key</label>
                <input
                  id="api-key"
                  type="password"
                  placeholder={provider === 'ollama' || provider === 'lmstudio' ? '本地模型无需 API Key' : '输入 API Key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  {(provider === 'ollama' || provider === 'lmstudio')
                    ? '本地提供商通常不需要 API Key'
                    : 'API Key 以 base64 编码存储在本地'}
                </p>
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="base-url">Base URL</label>
                <input
                  id="base-url"
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  根据提供商自动填充默认值，也可自定义
                </p>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="model">模型名称</label>
                <input
                  id="model"
                  type="text"
                  placeholder="gpt-4o"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  根据提供商自动填充默认模型，也可手动指定
                </p>
              </div>

              {/* Test Connection */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={loading.testConnection}
                  className="h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  {loading.testConnection ? '测试中...' : '测试连接'}
                </button>
                {testStatus !== null && (
                  <span className={cn('text-sm font-medium', testStatus ? 'text-green-600' : 'text-red-600')}>
                    {testStatus ? '连接成功' : '连接失败'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sync Settings */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">同步设置</h2>
        <p className="text-sm text-muted-foreground mb-4">
          控制默认模板从 prompts.chat 同步的频率
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="sync-interval">同步频率</label>
          <select
            id="sync-interval"
            value={syncInterval}
            onChange={(e) => setSyncInterval(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="manual">仅手动同步</option>
          </select>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">外观</h2>
        <p className="text-sm text-muted-foreground mb-4">选择你喜欢的配色主题</p>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="theme">主题</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="system">跟随系统</option>
          </select>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">数据管理</h2>
        <p className="text-sm text-muted-foreground mb-4">导出自定义提示词用于备份或迁移</p>
        <button
          onClick={handleExport}
          className="h-9 rounded-md border border-input bg-background px-4 text-sm hover:bg-accent transition-colors"
        >
          导出自定义提示词 (JSON)
        </button>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 rounded-md bg-primary text-primary-foreground px-6 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
        {saveMessage && (
          <span className={cn(
            'text-sm font-medium',
            saveMessage.includes('保存') && !saveMessage.includes('失败') ? 'text-green-600' : 'text-red-600',
          )}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}
