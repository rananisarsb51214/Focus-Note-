import React, { useMemo } from 'react';
import { markdownToHtml } from '../lib/markdown';

interface MarkdownPreviewProps {
  title: string;
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  title,
  content,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    return markdownToHtml(content);
  }, [content]);

  return (
    <div
      className={`h-full overflow-y-auto px-6 sm:px-10 py-6 max-w-3xl mx-auto selection:bg-neutral-200 dark:selection:bg-neutral-700 ${className}`}
    >
      {/* Title in preview */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-6 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        {title.trim() ? title : <span className="italic text-neutral-400 dark:text-neutral-500">Untitled Note</span>}
      </h1>

      {/* Rendered sanitized HTML content */}
      <div
        className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};
