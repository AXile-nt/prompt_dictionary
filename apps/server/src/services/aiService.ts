// AI orchestration service.
// Tries AI classification first, falls back to keyword rules.
// Optimization requires AI to be configured.

import type {
  AIClient,
  AIProvider,
  AISettings,
  ClassifyResult,
  OptimizeResult,
} from '../ai/interface';
import { PROVIDER_DEFAULTS } from '../ai/interface';
import { OpenAICompatibleClient } from '../ai/openai-client';

// ---------------------------------------------------------------------------
// Keyword-rule fallback (used when no AI is configured)
// ---------------------------------------------------------------------------

const KEYWORD_RULES: Array<{
  category: string;
  keywords: string[];
}> = [
  {
    category: 'UI/前端设计',
    keywords: ['UI', '界面', 'React', 'Tailwind', 'CSS', '组件', 'Vue', 'Angular', 'Svelte', '样式', '布局', 'responsive', 'frontend', '按钮', '表单', 'modal', 'dialog', '动画', 'animation'],
  },
  {
    category: 'Bug修复',
    keywords: ['bug', 'error', '报错', 'debug', '异常', '崩溃', 'crash', '故障', '排查', 'diagnose', 'fix', '修复', 'traceback', 'stack trace', 'segmentation'],
  },
  {
    category: '代码优化',
    keywords: ['optimize', '优化', '性能', 'refactor', '重构', '效率', '性能提升', 'bottleneck', 'profiling', 'memory leak', '内存泄漏', '缓存', 'cache'],
  },
  {
    category: '测试',
    keywords: ['test', '测试', '单元测试', 'pytest', 'jest', 'vitest', 'e2e', 'integration test', '集成测试', 'TDD', '测试用例', 'coverage', 'mock', 'stub'],
  },
  {
    category: '文档',
    keywords: ['README', '文档', '注释', '说明', 'document', 'documentation', 'API doc', 'docstring', 'JSDoc', 'changelog', '变更日志'],
  },
  {
    category: '架构设计',
    keywords: ['架构', 'architecture', '设计模式', 'design pattern', '系统设计', 'system design', '微服务', 'microservice', 'monorepo', '模块化', '分层'],
  },
  {
    category: 'DevOps/部署',
    keywords: ['deploy', '部署', 'CI/CD', 'Docker', 'Kubernetes', 'k8s', 'GitHub Actions', 'Jenkins', 'Nginx', '运维', 'monitoring', '日志'],
  },
  {
    category: '数据处理',
    keywords: ['数据', 'data', 'ETL', '爬虫', 'scraping', 'CSV', 'JSON', '数据库', 'database', 'SQL', '迁移', 'migration', '清洗', 'transform'],
  },
  {
    category: 'AI Agent/工作流',
    keywords: ['AI', 'agent', '工作流', 'workflow', 'LLM', 'GPT', 'prompt', 'chain', 'RAG', 'embedding', 'vector', '自动化'],
  },
  {
    category: '学习解释',
    keywords: ['解释', 'explain', '什么是', '如何理解', '教程', 'tutorial', '入门', '概念', '原理', '学习', 'learn', '理解'],
  },
];

/** Classify a prompt using keyword rules (no AI required). */
export function classifyByKeywords(content: string): ClassifyResult {
  const lower = content.toLowerCase();
  let bestMatch = '其他';
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule.category;
    }
  }

  const firstLine = content.split('\n')[0]?.trim() ?? '';
  const title = firstLine.length > 20 ? firstLine.slice(0, 20) + '...' : firstLine;

  return {
    title: title || '未命名提示词',
    description: '',
    category: bestMatch,
    tags: [],
    target_models: ['通用'],
    use_cases: [],
  };
}

// ---------------------------------------------------------------------------
// AI Service
// ---------------------------------------------------------------------------

/** Create an AIClient from stored settings. Returns null if AI is not configured. */
export async function getAIClient(): Promise<AIClient | null> {
  const settings = await getAISettingsFromDB();
  if (!settings || settings.provider === 'none') {
    return null;
  }

  return new OpenAICompatibleClient({
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
  });
}

/** Read AI settings from the database. Returns null if provider is 'none' or not set. */
async function getAISettingsFromDB(): Promise<AISettings | null> {
  const { getSettings } = await import('./settingsService');
  const settings = await getSettings();

  const provider = (settings.ai_provider as AIProvider) || 'none';
  if (provider === 'none') {
    return null;
  }

  return {
    provider,
    apiKey: settings.ai_api_key || '',
    baseUrl: settings.ai_base_url || PROVIDER_DEFAULTS[provider]?.baseUrl || '',
    model: settings.ai_model || PROVIDER_DEFAULTS[provider]?.model || '',
  };
}

/**
 * Classify a prompt.
 * Tries AI first; falls back to keyword rules if AI is not available or fails.
 */
export async function classifyPrompt(content: string): Promise<{
  result: ClassifyResult;
  source: 'ai' | 'keyword';
}> {
  try {
    const client = await getAIClient();
    if (client) {
      const result = await client.classify(content);
      return { result, source: 'ai' };
    }
  } catch (err) {
    console.warn('AI classification failed, falling back to keywords:', err);
  }

  return {
    result: classifyByKeywords(content),
    source: 'keyword',
  };
}

/**
 * Optimize a prompt.
 * Requires AI to be configured; throws an error if not.
 */
export async function optimizePrompt(
  content: string,
  goal: string,
): Promise<OptimizeResult> {
  const client = await getAIClient();
  if (!client) {
    throw new Error('AI is not configured. Please configure AI settings first.');
  }
  return client.optimize(content, goal);
}

/**
 * Test an AI configuration without saving it.
 * Useful for the settings page "Test Connection" button.
 */
export async function testAIConfig(
  config: { provider: AIProvider; baseUrl: string; apiKey: string; model: string },
): Promise<boolean> {
  if (config.provider === 'none') {
    return false;
  }

  const client = new OpenAICompatibleClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
  });

  return client.testConnection();
}
