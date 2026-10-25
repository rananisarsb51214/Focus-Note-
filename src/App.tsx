/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from './hooks/useNotes';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { ConfirmDialog } from './components/ConfirmDialog';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { isShortcutPressed } from './lib/shortcuts';
import { Note } from './types/note';

export default function App() {
  const {
    filteredNotes,
    selectedNote,
    selectedNoteId,
    openTabs,
    settings,
    searchQuery,
    setSearchQuery,
    saveStatus,
    storageError,
    createNote,
    importNote,
    updateNote,
    selectNote,
    closeTab,
    deleteNote,
    togglePin,
    updateSettings,
    resetNotes,
    exportNote,
    printNote,
    forceSave,
  } = useNotes();

  // Dark mode theme management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('focus-notes-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('focus-notes-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('focus-notes-theme', 'light');
    }
  }, [isDarkMode]);

  // Modal dialog states
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Search input ref to trigger focus from Ctrl+K
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New Note
      if (isShortcutPressed(e, 'n')) {
        e.preventDefault();
        createNote();
        setIsMobileSidebarOpen(false);
        return;
      }

      // Cmd/Ctrl + K: Search
      if (isShortcutPressed(e, 'k')) {
        e.preventDefault();
        setIsMobileSidebarOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
        return;
      }

      // Cmd/Ctrl + S: Force Save
      if (isShortcutPressed(e, 's')) {
        e.preventDefault();
        forceSave();
        return;
      }

      // Cmd/Ctrl + W: Close Active Tab
      if (isShortcutPressed(e, 'w')) {
        e.preventDefault();
        if (selectedNoteId) {
          closeTab(selectedNoteId);
        }
        return;
      }

      // Escape: Close modals or search
      if (e.key === 'Escape') {
        if (noteToDelete) {
          setNoteToDelete(null);
        } else if (isResetConfirmOpen) {
          setIsResetConfirmOpen(false);
        } else if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isMobileSidebarOpen) {
          setIsMobileSidebarOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [createNote, forceSave, closeTab, selectedNoteId, noteToDelete, isResetConfirmOpen, isShortcutsOpen, isMobileSidebarOpen]);

  // Handle Note Deletion confirmation
  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      setNoteToDelete(null);
    }
  };

  // Handle Reset confirmation
  const handleConfirmReset = () => {
    resetNotes();
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        notes={filteredNotes}
        selectedNoteId={selectedNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        onSelectNote={selectNote}
        onCreateNote={createNote}
        onImportNote={importNote}
        onTogglePin={togglePin}
        onRequestDelete={(note) => setNoteToDelete(note)}
        onRequestReset={() => setIsResetConfirmOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        searchInputRef={searchInputRef}
      />

      {/* Main Notepad Workspace */}
      <NoteEditor
        note={selectedNote}
        openTabs={openTabs}
        selectedNoteId={selectedNoteId}
        saveStatus={saveStatus}
        storageError={storageError}
        settings={settings}
        onUpdateSettings={updateSettings}
        onSelectTab={selectNote}
        onCloseTab={closeTab}
        onUpdateNote={updateNote}
        onCreateNote={createNote}
        onImportNote={importNote}
        onExportNote={exportNote}
        onPrintNote={printNote}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isSidebarOpen={isMobileSidebarOpen}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title="Delete Note"
        message={`Are you sure you want to permanently delete "${
          noteToDelete?.title || 'Untitled Note'
        }"? This action cannot be undone.`}
        confirmLabel="Delete Note"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setNoteToDelete(null)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset All Notes"
        message="Are you sure you want to reset your notes? Your current notes will be replaced with the default starter notes."
        confirmLabel="Reset Notes"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Keyboard Shortcuts Reference Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
