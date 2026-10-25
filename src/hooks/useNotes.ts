import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Note, NotesState, SaveStatus, EditorSettings } from '../types/note';
import { loadNotesState, saveNotesState, clearNotesState } from '../lib/storage';
import { markdownToHtml } from '../lib/markdown';

export function useNotes() {
  const [state, setState] = useState<NotesState>(() => loadNotesState());
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [storageError, setStorageError] = useState<string | null>(null);

  // Ref to hold the latest state for debounced save without stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search filtered notes (case-insensitive across title and content)
  // Pinned notes bubble to top, then sorted by updatedAt
  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = state.notes;

    if (query) {
      result = state.notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const contentMatch = note.content.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      });
    }

    return [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [state.notes, searchQuery]);

  // Selected note object
  const selectedNote = useMemo(() => {
    if (!state.selectedNoteId) return null;
    return state.notes.find((n) => n.id === state.selectedNoteId) || null;
  }, [state.notes, state.selectedNoteId]);

  // Open tabs list of note objects
  const openTabs = useMemo(() => {
    return state.openTabIds
      .map((tabId) => state.notes.find((n) => n.id === tabId))
      .filter((n): n is Note => Boolean(n));
  }, [state.notes, state.openTabIds]);

  // Immediately flush write to LocalStorage
  const flushSave = useCallback((overrideState?: NotesState) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const targetState = overrideState || stateRef.current;
    const res = saveNotesState(targetState);
    if (res.success) {
      setSaveStatus('saved');
      setStorageError(null);
    } else {
      setSaveStatus('error');
      setStorageError(res.error || 'Failed to persist note.');
    }
  }, []);

  // Debounced save
  const scheduleSave = useCallback((newState: NotesState) => {
    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushSave(newState);
    }, 350);
  }, [flushSave]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Create a new note
  const createNote = useCallback(() => {
    flushSave();

    const now = new Date().toISOString();
    const newId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNote: Note = {
      id: newId,
      title: 'Untitled Note',
      content: '',
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => {
      const updatedNotes = [newNote, ...prev.notes];
      const nextOpenTabs = prev.openTabIds.includes(newId)
        ? prev.openTabIds
        : [...prev.openTabIds, newId];

      const newState: NotesState = {
        ...prev,
        notes: updatedNotes,
        selectedNoteId: newId,
        openTabIds: nextOpenTabs,
      };

      flushSave(newState);
      return newState;
    });

    setSearchQuery('');
    return newNote;
  }, [flushSave]);

  // Import note from file content
  const importNote = useCallback((title: string, content: string) => {
    flushSave();

    const now = new Date().toISOString();
    const newId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNote: Note = {
      id: newId,
      title: title || 'Imported Note',
      content: content || '',
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => {
      const updatedNotes = [newNote, ...prev.notes];
      const newState: NotesState = {
        ...prev,
        notes: updatedNotes,
        selectedNoteId: newId,
        openTabIds: [...prev.openTabIds, newId],
      };
      flushSave(newState);
      return newState;
    });

    setSearchQuery('');
  }, [flushSave]);

  // Update note title or content
  const updateNote = useCallback((id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'isPinned'>>) => {
    const now = new Date().toISOString();

    setState((prev) => {
      let changed = false;
      const nextNotes = prev.notes.map((note) => {
        if (note.id !== id) return note;

        const isTitleChanged = updates.title !== undefined && updates.title !== note.title;
        const isContentChanged = updates.content !== undefined && updates.content !== note.content;
        const isPinnedChanged = updates.isPinned !== undefined && updates.isPinned !== note.isPinned;

        if (!isTitleChanged && !isContentChanged && !isPinnedChanged) return note;

        changed = true;
        return {
          ...note,
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.content !== undefined ? { content: updates.content } : {}),
          ...(updates.isPinned !== undefined ? { isPinned: updates.isPinned } : {}),
          updatedAt: now,
        };
      });

      if (!changed) return prev;

      const newState: NotesState = {
        ...prev,
        notes: nextNotes,
      };

      scheduleSave(newState);
      return newState;
    });
  }, [scheduleSave]);

  // Select a note (and ensure it is opened in tabs)
  const selectNote = useCallback((id: string) => {
    flushSave();

    setState((prev) => {
      const nextOpenTabs = prev.openTabIds.includes(id)
        ? prev.openTabIds
        : [...prev.openTabIds, id];

      if (prev.selectedNoteId === id && prev.openTabIds.includes(id)) return prev;

      const newState: NotesState = {
        ...prev,
        selectedNoteId: id,
        openTabIds: nextOpenTabs,
      };
      saveNotesState(newState);
      return newState;
    });
  }, [flushSave]);

  // Close a specific tab
  const closeTab = useCallback((idToClose: string) => {
    setState((prev) => {
      const remainingTabs = prev.openTabIds.filter((id) => id !== idToClose);
      let nextSelectedId = prev.selectedNoteId;

      if (prev.selectedNoteId === idToClose) {
        if (remainingTabs.length > 0) {
          const closedIndex = prev.openTabIds.indexOf(idToClose);
          const nextIndex = Math.min(closedIndex, remainingTabs.length - 1);
          nextSelectedId = remainingTabs[nextIndex];
        } else {
          nextSelectedId = null;
        }
      }

      const newState: NotesState = {
        ...prev,
        openTabIds: remainingTabs,
        selectedNoteId: nextSelectedId,
      };
      saveNotesState(newState);
      return newState;
    });
  }, []);

  // Close other tabs except the active one
  const closeOtherTabs = useCallback((keepId: string) => {
    setState((prev) => {
      const newState: NotesState = {
        ...prev,
        openTabIds: [keepId],
        selectedNoteId: keepId,
      };
      saveNotesState(newState);
      return newState;
    });
  }, []);

  // Delete note with sensible neighbor selection
  const deleteNote = useCallback((idToDelete: string) => {
    flushSave();

    setState((prev) => {
      const currentIndex = prev.notes.findIndex((n) => n.id === idToDelete);
      if (currentIndex === -1) return prev;

      const updatedNotes = prev.notes.filter((n) => n.id !== idToDelete);
      const remainingTabs = prev.openTabIds.filter((id) => id !== idToDelete);

      let nextSelectedId = prev.selectedNoteId;
      if (prev.selectedNoteId === idToDelete) {
        if (remainingTabs.length > 0) {
          const tabIndex = prev.openTabIds.indexOf(idToDelete);
          const nextIndex = Math.min(tabIndex, remainingTabs.length - 1);
          nextSelectedId = remainingTabs[nextIndex];
        } else if (updatedNotes.length > 0) {
          const nextIndex = Math.min(currentIndex, updatedNotes.length - 1);
          nextSelectedId = updatedNotes[nextIndex].id;
          remainingTabs.push(nextSelectedId);
        } else {
          nextSelectedId = null;
        }
      }

      const newState: NotesState = {
        ...prev,
        notes: updatedNotes,
        openTabIds: remainingTabs,
        selectedNoteId: nextSelectedId,
      };

      flushSave(newState);
      return newState;
    });
  }, [flushSave]);

  // Duplicate a note
  const duplicateNote = useCallback((idToDuplicate: string) => {
    flushSave();

    setState((prev) => {
      const original = prev.notes.find((n) => n.id === idToDuplicate);
      if (!original) return prev;

      const now = new Date().toISOString();
      const newId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duplicatedNote: Note = {
        id: newId,
        title: original.title ? `${original.title} (Copy)` : 'Untitled Note (Copy)',
        content: original.content,
        createdAt: now,
        updatedAt: now,
      };

      const newState: NotesState = {
        ...prev,
        notes: [duplicatedNote, ...prev.notes],
        openTabIds: [...prev.openTabIds, newId],
        selectedNoteId: newId,
      };

      flushSave(newState);
      return newState;
    });
  }, [flushSave]);

  // Toggle note pin
  const togglePin = useCallback((id: string) => {
    setState((prev) => {
      const nextNotes = prev.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
      const newState: NotesState = { ...prev, notes: nextNotes };
      saveNotesState(newState);
      return newState;
    });
  }, []);

  // Update editor settings
  const updateSettings = useCallback((partial: Partial<EditorSettings>) => {
    setState((prev) => {
      const newSettings = { ...prev.settings, ...partial };
      const newState: NotesState = { ...prev, settings: newSettings };
      saveNotesState(newState);
      return newState;
    });
  }, []);

  // Reset to initial notes
  const resetNotes = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const fresh = clearNotesState();
    setState(fresh);
    setSearchQuery('');
    setSaveStatus('saved');
    setStorageError(null);
  }, []);

  // Export note formats
  const exportNote = useCallback((note: Note, format: 'md' | 'txt' | 'html' = 'md') => {
    const rawTitle = note.title.trim() || 'Untitled Note';
    const safeTitle = rawTitle.replace(/[/\\?%*:|"<>]/g, '-');

    let blob: Blob;
    let extension = 'md';

    if (format === 'txt') {
      extension = 'txt';
      const textContent = `${rawTitle}\n\n${note.content}`;
      blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    } else if (format === 'html') {
      extension = 'html';
      const rendered = markdownToHtml(note.content);
      const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${rawTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 760px; margin: 40px auto; padding: 0 20px; color: #171717; }
    h1 { border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
    pre { background: #1e1e1e; color: #fff; padding: 14px; border-radius: 6px; overflow-x: auto; }
    code { font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
    blockquote { border-left: 3px solid #d1d5db; margin: 0; padding-left: 14px; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #e5e5e5; padding: 8px 12px; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>${rawTitle}</h1>
  ${rendered}
</body>
</html>`;
      blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    } else {
      extension = 'md';
      const fullContent = `# ${rawTitle}\n\n${note.content}`;
      blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Print Note
  const printNote = useCallback((note: Note) => {
    const rawTitle = note.title.trim() || 'Untitled Note';
    const rendered = markdownToHtml(note.content);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${rawTitle}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 24px; color: #111; max-width: 800px; margin: 0 auto; }
    h1 { border-bottom: 1px solid #ccc; padding-bottom: 8px; font-size: 24px; }
    pre { background: #f5f5f5; border: 1px solid #ddd; padding: 12px; border-radius: 4px; }
    blockquote { border-left: 3px solid #888; margin-left: 0; padding-left: 12px; color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${rawTitle}</h1>
  ${rendered}
  <script>
    window.onload = function() { window.print(); window.close(); }
  </script>
</body>
</html>`);
    printWindow.document.close();
  }, []);

  return {
    notes: state.notes,
    filteredNotes,
    selectedNote,
    selectedNoteId: state.selectedNoteId,
    openTabs,
    openTabIds: state.openTabIds,
    settings: state.settings,
    searchQuery,
    setSearchQuery,
    saveStatus,
    storageError,
    createNote,
    importNote,
    updateNote,
    selectNote,
    closeTab,
    closeOtherTabs,
    deleteNote,
    duplicateNote,
    togglePin,
    updateSettings,
    resetNotes,
    exportNote,
    printNote,
    forceSave: () => flushSave(),
  };
}
