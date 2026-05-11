import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getSettings } from '@/utils/settings';

export default function useDescriptionTranslate() {
  const [translatedHtml, setTranslatedHtml] = useState('');
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');

  const translate = useCallback(async (html: string) => {
    setTranslatedHtml('');
    setError('');
    setTranslating(true);
    try {
      const settings = await getSettings();
      const apiKey = settings.translator_api_key?.trim();
      const region = settings.translator_region?.trim() || 'eastasia';
      if (!apiKey) {
        setError('请先在设置中填入 Microsoft Translator API Key');
        return;
      }
      const result = await invoke<string>('translate_text', {
        text: html,
        apiKey,
        region,
        from: 'ja',
        toList: ['zh-Hans'],
      });
      setTranslatedHtml(result);
    } catch (e: unknown) {
      setError(typeof e === 'string' ? e : (e as Error).message || '翻译失败');
    } finally {
      setTranslating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTranslatedHtml('');
    setError('');
  }, []);

  return { translatedHtml, translating, error, translate, reset };
}
