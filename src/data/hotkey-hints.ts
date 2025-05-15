export const DEFAULT_HOTKEY_HINTS = [
	{ hotkey: '↑↓', action: 'to navigate' },
	{ hotkey: '↵', action: 'to open' },
	{ hotkey: 'ctrl ↵', action: 'to open in new tab' },
	{ hotkey: 'esc', action: 'to dismiss' }
];

export const FILE_HOTKEY_HINTS = DEFAULT_HOTKEY_HINTS.toSpliced(3, 0,
	{ hotkey: 'shift ↵', action: 'to create' }
);