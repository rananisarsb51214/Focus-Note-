import React from 'react';
import { Plus, X, Pin } from 'lucide-react';
import { Note } from '../types/note';

interface TabBarProps {
  tabs: Note[];
  selectedNoteId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewNote: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  selectedNoteId,
  onSelectTab,
  onCloseTab,
  onNewNote,
}) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-neutral-100/70 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 px-2 pt-1.5 overflow-x-auto select-none gap-1 shrink-0 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.id === selectedNoteId;
        const title = tab.title.trim() ? tab.title : 'Untitled Note';

        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-lg transition-all cursor-pointer border-t border-x shrink-0 max-w-[200px] ${
              isActive
                ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800 shadow-2xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40'
            }`}
          >
            {tab.isPinned && (
              <Pin className="w-3 h-3 text-neutral-400 dark:text-neutral-500 shrink-0 -rotate-45" />
            )}

            <span className="truncate flex-1">{title}</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              title="Close tab"
              className="p-0.5 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors opacity-70 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNewNote}
        title="New Note (⌘N)"
        className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-md transition-colors shrink-0 cursor-pointer mb-0.5"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
