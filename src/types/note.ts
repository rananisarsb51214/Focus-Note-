export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

export interface EditorSettings {
  fontSize: number; // e.g. 13, 15, 17
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

export type ViewMode = 'editor' | 'split' | 'preview';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface StorageResult {
  success: boolean;
  error?: string;
}

export interface CursorPosition {
  line: number;
  column: number;
}
