import { CSS_UNIT_RE } from "src/data/regexps";

const BASE_COLOR_NAMES = [
	'red',
	'orange',
	'yellow',
	'green',
	'cyan',
	'blue',
	'purple',
	'pink',
	'gray'
];

export function validateCSSUnit(inputString: string): boolean {
	return CSS_UNIT_RE.test(inputString);
}

export function checkFont(font: string, size?: number): boolean {
	if (font.trim().length == 0) return false;
	return document.fonts.check(`${size ?? 18}px ${font}`);
}

export function getBaseColorVariable(color: string): string | undefined {
	if (!BASE_COLOR_NAMES.includes(color)) return;
	if (color === 'gray') return 'var(--text-muted)';
	return `var(--color-${color})`;
}