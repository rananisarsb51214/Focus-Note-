import React from 'react';
import {
  Printer,
  FileDown,
  Hash,
  WrapText,
  Type,
} from 'lucide-react';
import { EditorSettings, CursorPosition, Note } from '../types/note';
import { TextStats } from '../lib/markdown';

interface StatusBarProps {
  stats: TextStats;
  cursorPos: CursorPosition;
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  onExport: (format: 'md' | 'txt' | 'html') => void;
  onPrint: () => void;
  note: Note | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  cursorPos,
  settings,
  onUpdateSettings,
  onExport,
  onPrint,
  note,
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const cycleFontFamily = () => {
    const families: EditorSettings['fontFamily'][] = ['mono', 'sans', 'serif'];
    const nextIdx = (families.indexOf(settings.fontFamily) + 1) % families.length;
    onUpdateSettings({ fontFamily: families[nextIdx] });
  };

  const increaseFontSize = () => {
    onUpdateSettings({ fontSize: Math.min(settings.fontSize + 1, 24) });
  };

  const decreaseFontSize = () => {
    onUpdateSettings({ fontSize: Math.max(settings.fontSize - 1, 11) });
  };

  return (
    <footer className="h-7 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900 px-3 flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 select-none tabular-nums shrink-0">
      {/* Left zone: Cursor position & Metrics */}
      <div className="flex items-center gap-3">
        <span>
          Ln {cursorPos.line}, Col {cursorPos.column}
        </span>
        <span aria-hidden="true" className="opacity-40">·</span>
        <span>{stats.lines} lines</span>
        <span aria-hidden="true" className="opacity-40">·</span>
        <span>{stats.words} words</span>
        <span aria-hidden="true" className="opacity-40">·</span>
        <span className="hidden sm:inline">{stats.characters} chars</span>
      </div>

      {/* Right zone: Settings, Font, Encoding, and Export actions */}
      <div className="flex items-center gap-2">
        {/* Toggle Line Numbers */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ lineNumbers: !settings.lineNumbers })}
          title={`Line numbers: ${settings.lineNumbers ? 'On' : 'Off'}`}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            settings.lineNumbers
              ? 'text-neutral-800 dark:text-neutral-200 font-medium'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <Hash className="w-3 h-3" />
          <span className="hidden sm:inline">Lines</span>
        </button>

        {/* Toggle Word Wrap */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ wordWrap: !settings.wordWrap })}
          title={`Word wrap: ${settings.wordWrap ? 'On' : 'Off'}`}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            settings.wordWrap
              ? 'text-neutral-800 dark:text-neutral-200 font-medium'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <WrapText className="w-3 h-3" />
          <span className="hidden sm:inline">Wrap</span>
        </button>

        {/* Font Family Switcher */}
        <button
          type="button"
          onClick={cycleFontFamily}
          title="Change font family (Mono / Sans / Serif)"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer uppercase"
        >
          <Type className="w-3 h-3" />
          <span>{settings.fontFamily}</span>
        </button>

        {/* Font Size Adjuster */}
        <div className="hidden md:flex items-center gap-0.5 bg-neutral-200/50 dark:bg-neutral-800/60 rounded px-1">
          <button
            type="button"
            onClick={decreaseFontSize}
            title="Decrease font size"
            className="px-1 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            -
          </button>
          <span>{settings.fontSize}px</span>
          <button
            type="button"
            onClick={increaseFontSize}
            title="Increase font size"
            className="px-1 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            +
          </button>
        </div>

        <span aria-hidden="true" className="opacity-40 hidden sm:inline">·</span>

        {/* Encoding & Format */}
        <span className="hidden lg:inline">UTF-8</span>
        <span aria-hidden="true" className="opacity-40 hidden lg:inline">·</span>
        <span className="hidden lg:inline">Markdown</span>

        {/* Print Note */}
        {note && (
          <button
            type="button"
            onClick={onPrint}
            title="Print document"
            className="p-1 hover:text-neutral-800 dark:hover:text-neutral-200 rounded transition-colors cursor-pointer"
          >
            <Printer className="w-3 h-3" />
          </button>
        )}

        {/* Export Menu Dropdown */}
        {note && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              title="Export options"
              className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300"
            >
              <FileDown className="w-3 h-3" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-30"
                onClick={() => setShowExportMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => onExport('md')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => onExport('txt')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  Plain Text (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => onExport('html')}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  Web Page (.html)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};
