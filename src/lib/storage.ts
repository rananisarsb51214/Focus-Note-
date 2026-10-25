import { Note, NotesState, StorageResult, EditorSettings } from '../types/note';

export const STORAGE_KEY = 'focus-notes-v1';
export const CURRENT_VERSION = 2;

export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 15,
  lineNumbers: true,
  wordWrap: true,
  fontFamily: 'mono',
};

/**
 * Generates an initial seed note set for first-time users.
 */
export function createInitialNotes(): Note[] {
  const now = new Date();
  const isoNow = now.toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'welcome-to-focus-notes',
      title: 'Welcome to Focus Notepad',
      isPinned: true,
      content: `# Welcome to Focus Notepad ✍️

A professional, distraction-free Notepad & Markdown studio with multi-tab support, live preview, instant search, and zero lag.

---

### Key Capabilities
- **Multi-Tab Documents**: Open and switch between notes easily across the top tab strip.
- **Find & Replace**: Press **\`⌘F\`** or **\`Ctrl+F\`** to quickly search or replace text across your document.
- **Editor Customization**: Toggle line numbers, word wrap, and adjust font sizes directly from the status bar.
- **File Import & Export**: Drop \`.txt\` or \`.md\` files directly to open them, or export as Markdown, Plain Text, or HTML.
- **Automatic Saving**: Your notes are saved continuously to LocalStorage as you type.
- **Auto URL Detection**: Paste any raw URL like https://github.com or https://aistudio.google.com and it renders automatically as a clickable link!
- **Privacy First**: Everything stays in your browser. No accounts or tracking.

---

### Quick Keyboard Shortcuts
| Action | macOS | Windows / Linux |
| --- | --- | --- |
| New Note | \`⌘ + N\` | \`Ctrl + N\` |
| Quick Search | \`⌘ + K\` | \`Ctrl + K\` |
| Find & Replace | \`⌘ + F\` | \`Ctrl + F\` |
| Force Save | \`⌘ + S\` | \`Ctrl + S\` |
| Indent in Editor | \`Tab\` | \`Tab\` |
| Close Current Tab | \`⌘ + W\` | \`Ctrl + W\` |
| Dismiss Modal / Clear | \`Esc\` | \`Esc\` |

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci

Enjoy focused writing!`,
      createdAt: isoNow,
      updatedAt: isoNow,
    },
    {
      id: 'markdown-cheat-sheet',
      title: 'Markdown & Checklist Demo',
      content: `# Markdown Syntax Showcase

Use this note to test formatting, preview modes, and checklists.

### Checklists (Interactive Tasks)
- [x] Create a minimal notes app
- [x] Implement instant debounced saving
- [x] Add secure Markdown rendering
- [x] Add multi-tab document editing
- [x] Add find & replace with case sensitivity
- [ ] Write my next breakthrough idea

---

### Code Blocks
\`\`\`typescript
interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

function focusEditor(): void {
  console.log("Distraction-free Notepad active.");
}
\`\`\`

### Formatted Text & Quotes
You can use **bold text**, *italic emphasis*, and ~~strikethrough~~.

> Blockquotes are great for capturing quotes, callouts, and key takeaways from readings.

---

### Inline Elements
Link to [Google AI Studio](https://aistudio.google.com) or highlight key terms with \`monospace code\`.`,
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: 'meeting-notes-template',
      title: 'Meeting Notes: Architecture Review',
      content: `# Architecture Review & Next Steps

**Date**: Today  
**Attendees**: Engineering & Product Team

### Agenda
1. Review LocalStorage quota limits and offline resilience
2. Benchmark instant search filtering performance
3. Validate keyboard navigation across sidebar and editor

### Decisions
- Retain zero external backend dependencies for privacy and immediate response time.
- Debounce storage updates at 350ms to maintain smooth 60fps typing responsiveness.
- Use tabular numerals for all timestamps and character metrics.

### Action Items
- [x] Complete core component structure
- [x] Test across desktop, tablet, and mobile breakpoints
- [ ] Deploy to production preview`,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
    },
  ];
}

/**
 * Loads notes state from LocalStorage. Falls back to initial default notes safely.
 */
