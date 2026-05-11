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
      const apiKey = settings.translator_api_key?.trim() || '';
      const region = settings.translator_region?.trim() || 'eastasia';
      const result = await invoke<string>('translate_text', {
        text: html,
        apiKey,
        region,
        from: 'ja',
        toList: ['zh-CN'],
      });
      // Wrap translated plain text in basic HTML
      const wrapped = result
        .split('\n\n')
        .map((p) => `<p>${p}</p>`)
        .join('\n');
      setTranslatedHtml(wrapped);
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
