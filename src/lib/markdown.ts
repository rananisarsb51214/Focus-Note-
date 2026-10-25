/**
 * Secure, zero-dependency Markdown parser and text statistics analyzer for Focus Notes.
 * Sanitizes all HTML entities before formatting to completely prevent XSS.
 * Restricts link protocols to safe schemes (http, https, mailto, tel, anchor).
 */

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  readingTimeMinutes: number;
}

/**
 * Calculates word count, character counts, and estimated reading time.
 */
export function calculateStats(text: string): TextStats {
  if (!text) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
      readingTimeMinutes: 0,
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const words = text.trim() ? (text.trim().match(/\S+/g) || []).length : 0;
  const lines = text.split('\n').length;
  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    readingTimeMinutes,
  };
}

/**
 * Escapes raw HTML to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates and sanitizes a link URL to prevent javascript: or data: injection.
 */
function sanitizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const safeProtocolRegex = /^(https?:\/\/|mailto:|tel:|#)/i;
  if (safeProtocolRegex.test(trimmed)) {
    return trimmed;
  }
  // If it's a relative path starting with / or ./
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }
  // Otherwise treat as unsafe or prepend https:// if it looks like a domain
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '#';
}

/**
 * Automatically detects raw URLs (e.g. https://example.com, http://..., www....) in text
 * and renders them as safe, clickable anchor tags without interfering with existing HTML tags or code blocks.
 */
export function linkifyRawUrls(text: string): string {
  if (!text) return text;

  // Split text by HTML tags to only process text nodes outside of existing <a> or <code> tags
  const parts = text.split(/(<[^>]+>)/g);
  let insideLink = false;
  let insideCode = false;

  const urlRegex = /(https?:\/\/[^\s<]+|www\.[a-zA-Z0-9-]+\.[^\s<]+)/gi;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith('<')) {
      if (/^<a\b/i.test(part)) {
        insideLink = true;
      } else if (/^<\/a>/i.test(part)) {
        insideLink = false;
      } else if (/^<code\b/i.test(part)) {
        insideCode = true;
      } else if (/^<\/code>/i.test(part)) {
        insideCode = false;
      }
      continue;
    }

    if (insideLink || insideCode) {
      continue;
    }

    // Replace raw URLs in this plain text chunk
    parts[i] = part.replace(urlRegex, (matchedUrl) => {
      // Separate any trailing punctuation that belongs to the sentence (e.g. .,;!?)] or &gt;)
      let url = matchedUrl;
      let trailing = '';

      while (url.length > 0) {
        if (url.endsWith('&gt;')) {
          trailing = '&gt;' + trailing;
          url = url.slice(0, -4);
        } else if (url.endsWith('&quot;')) {
          trailing = '&quot;' + trailing;
          url = url.slice(0, -6);
        } else if (/[.,;:!?')\]}]$/.test(url)) {
          trailing = url.slice(-1) + trailing;
          url = url.slice(0, -1);
        } else {
          break;
        }
      }

      if (!url) return matchedUrl;

      const href = url.startsWith('www.') ? `https://${url}` : url;
      const safeHref = sanitizeUrl(href);

      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">${url}</a>${trailing}`;
    });
  }

  return parts.join('');
}

/**
 * Parses inline markdown: bold, italic, strikethrough, inline code, links, images.
 */
function parseInline(text: string): string {
  // Inline code: `code`
  let result = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60">$1</code>');

  // Images: ![alt](url)
  result = result.replace(/!\[(.*?)\]\((.*?)\)/g, (_match, alt, url) => {
    const safeUrl = sanitizeUrl(url);
    if (safeUrl === '#') return `[Image: ${alt}]`;
    return `<img src="${safeUrl}" alt="${alt}" class="my-4 max-w-full rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm" referrerpolicy="no-referrer" loading="lazy" />`;
  });

  // Explicit Markdown Links: [text](url)
  result = result.replace(/\[(.*?)\]\((.*?)\)/g, (_match, linkText, url) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">${linkText}</a>`;
  });

  // Automatically detect and render raw URLs as clickable links
  result = linkifyRawUrls(result);

  // Bold + Italic: ***text*** or ___text___
  result = result.replace(/(\*\*\*|___)(.*?)\1/g, '<strong class="font-bold"><em>$2</em></strong>');

  // Bold: **text** or __text__
  result = result.replace(/(\*\*|__)(.*?)\1/g, '<strong class="font-semibold text-neutral-900 dark:text-neutral-100">$2</strong>');

  // Italic: *text* or _text_
  result = result.replace(/(\*|_)(.*?)\1/g, '<em class="italic">$2</em>');

  // Strikethrough: ~~text~~
  result = result.replace(/~~(.*?)~~/g, '<del class="line-through text-neutral-500 dark:text-neutral-400">$1</del>');

  // Highlight: ==text==
  result = result.replace(/==(.*?)==/g, '<mark class="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 rounded">$1</mark>');

  return result;
}

