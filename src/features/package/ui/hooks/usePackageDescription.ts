import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isMarkdownFilePath as isMarkdownUrl, resolveMarkdownUrl } from '../../model/helpers';
import { renderMarkdown } from '@/utils/markdown';

interface UsePackageDescriptionParams {
  descriptionSource: string;
  baseUrl: string;
}

export default function usePackageDescription({
  descriptionSource: descriptionUrlOrMarkdown,
  baseUrl,
}: UsePackageDescriptionParams) {
  const { t } = useTranslation('package');
  const [rawMarkdown, setRawMarkdown] = useState(() =>
    isMarkdownUrl(descriptionUrlOrMarkdown) ? '' : descriptionUrlOrMarkdown,
  );
  const [descriptionHtml, setDescriptionHtml] = useState(() =>
    isMarkdownUrl(descriptionUrlOrMarkdown) ? '' : renderMarkdown(descriptionUrlOrMarkdown),
  );
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const totalStart = performance.now();
    if (!descriptionUrlOrMarkdown) {
      setRawMarkdown('');
      setDescriptionHtml('');
      setDescriptionError('');
      setDescriptionLoading(false);
      return undefined;
    }
    if (!isMarkdownUrl(descriptionUrlOrMarkdown)) {
      setRawMarkdown(descriptionUrlOrMarkdown);
      setDescriptionHtml(renderMarkdown(descriptionUrlOrMarkdown));
      setDescriptionError('');
      setDescriptionLoading(false);
      return undefined;
    }

    setDescriptionLoading(true);
    setDescriptionError('');

    void (async () => {
      let fetchMs = 0;
      let readMs = 0;
      let renderMs = 0;
      try {
        const url = resolveMarkdownUrl(descriptionUrlOrMarkdown, baseUrl);
        const fetchStart = performance.now();
        const response = await fetch(url, { signal: controller.signal });
        fetchMs = performance.now() - fetchStart;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const readStart = performance.now();
        const markdownText = await response.text();
        readMs = performance.now() - readStart;
        const renderStart = performance.now();
        const html = renderMarkdown(markdownText, {
          baseUrl: url,
        });
        renderMs = performance.now() - renderStart;
        if (!cancelled) {
          setRawMarkdown(markdownText);
          setDescriptionHtml(html);
        }
      } catch {
        if (controller.signal.aborted) return;
        if (!cancelled) {
          const message = t('descriptionErrors.loadFailed');
          setRawMarkdown(message);
          setDescriptionHtml(renderMarkdown(message));
          setDescriptionError(message);
        }
      } finally {
        if (!cancelled) {
          setDescriptionLoading(false);
        }
        if (import.meta.env.DEV && !cancelled && !controller.signal.aborted) {
          const totalMs = performance.now() - totalStart;
          console.info(
            `[package-md] total=${totalMs.toFixed(1)}ms fetch=${fetchMs.toFixed(1)}ms read=${readMs.toFixed(1)}ms render=${renderMs.toFixed(1)}ms source=${descriptionUrlOrMarkdown}`,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [baseUrl, descriptionUrlOrMarkdown, t]);

  return {
    rawMarkdown,
    descriptionHtml,
    descriptionLoading,
    descriptionError,
  };
}
