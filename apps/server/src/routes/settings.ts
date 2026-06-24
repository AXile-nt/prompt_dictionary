// API routes for settings management and AI connection testing.

import { Router, type Request, type Response } from 'express';
import {
  getSettingsForResponse,
  updateSettings,
} from '../services/settingsService';
import { testAIConfig } from '../services/aiService';
import type { AIProvider } from '../ai/interface';

const router: Router = Router();

/** GET /api/settings - Retrieve all settings (API key masked). */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await getSettingsForResponse();
    res.json({ success: true, data: settings, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get settings';
    res.status(500).json({ success: false, data: null, error: message });
  }
});

/** PUT /api/settings - Update settings. */
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;

    if (updates.ai_provider) {
      const validProviders = ['openai', 'claude', 'ollama', 'lmstudio', 'none'];
      if (!validProviders.includes(updates.ai_provider)) {
        res.status(400).json({
          success: false,
          data: null,
          error: `Invalid ai_provider. Must be one of: ${validProviders.join(', ')}`,
        });
        return;
      }
    }

    if (updates.sync_interval) {
      const validIntervals = ['daily', 'weekly', 'manual'];
      if (!validIntervals.includes(updates.sync_interval)) {
        res.status(400).json({
          success: false,
          data: null,
          error: `Invalid sync_interval. Must be one of: ${validIntervals.join(', ')}`,
        });
        return;
      }
    }

    if (updates.theme) {
      const validThemes = ['light', 'dark', 'system'];
      if (!validThemes.includes(updates.theme)) {
        res.status(400).json({
          success: false,
          data: null,
          error: `Invalid theme. Must be one of: ${validThemes.join(', ')}`,
        });
        return;
      }
    }

    await updateSettings(updates);
    const settings = await getSettingsForResponse();
    res.json({ success: true, data: settings, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    res.status(500).json({ success: false, data: null, error: message });
  }
});

/** POST /api/settings/ai/test - Test AI configuration without saving. */
router.post('/ai/test', async (req: Request, res: Response) => {
  try {
    const { provider, baseUrl, apiKey, model } = req.body as {
      provider: AIProvider;
      baseUrl: string;
      apiKey: string;
      model: string;
    };

    if (!provider || provider === 'none') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'No AI provider specified',
      });
      return;
    }

    if (!baseUrl) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Base URL is required',
      });
      return;
    }

    if (!model) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Model name is required',
      });
      return;
    }

    const success = await testAIConfig({ provider, baseUrl, apiKey, model });

    if (success) {
      res.json({
        success: true,
        data: { connected: true },
        error: null,
      });
    } else {
      res.json({
        success: false,
        data: { connected: false },
        error: 'Connection test failed. Check your configuration.',
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection test failed';
    res.json({
      success: false,
      data: { connected: false },
      error: message,
    });
  }
});

export default router;
