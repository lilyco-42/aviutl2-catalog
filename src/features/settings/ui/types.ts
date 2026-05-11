import type { ChangeEvent } from 'react';
import type { SettingsFormState } from '../model/types';

export interface AppSettingsSectionProps {
  form: SettingsFormState;
  packageStateEnabled: boolean;
  saving: boolean;
  success: string;
  onAviutl2RootChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLocaleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onPortableToggle: (next: boolean) => void;
  onPackageStateEnabledToggle: (nextEnabled: boolean) => void;
  onPickAviutl2Root: () => void;
  onToggleTheme: () => void;
  onTranslatorApiKeyChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTranslatorRegionChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export interface DataManagementSectionProps {
  syncBusy: boolean;
  syncStatus: string;
  onExport: () => void;
  onImport: () => void;
}

export interface AppInfoSectionProps {
  appVersion: string;
}
