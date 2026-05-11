import * as tauriFs from '@tauri-apps/plugin-fs';
import { normalizeUiLocale, type SupportedUiLocale } from '@/i18n/uiLocale';
import { ipc } from './invokeIpc';
import { getSettings, type AppSettings } from './settings';

export const DEFAULT_APP_THEME = 'darkmode';

export interface AppSettingsDraft {
  aviutl2Root?: string | null;
  isPortableMode?: boolean | null;
  theme?: string | null;
  locale?: string | null;
  packageStateOptOut?: boolean | null;
  translatorApiKey?: string | null;
  translatorRegion?: string | null;
}

interface UpdateAppSettingsPayload {
  aviutl2Root: string;
  isPortableMode: boolean;
  theme: string;
  locale: SupportedUiLocale;
  packageStateOptOut: boolean;
  translatorApiKey: string;
  translatorRegion: string;
}

export function normalizeTheme(value: unknown): string {
  return String(value || '').trim() === 'lightmode' ? 'lightmode' : DEFAULT_APP_THEME;
}

export function resolveAppSettingsUpdate(
  draft: AppSettingsDraft,
  persisted: AppSettings = {},
): UpdateAppSettingsPayload | null {
  const aviutl2Root = String(draft.aviutl2Root ?? persisted.aviutl2_root ?? '').trim();
  if (!aviutl2Root) return null;

  return {
    aviutl2Root,
    isPortableMode: Boolean(draft.isPortableMode ?? persisted.is_portable_mode),
    theme: normalizeTheme(draft.theme ?? persisted.theme),
    locale: normalizeUiLocale(draft.locale ?? persisted.locale),
    packageStateOptOut: Boolean(draft.packageStateOptOut ?? persisted.package_state_opt_out),
    translatorApiKey: String(draft.translatorApiKey ?? persisted.translator_api_key ?? '').trim(),
    translatorRegion: String(draft.translatorRegion ?? persisted.translator_region ?? 'eastasia').trim() || 'eastasia',
  };
}

async function saveTranslatorSettings(apiKey: string, region: string): Promise<void> {
  try {
    const hasFile = await tauriFs.exists('settings.json', { baseDir: tauriFs.BaseDirectory.AppConfig });
    const raw = hasFile ? await tauriFs.readTextFile('settings.json', { baseDir: tauriFs.BaseDirectory.AppConfig }) : '{}';
    const data = JSON.parse(raw || '{}');
    data.translator_api_key = apiKey;
    data.translator_region = region;
    await tauriFs.writeTextFile('settings.json', JSON.stringify(data, null, 2), { baseDir: tauriFs.BaseDirectory.AppConfig });
  } catch {}
}

export async function updateAppSettings(draft: AppSettingsDraft): Promise<boolean> {
  const payload = resolveAppSettingsUpdate(draft, await getSettings());
  if (!payload) return false;
  await ipc.updateSettings({
    aviutl2Root: payload.aviutl2Root,
    isPortableMode: payload.isPortableMode,
    theme: payload.theme,
    locale: payload.locale,
    packageStateOptOut: payload.packageStateOptOut,
  });
  await saveTranslatorSettings(payload.translatorApiKey, payload.translatorRegion);
  return true;
}
