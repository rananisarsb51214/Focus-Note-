import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Eye,
  Edit3,
  Columns,
  Maximize2,
  Minimize2,
  Menu,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Plus,
  Search,
  Pin,
  Upload,
} from 'lucide-react';
import { Note, SaveStatus, ViewMode, EditorSettings, CursorPosition } from '../types/note';
import { calculateStats } from '../lib/markdown';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { FindReplaceBar } from './FindReplaceBar';

interface NoteEditorProps {
  note: Note | null;
  openTabs: Note[];
  selectedNoteId: string | null;
  saveStatus: SaveStatus;
  storageError: string | null;
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'isPinned'>>) => void;
  onCreateNote: () => void;
  onImportNote: (title: string, content: string) => void;
  onExportNote: (note: Note, format?: 'md' | 'txt' | 'html') => void;
  onPrintNote: (note: Note) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  openTabs,
  selectedNoteId,
  saveStatus,
  storageError,
  settings,
  onUpdateSettings,
  onSelectTab,
  onCloseTab,
  onUpdateNote,
  onCreateNote,
  onImportNote,
  onExportNote,
  onPrintNote,
  onToggleSidebar,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [isZenMode, setIsZenMode] = useState(false);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ line: 1, column: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute text statistics
  const stats = useMemo(() => {
    return calculateStats(note?.content || '');
  }, [note?.content]);

  // Compute line count array for line numbers
  const linesCount = useMemo(() => {
    if (!note?.content) return 1;
    return note.content.split('\n').length;
  }, [note?.content]);

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Update cursor line and column position on selection changes
  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea || !note) return;

    const selStart = textarea.selectionStart;
    const textBefore = note.content.substring(0, selStart);
    const lines = textBefore.split('\n');
    const currentLine = lines.length;
    const currentColumn = lines[lines.length - 1].length + 1;

    setCursorPos({ line: currentLine, column: currentColumn });
  };

  // Keyboard navigation and shortcut bindings
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Open Find & Replace: Ctrl/Cmd + F
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setIsFindOpen(true);
      return;
    }

    // Tab key indent/unindent
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Unindent
        const lines = note?.content || '';
        const lastNewline = lines.lastIndexOf('\n', start - 1);
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        if (lines.substring(lineStart, lineStart + 2) === '  ') {
          const newContent = lines.substring(0, lineStart) + lines.substring(lineStart + 2);
          if (note) onUpdateNote(note.id, { content: newContent });
          setTimeout(() => {
            textarea.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, end - 2));
            updateCursorPosition();
          }, 0);
        }
      } else {
        // Indent 2 spaces
        const currentContent = note?.content || '';
        const newContent = currentContent.substring(0, start) + '  ' + currentContent.substring(end);
        if (note) onUpdateNote(note.id, { content: newContent });
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
          updateCursorPosition();
        }, 0);
      }
    }
  };

  // File drop handler to import notes directly from desktop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const title = file.name.replace(/\.[^/.]+$/, '');
        onImportNote(title, text);
      };
      reader.readAsText(file);
    }
  };

  // File input change handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const title = file.name.replace(/\.[^/.]+$/, '');
        onImportNote(title, text);
      };
      reader.readAsText(file);
    }
  };

  // Font family css class based on settings
  const fontFamilyClass =
    settings.fontFamily === 'mono'
      ? 'font-mono'
      : settings.fontFamily === 'serif'
      ? 'font-serif'
      : 'font-sans';

  if (!note) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-50/50 dark:bg-neutral-950 text-center">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
          No Note Selected
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
          Select a note from the sidebar, open a tab, or create a new note to start writing.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateNote}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Note
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Open File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex-1 flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden ${
        isZenMode ? 'fixed inset-0 z-40' : 'relative'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Hidden file input for file open */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Storage Error Alert Banner */}
      {storageError && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/60 px-4 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{storageError}</span>
          </div>
        </div>
      )}

      {/* Multi-Document Tabs Bar */}
      <TabBar
        tabs={openTabs}
        selectedNoteId={selectedNoteId}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewNote={onCreateNote}
      />

      {/* Editor Top Navigation & Action Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Pin toggle button */}
          <button
            type="button"
            onClick={() => onUpdateNote(note.id, { isPinned: !note.isPinned })}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
            className={`p-1 rounded transition-colors ${
              note.isPinned
                ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? '-rotate-45' : ''}`} />
          </button>

          {/* Saving Status */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono shrink-0 select-none">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                <span className="hidden sm:inline">Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">Save error</span>
              </>
            )}
          </div>
        </div>

        {/* Right tools: Find, View modes, Zen */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Find & Replace Trigger */}
          <button
            type="button"
            onClick={() => setIsFindOpen((prev) => !prev)}
            title="Find & Replace (Ctrl+F)"
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              isFindOpen
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Find</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              title="Editor Only"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              title="Split View"
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              title="Preview Only"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Zen Focus Mode */}
          <button
            type="button"
            onClick={() => setIsZenMode((prev) => !prev)}
            title={isZenMode ? 'Exit Zen Mode (Esc)' : 'Zen Focus Mode'}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Find & Replace bar */}
      <FindReplaceBar
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
        content={note.content}
        onContentChange={(newContent) => onUpdateNote(note.id, { content: newContent })}
        textareaRef={textareaRef}
      />

      {/* Markdown Quick Formatting Toolbar */}
      {viewMode !== 'preview' && (
        <EditorToolbar
          textareaRef={textareaRef}
          content={note.content}
          onChange={(newContent) => onUpdateNote(note.id, { content: newContent })}
          onExport={() => onExportNote(note, 'md')}
        />
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className={`flex-1 flex flex-col h-full bg-white dark:bg-neutral-950 overflow-hidden ${
              viewMode === 'split' ? 'border-r border-neutral-200 dark:border-neutral-800' : ''
            }`}
          >
            {/* Note Title Input */}
            <div className="px-6 sm:px-8 pt-5 pb-2">
              <input
                type="text"
                value={note.title}
                onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
                placeholder="Note title..."
                className="w-full text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 bg-transparent border-none outline-hidden focus:ring-0 px-0"
              />
            </div>

            {/* Editor with Optional Line Numbers */}
            <div className="flex-1 flex overflow-hidden px-4 sm:px-6 pb-2">
              {/* Line Numbers Gutter */}
              {settings.lineNumbers && (
                <div
                  ref={lineNumbersRef}
                  aria-hidden="true"
                  className="w-10 pr-3 text-right font-mono text-neutral-300 dark:text-neutral-700 select-none overflow-hidden shrink-0"
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: '1.6',
                  }}
                >
                  {Array.from({ length: linesCount }, (_, i) => (
                    <div key={i + 1}>{i + 1}</div>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={(e) => {
                  onUpdateNote(note.id, { content: e.target.value });
                  updateCursorPosition();
                }}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                onClick={updateCursorPosition}
                onKeyUp={updateCursorPosition}
                placeholder="Type your notes or Markdown here..."
                wrap={settings.wordWrap ? 'soft' : 'off'}
                className={`flex-1 resize-none bg-transparent text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 border-none outline-hidden focus:ring-0 p-0 selection:bg-neutral-200 dark:selection:bg-neutral-700 ${fontFamilyClass} ${
                  !settings.wordWrap ? 'overflow-x-auto whitespace-pre' : ''
                }`}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: '1.6',
                }}
                spellCheck="false"
              />
            </div>
          </div>
        )}

        {/* Markdown Rendered Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 h-full bg-neutral-50/40 dark:bg-neutral-900/20 overflow-hidden">
            <MarkdownPreview title={note.title} content={note.content} />
          </div>
        )}
      </div>

      {/* Notepad Status Bar */}
      <StatusBar
        stats={stats}
        cursorPos={cursorPos}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onExport={(format) => onExportNote(note, format)}
        onPrint={() => onPrintNote(note)}
        note={note}
      />
    </main>
  );
};
