import React, { useEffect } from 'react';
import { X, Command } from 'lucide-react';
import { getModifierKey } from '../lib/shortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const mod = getModifierKey();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { label: 'Create new note', keys: [`${mod}`, 'N'] },
    { label: 'Quick search notes', keys: [`${mod}`, 'K'] },
    { label: 'Force immediate save', keys: [`${mod}`, 'S'] },
    { label: 'Indent 2 spaces', keys: ['Tab'] },
    { label: 'Unindent 2 spaces', keys: ['Shift', 'Tab'] },
    { label: 'Navigate notes list', keys: ['↑', '↓'] },
    { label: 'Open focused note', keys: ['Enter'] },
    { label: 'Close dialog or clear search', keys: ['Esc'] },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold">
            <Command className="w-4 h-4 text-neutral-500" />
            <h3 id="shortcuts-modal-title" className="text-base">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded transition-colors"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
          {shortcuts.map((sc) => (
            <div key={sc.label} className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">{sc.label}</span>
              <div className="flex items-center gap-1">
                {sc.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
