// OpenAI-compatible AI client.
// Works with: OpenAI, Claude (via Messages API), Ollama, LM Studio.
// Uses raw fetch only -- no SDK dependencies.

import type { AIClient, AIClientConfig, ClassifyResult, OptimizeResult } from './interface';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
    code?: string;
  };
}

interface ClaudeMessagesResponse {
  content?: Array<{
    type: string;
    text?: string;
  }>;
  error?: {
    message: string;
  };
}

export class OpenAICompatibleClient implements AIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs = 30_000;

  constructor(config: AIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async classify(prompt: string): Promise<ClassifyResult> {
    const systemPrompt = await this.loadClassifyPrompt();
    const userMessage = `请对以下提示词进行分类：\n\n${prompt}`;
    const raw = await this.chat(systemPrompt, userMessage);
    return this.parseJSON<ClassifyResult>(raw);
  }

  async optimize(prompt: string, goal: string): Promise<OptimizeResult> {
    const systemPrompt = await this.loadOptimizePrompt();
    const userMessage = `原始提示词：\n${prompt}\n\n优化目标：${goal}`;
    const raw = await this.chat(systemPrompt, userMessage);
    return this.parseJSON<OptimizeResult>(raw);
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.chat(
        'You are a test assistant. Reply with exactly: OK',
        'Test connection.',
      );
      return result.length > 0;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async loadClassifyPrompt(): Promise<string> {
    const { CLASSIFY_SYSTEM_PROMPT } = await import('./prompts/classify');
    return CLASSIFY_SYSTEM_PROMPT;
  }

  private async loadOptimizePrompt(): Promise<string> {
    const { OPTIMIZE_SYSTEM_PROMPT } = await import('./prompts/optimize');
    return OPTIMIZE_SYSTEM_PROMPT;
  }

  private async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const isClaude = this.baseUrl.includes('anthropic.com');
    if (isClaude) {
      return this.chatClaude(systemPrompt, userMessage);
    }
    return this.chatOpenAI(systemPrompt, userMessage);
  }

  private async chatOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`AI request failed (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as ChatCompletionResponse;

      if (data.error) {
        throw new Error(`AI API error: ${data.error.message}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI returned empty response');
      }

      return content;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('AI request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private async chatClaude(systemPrompt: string, userMessage: string): Promise<string> {
    const url = `${this.baseUrl}/messages`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Claude request failed (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as ClaudeMessagesResponse;

      if (data.error) {
        throw new Error(`Claude API error: ${data.error.message}`);
      }

      const content = data.content?.find((b) => b.type === 'text')?.text;
      if (!content) {
        throw new Error('Claude returned empty response');
      }

      return content;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Claude request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private parseJSON<T>(raw: string): T {
    let cleaned = raw.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      throw new Error(`Failed to parse AI JSON response: ${cleaned.slice(0, 200)}`);
    }
  }
}
