# Focus Notepad — Full Architecture & Feature Specification

## Overview
**Focus Notepad** is a distraction-free, professional Notepad and Markdown writing environment designed with zero external backend dependencies, client-side encryption-readiness, multi-tab document editing, instant debounced persistence, and comprehensive Markdown rendering.

---

## 1. Key Architectural Pillars

### A. Dual Document Interface (Notepad + Markdown)
- **Multi-Document Tabs**: Open and switch between active documents across the top tab strip.
- **Line Numbers & Word Wrap**: Real-time line number gutter with synchronized scroll and soft/hard wrap toggling.
- **Font Customization**: Monospace, Sans, and Serif typography switching with on-the-fly font size adjustment (11px to 24px).
- **Find & Replace**: In-document search and batch replace with case sensitivity and match count indicators (`Ctrl/Cmd + F`).
- **File Import & Drag-Drop**: Drag `.txt` or `.md` files directly onto the editor canvas or use the Upload trigger to load files from disk.
- **Export & Print**: One-click export to Markdown (`.md`), Plain Text (`.txt`), Web Page (`.html`), and printer-friendly output (`window.print`).

### B. Distraction-Free Markdown Experience
- **Live Markdown Preview**: Split-screen side-by-side view, editor-only mode, or full preview mode.
- **Zero-Dependency Security Parser**: Complete XSS protection via pre-render HTML entity escaping and strict link protocol verification (`https:`, `http:`, `mailto:`, `tel:`, `#`).
- **Zen Mode**: Instant fullscreen writing environment removing all peripheral chrome.

### C. Offline-First Resilience & Persistence
- **Storage Key**: `focus-notes-v1` (Version 2 Schema).
- **Debounced Save**: 350ms debounced writes preventing unnecessary disk thrashing.
- **Force Save**: `⌘S` / `Ctrl+S` immediately flushes in-memory edits to LocalStorage.
- **Safe Neighbor Deletion**: Deleting a selected note automatically transfers focus to the nearest logical sibling.
- **Quota Protection**: Intercepts `QuotaExceededError` and surfaces actionable recovery banners.

---

## 2. Data Schema

```typescript
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface EditorSettings {
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  fontFamily: 'mono' | 'sans' | 'serif';
}

export interface NotesState {
  version: number;
  notes: Note[];
  selectedNoteId: string | null;
  openTabIds: string[];
  settings: EditorSettings;
}
```

---

## 3. Keyboard Shortcut Reference

| Shortcut | Description |
|---|---|
| `⌘ + N` / `Ctrl + N` | Create new note |
| `⌘ + K` / `Ctrl + K` | Focus quick search |
| `⌘ + F` / `Ctrl + F` | Toggle Find & Replace bar |
| `⌘ + S` / `Ctrl + S` | Force save note immediately |
| `⌘ + W` / `Ctrl + W` | Close active tab |
| `Tab` | Indent 2 spaces |
| `Shift + Tab` | Unindent 2 spaces |
| `↑` / `↓` | Navigate sidebar notes list |
| `Enter` | Open focused note |
| `Esc` | Close dialogs, exit zen mode, or dismiss find bar |

---

## 4. Verification & Testing Checklist

- [x] Multi-tab document opening, switching, and closing (`⌘W`)
- [x] Find & Replace with case matching and replace-all
- [x] Real-time cursor position (`Ln X, Col Y`) tracking in status bar
- [x] Line numbers gutter synchronized scrolling
- [x] Word wrap and font family toggles
- [x] Drag & drop file imports for `.txt` and `.md`
- [x] Multi-format export (`.md`, `.txt`, `.html`) and Print
- [x] Pinned note bubble sorting
- [x] Light / Dark mode persistence
- [x] LocalStorage error handling and schema upgrade support
