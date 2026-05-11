import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSettings } from '@/utils/settings';
import { defaultNS, namespaces, resources } from './resources';
import { normalizeUiLocale, SUPPORTED_UI_LOCALES, type SupportedUiLocale } from './uiLocale';
type I18nLanguageSource = Pick<typeof i18n, 'resolvedLanguage' | 'language'>;

function applyDocumentLanguage(locale: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

export function getCurrentUiLocale(source: I18nLanguageSource = i18n): SupportedUiLocale {
  return normalizeUiLocale(source.resolvedLanguage ?? source.language);
}

export async function changeUiLocale(locale: SupportedUiLocale): Promise<void> {
  if (getCurrentUiLocale(i18n) === locale) return;
  // eslint-disable-next-line import/no-named-as-default-member
  await i18n.changeLanguage(locale);
  applyDocumentLanguage(locale);
}

function resolveInitialLanguage(settingsLocale: unknown): SupportedUiLocale {
  const saved = typeof settingsLocale === 'string' ? settingsLocale.trim() : '';
  if (saved) return normalizeUiLocale(saved);

  return 'zh-CN';
}

export async function initializeI18n(): Promise<typeof i18n> {
  if (i18n.isInitialized) return i18n;

  let settingsLocale = '';
  try {
    settingsLocale = (await getSettings()).locale ?? '';
  } catch {}

  // eslint-disable-next-line import/no-named-as-default-member
  await i18n.use(initReactI18next).init({
    resources,
    lng: resolveInitialLanguage(settingsLocale),
    fallbackLng: 'zh-CN',
    supportedLngs: [...SUPPORTED_UI_LOCALES],
    load: 'currentOnly',
    defaultNS,
    ns: [...namespaces],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  applyDocumentLanguage(getCurrentUiLocale(i18n));
  return i18n;
}

export { getUiLocaleLabel, normalizeUiLocale, SUPPORTED_UI_LOCALES, UI_LOCALE_OPTIONS } from './uiLocale';
export { i18n };
export type { SupportedUiLocale, UiLocaleOption } from './uiLocale';
