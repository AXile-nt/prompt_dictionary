// CRUD operations for app_settings table.
// API keys are stored with basic base64 encoding (obfuscation, not encryption).

import prisma from '@prompt-dictionary/database';

/** All setting keys managed by this service. */
const SETTING_KEYS = [
  'ai_provider',
  'ai_api_key',
  'ai_base_url',
  'ai_model',
  'sync_interval',
  'theme',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Get all settings as a flat object. API key is decoded for internal use. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: SETTING_KEYS as unknown as string[] } },
  });

  const settings: Record<string, string> = {};
  for (const row of rows) {
    if (row.key === 'ai_api_key' && row.value) {
      settings[row.key] = decodeApiKey(row.value);
    } else {
      settings[row.key] = row.value;
    }
  }

  return settings;
}

/** Get settings for API response. API key is masked. */
export async function getSettingsForResponse(): Promise<Record<string, string>> {
  const settings = await getSettings();

  // Mask API key for frontend display
  if (settings.ai_api_key) {
    const key = settings.ai_api_key;
    if (key.length > 8) {
      settings.ai_api_key = key.slice(0, 4) + '***' + key.slice(-4);
    } else {
      settings.ai_api_key = '***';
    }
  }

  // Provide defaults for missing settings
  const defaults: Record<string, string> = {
    ai_provider: 'none',
    ai_api_key: '',
    ai_base_url: '',
    ai_model: '',
    sync_interval: 'manual',
    theme: 'system',
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (!settings[key]) {
      settings[key] = value;
    }
  }

  return settings;
}

/** Update multiple settings at once. API key is encoded before storage. */
export async function updateSettings(
  updates: Record<string, string>,
): Promise<void> {
  const operations = Object.entries(updates)
    .filter(([key]) => SETTING_KEYS.includes(key as SettingKey))
    .map(([key, value]) => {
      const storedValue = key === 'ai_api_key' && value ? encodeApiKey(value) : value;
      return prisma.appSetting.upsert({
        where: { key },
        update: { value: storedValue },
        create: { key, value: storedValue },
      });
    });

  await prisma.$transaction(operations);
}

/** Get a single setting value by key. Returns empty string if not found. */
export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return '';

  if (key === 'ai_api_key' && row.value) {
    return decodeApiKey(row.value);
  }
  return row.value;
}

/** Basic API key encoding (base64 obfuscation). Not encryption. */
function encodeApiKey(key: string): string {
  return Buffer.from(key, 'utf-8').toString('base64');
}

/** Decode API key from base64. */
function decodeApiKey(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return encoded;
  }
}