/**
 * Converts Markdown string into sanitized HTML.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p class="text-neutral-400 dark:text-neutral-500 italic py-4">Nothing to preview. Start writing in the editor.</p>';
  }

  // Pre-escape all HTML tags to prevent XSS
  const escaped = escapeHtml(markdown);
  const lines = escaped.split('\n');

  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;
  let blockquoteContent: string[] = [];

  let inTable = false;
  let tableRows: string[] = [];

  function closeCodeBlock() {
    if (inCodeBlock) {
      const codeHtml = codeBlockContent.join('\n');
      const langBadge = codeBlockLang ? `<span class="absolute top-2.5 right-3 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 select-none">${codeBlockLang}</span>` : '';
      output.push(
        `<div class="relative group my-4 rounded-lg bg-neutral-900 text-neutral-100 text-sm overflow-hidden border border-neutral-800">
          ${langBadge}
          <pre class="p-4 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed"><code>${codeHtml}</code></pre>
        </div>`
      );
      inCodeBlock = false;
      codeBlockLang = '';
      codeBlockContent = [];
    }
  }

  function closeList() {
    if (inList) {
      output.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  }

  function closeBlockquote() {
    if (inBlockquote) {
      output.push(
        `<blockquote class="my-3 pl-4 border-l-2 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 italic text-sm sm:text-base">
          ${blockquoteContent.map(parseInline).join('<br />')}
        </blockquote>`
      );
      inBlockquote = false;
      blockquoteContent = [];
    }
  }

  function closeTable() {
    if (inTable) {
      if (tableRows.length > 0) {
        let tableHtml = '<div class="my-4 overflow-x-auto"><table class="w-full text-left border-collapse border border-neutral-200 dark:border-neutral-800 text-sm">';
        // First row is header if followed by delimiter
        const firstRowCells = tableRows[0].split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
        
        tableHtml += '<thead class="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-800 dark:text-neutral-200 font-semibold border-b border-neutral-200 dark:border-neutral-800"><tr>';
        firstRowCells.forEach(cell => {
          tableHtml += `<th class="px-3 py-2 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">${parseInline(cell)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        for (let r = 2; r < tableRows.length; r++) {
          const cells = tableRows[r].split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);
          tableHtml += '<tr class="border-b border-neutral-100 dark:border-neutral-800/60 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">';
          cells.forEach(cell => {
            tableHtml += `<td class="px-3 py-2 border-r border-neutral-200/60 dark:border-neutral-800/60 last:border-r-0">${parseInline(cell)}</td>`;
          });
          tableHtml += '</tr>';
        }

        tableHtml += '</tbody></table></div>';
        output.push(tableHtml);
      }
      inTable = false;
      tableRows = [];
    }
  }

  function closeAllBlockContainers() {
    closeList();
    closeBlockquote();
    closeTable();
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine;

    // Fenced Code Blocks ```
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        closeAllBlockContainers();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockContent = [];
      } else {
        closeCodeBlock();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^(\s*[-*_]\s*){3,}$/.test(line.trim())) {
      closeAllBlockContainers();
      output.push('<hr class="my-6 border-t border-neutral-200 dark:border-neutral-800" />');
      continue;
    }

    // Table row detection (| Cell | Cell |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      closeList();
      closeBlockquote();
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      closeTable();
    }

    // Headings: # to ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeAllBlockContainers();
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      
      const headingStyles: Record<number, string> = {
        1: 'text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-6 mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-800',
        2: 'text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mt-5 mb-2.5',
        3: 'text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-200 mt-4 mb-2',
        4: 'text-base sm:text-lg font-medium text-neutral-800 dark:text-neutral-200 mt-3 mb-1.5',
        5: 'text-sm sm:text-base font-medium text-neutral-700 dark:text-neutral-300 mt-2 mb-1',
        6: 'text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mt-2 mb-1',
      };

      output.push(`<h${level} class="${headingStyles[level] || headingStyles[1]}">${text}</h${level}>`);
      continue;
    }

    // Blockquotes: > text
    if (line.trim().startsWith('&gt;')) {
      closeList();
      closeTable();
      inBlockquote = true;
      const quoteText = line.trim().replace(/^&gt;\s?/, '');
      blockquoteContent.push(quoteText);
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Task Checklist: - [ ] or - [x]
    const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      if (inList !== 'ul') {
        closeAllBlockContainers();
        inList = 'ul';
        output.push('<ul class="my-2 space-y-1.5 list-none pl-0">');
      }
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      const taskText = parseInline(taskMatch[3]);
      output.push(
        `<li class="flex items-start gap-2.5 text-neutral-800 dark:text-neutral-200 text-sm sm:text-base leading-relaxed">
          <input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="mt-1 h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 accent-neutral-800 dark:accent-neutral-200" />
          <span class="${isChecked ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}">${taskText}</span>
        </li>`
      );
      continue;
    }

    // Unordered List: - item or * item
    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        closeAllBlockContainers();
        inList = 'ul';
        output.push('<ul class="my-2 space-y-1 list-disc list-inside text-neutral-800 dark:text-neutral-200 text-sm sm:text-base pl-2">');
      }
      output.push(`<li class="leading-relaxed">${parseInline(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered List: 1. item
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        closeAllBlockContainers();
        inList = 'ol';
        output.push('<ol class="my-2 space-y-1 list-decimal list-inside text-neutral-800 dark:text-neutral-200 text-sm sm:text-base pl-2">');
      }
      output.push(`<li class="leading-relaxed">${parseInline(olMatch[2])}</li>`);
      continue;
    }

    // If we were in a list, close it now that we hit a non-list line
    if (inList) {
      closeList();
    }

    // Blank lines
    if (!line.trim()) {
      continue;
    }

    // Standard Paragraph
    output.push(`<p class="my-2.5 text-neutral-800 dark:text-neutral-200 text-sm sm:text-base leading-relaxed">${parseInline(line)}</p>`);
  }

  // Close any unclosed blocks
  closeCodeBlock();
  closeAllBlockContainers();

  return output.join('\n');
}
