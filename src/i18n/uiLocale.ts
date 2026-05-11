export const SUPPORTED_UI_LOCALES = ['ja', 'en', 'ko', 'zh-CN', 'zh-TW'] as const;

export type SupportedUiLocale = (typeof SUPPORTED_UI_LOCALES)[number];

export interface UiLocaleOption {
  value: SupportedUiLocale;
  label: string;
}

const UI_LOCALE_LABELS: Record<SupportedUiLocale, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

const UI_LOCALE_ALIASES: Record<SupportedUiLocale, readonly string[]> = {
  ja: ['ja'],
  en: ['en'],
  ko: ['ko'],
  'zh-CN': ['zh-cn', 'zh-hans', 'zh-sg'],
  'zh-TW': ['zh-tw', 'zh-hk', 'zh-mo', 'zh-hant'],
};

function matchUiLocale(locale: string): SupportedUiLocale | null {
  if (locale === 'zh') return 'zh-CN';
  return (
    SUPPORTED_UI_LOCALES.find((candidate) =>
      UI_LOCALE_ALIASES[candidate].some((alias) => locale === alias || locale.startsWith(`${alias}-`)),
    ) ?? null
  );
}

export const UI_LOCALE_OPTIONS: readonly UiLocaleOption[] = SUPPORTED_UI_LOCALES.map((locale) => ({
  value: locale,
  label: UI_LOCALE_LABELS[locale],
}));

export function normalizeUiLocale(value: unknown): SupportedUiLocale {
  const locale = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return matchUiLocale(locale) ?? 'zh-CN';
}

export function getUiLocaleLabel(locale: string): string {
  const normalized = String(locale || '')
    .trim()
    .toLowerCase();
  if (!normalized) return 'Unknown';
  const matched = matchUiLocale(normalized);
  return matched ? UI_LOCALE_LABELS[matched] : normalized.toUpperCase();
}
