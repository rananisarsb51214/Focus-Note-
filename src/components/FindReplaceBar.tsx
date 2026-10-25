import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowDown, ArrowUp, Replace, CheckCheck, X, CaseSensitive } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (newContent: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  content,
  onContentChange,
  textareaRef,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);

  const findInputRef = useRef<HTMLInputElement>(null);

  // Focus find input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Compute all match positions
  useEffect(() => {
    if (!findText) {
      setMatches([]);
      setCurrentIndex(0);
      return;
    }

    const needle = matchCase ? findText : findText.toLowerCase();
    const haystack = matchCase ? content : content.toLowerCase();

    const results: number[] = [];
    let pos = haystack.indexOf(needle);
    while (pos !== -1) {
      results.push(pos);
      pos = haystack.indexOf(needle, pos + needle.length);
    }

    setMatches(results);
    if (results.length > 0) {
      setCurrentIndex((prev) => (prev >= results.length ? 0 : prev));
    } else {
      setCurrentIndex(0);
    }
  }, [findText, content, matchCase]);

  // Scroll and highlight match in textarea
  const highlightMatch = (index: number) => {
    const textarea = textareaRef.current;
    if (!textarea || matches.length === 0 || !matches[index]) return;

    const startPos = matches[index];
    const endPos = startPos + findText.length;

    textarea.focus();
    textarea.setSelectionRange(startPos, endPos);
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    highlightMatch(nextIdx);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    highlightMatch(prevIdx);
  };

  const handleReplace = () => {
    if (matches.length === 0 || !matches[currentIndex]) return;
    const pos = matches[currentIndex];
    const newContent = content.substring(0, pos) + replaceText + content.substring(pos + findText.length);
    onContentChange(newContent);
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(
      findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      matchCase ? 'g' : 'gi'
    );
    const newContent = content.replace(regex, replaceText);
    onContentChange(newContent);
  };

  if (!isOpen) return null;

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Find Input */}
        <div className="relative flex items-center min-w-[160px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 pointer-events-none" />
          <input
            ref={findInputRef}
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handlePrev();
                else handleNext();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Find in note..."
            className="w-full pl-7 pr-7 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-hidden focus:border-neutral-400"
          />
          {findText && (
            <button
              type="button"
              onClick={() => setFindText('')}
              className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Match Count badge */}
        <span className="text-[11px] font-mono text-neutral-500 tabular-nums shrink-0">
          {matches.length > 0 ? `${currentIndex + 1} of ${matches.length}` : findText ? 'No matches' : ''}
        </span>

        {/* Prev / Next */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matches.length === 0}
            title="Previous match (Shift+Enter)"
            className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={matches.length === 0}
            title="Next match (Enter)"
            className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMatchCase((prev) => !prev)}
            title="Match Case"
            className={`p-1 rounded transition-colors cursor-pointer ${
              matchCase
                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-500'
            }`}
          >
            <CaseSensitive className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-1 hidden sm:block" />

        {/* Replace Input */}
        <div className="relative flex items-center min-w-[140px] flex-1 max-w-xs">
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleReplace();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Replace with..."
            className="w-full px-2.5 py-1 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-hidden focus:border-neutral-400"
          />
        </div>

        {/* Replace buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleReplace}
            disabled={matches.length === 0}
            className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 rounded font-medium disabled:opacity-40 transition-colors cursor-pointer"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 rounded font-medium disabled:opacity-40 transition-colors cursor-pointer"
          >
            Replace All
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
        title="Close Find & Replace (Esc)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
