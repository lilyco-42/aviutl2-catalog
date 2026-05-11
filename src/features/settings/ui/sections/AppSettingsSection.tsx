import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { UI_LOCALE_OPTIONS } from '@/i18n';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { inputVariants } from '@/components/ui/Input';
import { Check, FolderOpen, Moon, Settings as SettingsIcon, Sun } from 'lucide-react';
import type { AppSettingsSectionProps } from '../types';
import SettingToggleRow from './SettingToggleRow';
import { layout, surface, text } from '@/components/ui/_styles';
import { cn } from '@/lib/cn';

const iconBlockStyle: CSSProperties = { display: 'block' };

export default function AppSettingsSection({
  form,
  packageStateEnabled,
  saving,
  success,
  onAviutl2RootChange,
  onLocaleChange,
  onPortableToggle,
  onPackageStateEnabledToggle,
  onPickAviutl2Root,
  onToggleTheme,
  onTranslatorApiKeyChange,
  onTranslatorRegionChange,
  onSave,
}: AppSettingsSectionProps) {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <section className={surface.panelOverflow}>
      <div className={surface.sectionHeader}>
        <SettingsIcon size={18} className="text-slate-500 dark:text-slate-400" />
        <h3 className={text.headingSmBold}>{t('sections.app')}</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="settings-aviutl2-root">
            {t('app.aviutl2Root.label')}
          </label>
          <div className={text.mutedXs}>{t('app.aviutl2Root.description')}</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="settings-aviutl2-root"
              name="aviutl2Root"
              value={form.aviutl2Root}
              onChange={onAviutl2RootChange}
              className="flex-1 cursor-text select-text"
              placeholder={t('app.aviutl2Root.placeholder')}
            />
            <Button
              variant="secondary"
              size="default"
              type="button"
              className="cursor-pointer"
              onClick={onPickAviutl2Root}
            >
              <FolderOpen size={16} />
              {t('common:actions.browse')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="settings-locale">
            {t('app.language.label')}
          </label>
          <div className={text.mutedXs}>{t('app.language.description')}</div>
          <select
            id="settings-locale"
            name="locale"
            value={form.locale}
            onChange={onLocaleChange}
            className={cn(inputVariants(), 'cursor-pointer')}
            aria-label={t('app.language.label')}
          >
            {UI_LOCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <SettingToggleRow
          title={
            <>
              {t('app.portableMode.title')}{' '}
              <span className={cn(text.mutedXs, 'font-normal')}>({t('app.portableMode.recommendedOff')})</span>
            </>
          }
          description={t('app.portableMode.description')}
          checked={form.isPortableMode}
          onToggle={() => onPortableToggle(!form.isPortableMode)}
        />

        <SettingToggleRow
          title={t('app.theme.title')}
          checked={form.theme !== 'lightmode'}
          onToggle={onToggleTheme}
          thumbContent={
            form.theme === 'lightmode' ? (
              <Sun size={12} className="text-slate-400" style={iconBlockStyle} />
            ) : (
              <Moon size={12} className="text-blue-600" style={iconBlockStyle} />
            )
          }
        />

        <SettingToggleRow
          title={t('app.packageState.title')}
          description={t('app.packageState.description')}
          checked={packageStateEnabled}
          onToggle={() => onPackageStateEnabledToggle(!packageStateEnabled)}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="settings-translator-key">
            Microsoft Translator API Key
          </label>
          <div className={text.mutedXs}>用于翻译包说明内容。在 Azure Portal 创建 Translator 资源后获取。</div>
          <Input
            id="settings-translator-key"
            name="translatorApiKey"
            value={form.translatorApiKey}
            onChange={onTranslatorApiKeyChange}
            className="flex-1 cursor-text select-text"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            type="password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="settings-translator-region">
            Region
          </label>
          <Input
            id="settings-translator-region"
            name="translatorRegion"
            value={form.translatorRegion}
            onChange={onTranslatorRegionChange}
            className="flex-1 cursor-text select-text"
            placeholder="eastasia"
          />
        </div>

        <div className={cn(layout.inlineGap2, 'flex-wrap justify-end border-slate-100 dark:border-slate-800')}>
          <Button
            variant={success ? 'success' : 'primary'}
            size="actionSm"
            onClick={onSave}
            disabled={saving || Boolean(success)}
            type="button"
            className="cursor-pointer"
          >
            {success && <Check size={16} />}
            {success ? t('app.saved') : t('app.save')}
          </Button>
        </div>
      </div>
    </section>
  );
}
