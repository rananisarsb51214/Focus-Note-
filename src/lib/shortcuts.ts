/**
 * Helper utilities for keyboard shortcuts and cross-platform modifier keys.
 */

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

export function getShortcutLabel(key: string, withModifier = true): string {
  const mod = getModifierKey();
  return withModifier ? `${mod}+${key.toUpperCase()}` : key.toUpperCase();
}

export function isShortcutPressed(
  e: KeyboardEvent | React.KeyboardEvent,
  key: string,
  options: { ctrlOrCmd?: boolean; shift?: boolean; alt?: boolean } = { ctrlOrCmd: true }
): boolean {
  const targetKey = e.key.toLowerCase();
  const requestedKey = key.toLowerCase();

  if (targetKey !== requestedKey) return false;

  if (options.ctrlOrCmd) {
    const hasMod = isMac() ? e.metaKey : e.ctrlKey;
    if (!hasMod) return false;
  }

  if (options.shift !== undefined && e.shiftKey !== options.shift) {
    return false;
  }

  if (options.alt !== undefined && e.altKey !== options.alt) {
    return false;
  }

  return true;
}
