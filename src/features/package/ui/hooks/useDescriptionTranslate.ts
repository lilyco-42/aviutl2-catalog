import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getSettings } from '@/utils/settings';
import { renderMarkdown } from '@/utils/markdown';

export default function useDescriptionTranslate() {
  const [translatedHtml, setTranslatedHtml] = useState('');
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');

  const translate = useCallback(async (markdown: string, baseUrl?: string) => {
    setTranslatedHtml('');
    setError('');
    setTranslating(true);
    try {
      const settings = await getSettings();
      const apiKey = settings.translator_api_key?.trim() || '';
      const region = settings.translator_region?.trim() || 'eastasia';
      const result = await invoke<string>('translate_text', {
        text: markdown,
        apiKey,
        region,
        from: 'ja',
        toList: ['zh-CN'],
      });
      const html = renderMarkdown(result, baseUrl ? { baseUrl } : undefined);
      setTranslatedHtml(html);
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
