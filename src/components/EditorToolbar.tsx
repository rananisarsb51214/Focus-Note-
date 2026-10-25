import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link,
  Table,
  FileCode,
  Download,
  Copy,
  Check,
} from 'lucide-react';

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (newContent: string) => void;
  onExport: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  textareaRef,
  content,
  onChange,
  onExport,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Helper to wrap or insert text at current cursor position in textarea
  const applyFormat = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultText}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    onChange(newContent);

    // Reposition cursor inside or at end of formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? start + replacement.length : start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos + (selectedText ? 0 : defaultText.length));
    }, 10);
  };

  // Helper to prepend prefix to current line
  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    // Find beginning of current line
    const lastNewline = content.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 10);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-1.5 overflow-x-auto text-neutral-600 dark:text-neutral-400 text-xs gap-1 select-none">
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => applyLinePrefix('# ')}
          title="Heading 1"
          aria-label="Heading 1"
          className="px-1.5 py-1 font-semibold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('## ')}
          title="Heading 2"
          aria-label="Heading 2"
          className="px-1.5 py-1 font-semibold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('### ')}
          title="Heading 3"
          aria-label="Heading 3"
          className="px-1.5 py-1 font-semibold rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          H3
        </button>

        <span className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => applyFormat('**', '**', 'bold text')}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('*', '*', 'italic text')}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('~~', '~~', 'strikethrough text')}
          title="Strikethrough"
          aria-label="Strikethrough"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => applyFormat('`', '`', 'code')}
          title="Inline Code"
          aria-label="Inline Code"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('```\n', '\n```', 'code block')}
          title="Code Block"
          aria-label="Code Block"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <FileCode className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => applyLinePrefix('- ')}
          title="Bullet List"
          aria-label="Bullet List"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('1. ')}
          title="Numbered List"
          aria-label="Numbered List"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyLinePrefix('- [ ] ')}
          title="Task Checklist"
          aria-label="Task Checklist"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={() => applyLinePrefix('> ')}
          title="Blockquote"
          aria-label="Blockquote"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('[', '](https://example.com)', 'link text')}
          title="Add Link"
          aria-label="Add Link"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Link className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('\n| Column 1 | Column 2 |\n| --- | --- |\n| Item 1 | Item 2 |\n')}
          title="Insert Table"
          aria-label="Insert Table"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Table className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('\n---\n')}
          title="Divider Line"
          aria-label="Divider Line"
          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0 pl-2">
        <button
          type="button"
          onClick={handleCopyMarkdown}
          title="Copy Markdown"
          className="flex items-center gap-1 px-2 py-1 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Copy</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onExport}
          title="Download .md file"
          className="flex items-center gap-1 px-2 py-1 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
};
