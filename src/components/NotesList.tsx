import React, { useRef } from 'react';
import { Trash2, FileText, Plus, SearchX, Pin } from 'lucide-react';
import { Note } from '../types/note';

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onRequestDelete: (note: Note) => void;
  onTogglePin?: (id: string) => void;
  onCreateNote: () => void;
  searchQuery: string;
  onClearSearch: () => void;
}

/**
 * Formats ISO timestamp into concise, readable relative or calendar time.
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

/**
 * Cleans markdown to extract a readable preview snippet.
 */
function getExcerpt(content: string): string {
  if (!content || !content.trim()) return 'Empty note';
  const lines = content.split('\n');
  for (const line of lines) {
    const cleaned = line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/^>\s+/, '')
      .replace(/[*_~`]/g, '')
      .trim();
    if (cleaned) {
      return cleaned.slice(0, 75);
    }
  }
  return 'Empty note';
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onRequestDelete,
  onTogglePin,
  onCreateNote,
  searchQuery,
  onClearSearch,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, notes.length - 1);
      const nextItem = listRef.current?.querySelectorAll<HTMLDivElement>('[data-note-item]')[nextIndex];
      nextItem?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      const prevItem = listRef.current?.querySelectorAll<HTMLDivElement>('[data-note-item]')[prevIndex];
      prevItem?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (notes[index]) {
        onSelectNote(notes[index].id);
      }
    }
  };

  if (notes.length === 0) {
    if (searchQuery.trim()) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
            <SearchX className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            No matching notes
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[200px]">
            No notes contain "{searchQuery}". Try different keywords.
          </p>
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-3.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
          <FileText className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          No notes yet
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[200px]">
          Create your first note to start capturing your thoughts.
        </p>
        <button
          type="button"
          onClick={onCreateNote}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Note
        </button>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Notes"
      className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1 focus:outline-hidden"
    >
      {notes.map((note, index) => {
        const isSelected = note.id === selectedNoteId;
        const excerpt = getExcerpt(note.content);
        const timeFormatted = formatTimestamp(note.updatedAt);

        return (
          <div
            key={note.id}
            data-note-item
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={() => onSelectNote(note.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`group relative rounded-lg p-3 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 ${
              isSelected
                ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate flex-1">
                {note.isPinned && (
                  <Pin className="w-3 h-3 text-amber-500 shrink-0 -rotate-45" />
                )}
                <h4
                  className={`text-sm font-semibold truncate leading-snug ${
                    isSelected
                      ? 'text-neutral-950 dark:text-white'
                      : 'text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {note.title.trim() ? note.title : 'Untitled Note'}
                </h4>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {timeFormatted}
                </span>

                {onTogglePin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note.id);
                    }}
                    title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-neutral-400 hover:text-amber-500 rounded transition-all"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete(note);
                  }}
                  title="Delete note"
                  aria-label={`Delete note: ${note.title || 'Untitled Note'}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-1 leading-normal font-normal">
              {excerpt}
            </p>
          </div>
        );
      })}
    </div>
  );
};
