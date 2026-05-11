import { type ChangeEvent, useCallback, useState } from 'react';
import * as tauriDialog from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { changeUiLocale, getCurrentUiLocale, normalizeUiLocale } from '@/i18n';
import { DEFAULT_APP_THEME, updateAppSettings } from '@/utils/appSettings';
import { useCatalog, useCatalogDispatch } from '@/utils/catalogStore';
import { ipc } from '@/utils/invokeIpc';
import { detectInstalledVersionsMap } from '@/utils/installed-map';
import { logError } from '@/utils/logging';
import { resetPackageStateLocalState } from '@/utils/package-state';
import { applyTheme, toErrorMessage } from '../../model/helpers';
import type { SettingsFormState } from '../../model/types';
import useSettingsDataManagement from './useSettingsDataManagement';
import useSettingsInitialization from './useSettingsInitialization';

async function logSettingsError(message: string, error: unknown): Promise<void> {
  try {
    await logError(`[settings] ${message}: ${toErrorMessage(error, 'unknown')}`);
  } catch {}
}

export default function useSettingsPage() {
  const { t, i18n } = useTranslation('settings');
  const { items } = useCatalog();
  const dispatch = useCatalogDispatch();

  const [form, setForm] = useState<SettingsFormState>({
    aviutl2Root: '',
    isPortableMode: false,
    theme: DEFAULT_APP_THEME,
    locale: getCurrentUiLocale(i18n),
    packageStateOptOut: false,
    translatorApiKey: '',
    translatorRegion: 'eastasia',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [initialPackageStateOptOut, setInitialPackageStateOptOut] = useState(false);

  useSettingsInitialization({
    setForm,
    setInitialPackageStateOptOut,
    setAppVersion,
    setError,
  });

  const { syncBusy, syncStatus, onExport, onImport } = useSettingsDataManagement({
    catalogItems: items,
    dispatch,
    setError,
  });

  const onAviutl2RootChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, aviutl2Root: value }));
  }, []);

  const onPortableToggle = useCallback((next: boolean) => {
    setForm((prev) => ({ ...prev, isPortableMode: Boolean(next) }));
  }, []);

  const onLocaleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, locale: normalizeUiLocale(value) }));
  }, []);

  const onPackageStateEnabledToggle = useCallback((nextEnabled: boolean) => {
    setForm((prev) => ({ ...prev, packageStateOptOut: !nextEnabled }));
  }, []);

  const onToggleTheme = useCallback(() => {
    setForm((prev) => {
      const nextTheme = prev.theme === 'lightmode' ? 'darkmode' : 'lightmode';
      applyTheme(nextTheme);
      return { ...prev, theme: nextTheme };
    });
  }, []);

  const onTranslatorApiKeyChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, translatorApiKey: event.target.value }));
  }, []);

  const onTranslatorRegionChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, translatorRegion: event.target.value }));
  }, []);

  const onPickAviutl2Root = useCallback(async () => {
    try {
      const selected = await tauriDialog.open({
        directory: true,
        multiple: false,
        title: t('app.aviutl2Root.dialogTitle'),
      });
      const pathValue = Array.isArray(selected) ? selected[0] : selected;
      if (typeof pathValue !== 'string' || !pathValue.trim()) return;
      setForm((prev) => ({ ...prev, aviutl2Root: pathValue }));
    } catch {
      setError(t('errors.directoryPickFailed'));
    }
  }, [t]);

  const onSave = useCallback(async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const resolved = await ipc.resolveAviutl2Root({ raw: String(form.aviutl2Root || '') });
      const aviutl2Root = String(resolved || '').trim();
      if (!aviutl2Root) throw new Error(t('errors.aviutl2Required'));

      const updated = await updateAppSettings({
        aviutl2Root,
        isPortableMode: form.isPortableMode,
        theme: form.theme,
        locale: form.locale,
        packageStateOptOut: form.packageStateOptOut,
        translatorApiKey: form.translatorApiKey.trim(),
        translatorRegion: form.translatorRegion.trim() || 'eastasia',
      });
      if (!updated) throw new Error(t('errors.aviutl2Required'));

      try {
        await changeUiLocale(form.locale);
      } catch (languageError) {
        setError(t('errors.languageApplyFailed'));
        await logSettingsError('changeLanguage failed', languageError);
      }

      applyTheme(form.theme);
      const nextOptOut = Boolean(form.packageStateOptOut);
      if (!initialPackageStateOptOut && nextOptOut) {
        await resetPackageStateLocalState();
      }
      setInitialPackageStateOptOut(nextOptOut);

      try {
        const detected = await detectInstalledVersionsMap(items);
        dispatch({ type: 'SET_DETECTED_MAP', payload: detected });
      } catch (refreshError) {
        await logSettingsError('refresh installed versions failed', refreshError);
      }

      setSuccess(i18n.getFixedT(form.locale, 'settings')('messages.saveSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (saveError) {
      setError(toErrorMessage(saveError, t('errors.saveFailed')));
      await logSettingsError('save failed', saveError);
    } finally {
      setSaving(false);
    }
  }, [dispatch, form, i18n, initialPackageStateOptOut, items, t]);

  const packageStateEnabled = !form.packageStateOptOut;

  return {
    form,
    saving,
    error,
    success,
    appVersion,
    syncBusy,
    syncStatus,
    packageStateEnabled,
    onAviutl2RootChange,
    onLocaleChange,
    onPortableToggle,
    onPackageStateEnabledToggle,
    onToggleTheme,
    onTranslatorApiKeyChange,
    onTranslatorRegionChange,
    onPickAviutl2Root,
    onSave,
    onExport,
    onImport,
  };
}
