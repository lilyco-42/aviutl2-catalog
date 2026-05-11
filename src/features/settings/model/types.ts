import type { SupportedUiLocale } from '@/i18n';

export interface SettingsFormState {
  aviutl2Root: string;
  isPortableMode: boolean;
  theme: string;
  locale: SupportedUiLocale;
  packageStateOptOut: boolean;
  translatorApiKey: string;
  translatorRegion: string;
}

export type InstalledImportMap = Record<string, string>;