export function loadNotesState(): NotesState {
  if (typeof window === 'undefined') {
    const initial = createInitialNotes();
    return {
      version: CURRENT_VERSION,
      notes: initial,
      selectedNoteId: initial[0]?.id || null,
      openTabIds: initial.map((n) => n.id),
      settings: DEFAULT_SETTINGS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialNotes();
      const state: NotesState = {
        version: CURRENT_VERSION,
        notes: initial,
        selectedNoteId: initial[0]?.id || null,
        openTabIds: initial.map((n) => n.id),
        settings: DEFAULT_SETTINGS,
      };
      saveNotesState(state);
      return state;
    }

    const parsed = JSON.parse(raw);

    // Schema validation and recovery
    if (parsed && Array.isArray(parsed.notes)) {
      const notes: Note[] = parsed.notes.map((n: Partial<Note>, index: number) => ({
        id: typeof n.id === 'string' && n.id.trim() ? n.id : `note-${Date.now()}-${index}`,
        title: typeof n.title === 'string' ? n.title : 'Untitled Note',
        content: typeof n.content === 'string' ? n.content : '',
        createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
        updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : new Date().toISOString(),
        isPinned: Boolean(n.isPinned),
      }));

      let selectedId = parsed.selectedNoteId;
      if (!selectedId || !notes.some((n) => n.id === selectedId)) {
        selectedId = notes.length > 0 ? notes[0].id : null;
      }

      // Restore openTabIds safely
      let openTabIds: string[] = Array.isArray(parsed.openTabIds)
        ? parsed.openTabIds.filter((tabId: string) => notes.some((n) => n.id === tabId))
        : [];

      if (openTabIds.length === 0 && selectedId) {
        openTabIds = [selectedId];
      }

      const settings: EditorSettings = {
        fontSize: typeof parsed.settings?.fontSize === 'number' ? parsed.settings.fontSize : DEFAULT_SETTINGS.fontSize,
        lineNumbers: typeof parsed.settings?.lineNumbers === 'boolean' ? parsed.settings.lineNumbers : DEFAULT_SETTINGS.lineNumbers,
        wordWrap: typeof parsed.settings?.wordWrap === 'boolean' ? parsed.settings.wordWrap : DEFAULT_SETTINGS.wordWrap,
        fontFamily: ['mono', 'sans', 'serif'].includes(parsed.settings?.fontFamily) ? parsed.settings.fontFamily : DEFAULT_SETTINGS.fontFamily,
      };

      return {
        version: CURRENT_VERSION,
        notes,
        selectedNoteId: selectedId,
        openTabIds,
        settings,
      };
    }

    // Corrupted payload recovery
    console.warn('Focus Notepad: Detected corrupted storage data. Recovering default notes.');
    const initial = createInitialNotes();
    const state: NotesState = {
      version: CURRENT_VERSION,
      notes: initial,
      selectedNoteId: initial[0]?.id || null,
      openTabIds: initial.map((n) => n.id),
      settings: DEFAULT_SETTINGS,
    };
    saveNotesState(state);
    return state;
  } catch (error) {
    console.error('Focus Notepad: Failed to load from LocalStorage', error);
    const initial = createInitialNotes();
    return {
      version: CURRENT_VERSION,
      notes: initial,
      selectedNoteId: initial[0]?.id || null,
      openTabIds: initial.map((n) => n.id),
      settings: DEFAULT_SETTINGS,
    };
  }
}

/**
 * Persists notes state to LocalStorage with quota protection.
 */
export function saveNotesState(state: NotesState): StorageResult {
  if (typeof window === 'undefined') {
    return { success: true };
  }

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (error: unknown) {
    console.error('Focus Notepad: Storage save error', error);

    // Check for QuotaExceededError
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22 || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      return {
        success: false,
        error: 'Browser storage quota exceeded. Please delete unused notes to free space.',
      };
    }

    return {
      success: false,
      error: 'Unable to save notes to browser storage. Changes might not persist on reload.',
    };
  }
}

/**
 * Clears notes state and resets to initial default notes.
 */
export function clearNotesState(): NotesState {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Focus Notepad: Could not clear localStorage', e);
    }
  }

  const initial = createInitialNotes();
  const newState: NotesState = {
    version: CURRENT_VERSION,
    notes: initial,
    selectedNoteId: initial[0]?.id || null,
    openTabIds: initial.map((n) => n.id),
    settings: DEFAULT_SETTINGS,
  };
  saveNotesState(newState);
  return newState;
}
