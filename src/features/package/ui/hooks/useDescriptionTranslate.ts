import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getSettings } from '@/utils/settings';
import { renderMarkdown } from '@/utils/markdown';

interface TranslateResult {
  translatedHtml: string;
  translatedSummary: string;
}

export default function useDescriptionTranslate() {
  const [result, setResult] = useState<TranslateResult>({ translatedHtml: '', translatedSummary: '' });
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');

  const translate = useCallback(async (markdown: string, summary: string, baseUrl?: string) => {
    setResult({ translatedHtml: '', translatedSummary: '' });
    setError('');
    setTranslating(true);
    try {
      const settings = await getSettings();
      const apiKey = settings.translator_api_key?.trim() || '';
      const region = settings.translator_region?.trim() || 'eastasia';
      const toList = ['zh-CN'];

      // Translate summary (plain text)
      let translatedSummary = '';
      if (summary.trim()) {
        translatedSummary = await invoke<string>('translate_text', {
          text: summary,
          apiKey,
          region,
          from: 'ja',
          toList,
        });
      }

      // Translate description markdown
      let translatedMarkdown = await invoke<string>('translate_text', {
        text: markdown,
        apiKey,
        region,
        from: 'ja',
        toList,
      });

      // Fix common markdown breakage from Google Translate
      translatedMarkdown = translatedMarkdown
        .replace(/＃/g, '#')
        .replace(/＊/g, '*')
        .replace(/－/g, '-')
        .replace(/＞/g, '>');

      const html = renderMarkdown(translatedMarkdown, baseUrl ? { baseUrl } : undefined);
      setResult({ translatedHtml: html, translatedSummary });
    } catch (e: unknown) {
      setError(typeof e === 'string' ? e : (e as Error).message || '翻译失败');
    } finally {
      setTranslating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult({ translatedHtml: '', translatedSummary: '' });
    setError('');
  }, []);

  const translatedHtml = result.translatedHtml;
  const translatedSummary = result.translatedSummary;

  return { translatedHtml, translatedSummary, translating, error, translate, reset };
}
