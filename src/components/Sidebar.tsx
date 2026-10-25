import React, { useRef } from 'react';
import {
  PenLine,
  Plus,
  Moon,
  Sun,
  RotateCcw,
  HelpCircle,
  X,
  Upload,
} from 'lucide-react';
import { Note } from '../types/note';
import { SearchInput } from './SearchInput';
import { NotesList } from './NotesList';
import { getModifierKey } from '../lib/shortcuts';

interface SidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onImportNote?: (title: string, content: string) => void;
  onTogglePin?: (id: string) => void;
  onRequestDelete: (note: Note) => void;
  onRequestReset: () => void;
  onOpenShortcuts: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onSelectNote,
  onCreateNote,
  onImportNote,
  onTogglePin,
  onRequestDelete,
  onRequestReset,
  onOpenShortcuts,
  isDarkMode,
  onToggleTheme,
  isOpenMobile,
  onCloseMobile,
  searchInputRef,
}) => {
  const mod = getModifierKey();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAndCloseMobile = (id: string) => {
    onSelectNote(id);
    onCloseMobile();
  };

  const handleCreateAndCloseMobile = () => {
    onCreateNote();
    onCloseMobile();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onImportNote) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const title = file.name.replace(/\.[^/.]+$/, '');
        onImportNote(title, text);
        onCloseMobile();
      };
      reader.readAsText(file);
    }
  };

  const sidebarContent = (
    <aside className="w-72 sm:w-80 h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 select-none">
      {/* Brand & App Title */}
      <div className="p-4 pb-3 border-b border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
            <PenLine className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Focus Notepad
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Distraction-Free Markdown
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Note & Open File Buttons */}
      <div className="p-3 space-y-2 border-b border-neutral-200/50 dark:border-neutral-800/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCreateAndCloseMobile}
            className="flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </div>
            <kbd className="text-[10px] font-mono opacity-60">
              {mod}N
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Open text/markdown file"
            className="p-2 border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <SearchInput
          ref={searchInputRef}
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />
      </div>

      {/* Notes List */}
      <NotesList
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectAndCloseMobile}
        onRequestDelete={onRequestDelete}
        onTogglePin={onTogglePin}
        onCreateNote={handleCreateAndCloseMobile}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />

      {/* Sidebar Footer */}
      <footer className="p-3 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
          <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
            className="p-1.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts"
            aria-label="Keyboard shortcuts"
            className="p-1.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRequestReset}
            title="Reset to sample notes"
            aria-label="Reset all notes"
            className="p-1.5 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer with Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full shadow-2xl flex">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
