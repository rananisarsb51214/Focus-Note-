import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { getModifierKey } from '../lib/shortcuts';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  resultCount?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, onKeyDown, placeholder = 'Search notes...', resultCount }, ref) => {
    const mod = getModifierKey();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        if (value) {
          onClear();
        } else {
          (e.target as HTMLInputElement).blur();
        }
      }
      onKeyDown?.(e);
    };

    return (
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search notes"
          className="w-full pl-9 pr-14 py-2 text-sm bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-lg border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-900 focus:outline-hidden transition-all duration-150"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded transition-colors"
              title="Clear search (Esc)"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-200/60 dark:bg-neutral-700/60 rounded border border-neutral-300/40 dark:border-neutral-600/40 pointer-events-none">
              {mod}K
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
