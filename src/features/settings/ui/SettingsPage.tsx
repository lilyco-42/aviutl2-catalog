import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/Alert';
import useSettingsPage from './hooks/useSettingsPage';
import { AppInfoSection, AppSettingsSection, DataManagementSection } from './sections';
import { page, text } from '@/components/ui/_styles';
import { cn } from '@/lib/cn';

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const {
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
  } = useSettingsPage();

  return (
    <div className={cn(page.container3xl, page.selectNone, page.enterFromBottom, 'space-y-7')}>
      <div>
        <h2 className={cn(text.title2xlStrong, 'mb-2')}>{t('page.title')}</h2>
        <p className={text.mutedSm}>{t('page.description')}</p>
      </div>

      {error ? (
        <Alert variant="danger" className="rounded-xl">
          {error}
        </Alert>
      ) : null}

      <AppSettingsSection
        form={form}
        packageStateEnabled={packageStateEnabled}
        saving={saving}
        success={success}
        onAviutl2RootChange={onAviutl2RootChange}
        onLocaleChange={onLocaleChange}
        onPortableToggle={onPortableToggle}
        onPackageStateEnabledToggle={onPackageStateEnabledToggle}
        onPickAviutl2Root={onPickAviutl2Root}
        onToggleTheme={onToggleTheme}
        onTranslatorApiKeyChange={onTranslatorApiKeyChange}
        onTranslatorRegionChange={onTranslatorRegionChange}
        onSave={onSave}
      />
      <DataManagementSection syncBusy={syncBusy} syncStatus={syncStatus} onExport={onExport} onImport={onImport} />
      <AppInfoSection appVersion={appVersion} />
    </div>
  );
}
