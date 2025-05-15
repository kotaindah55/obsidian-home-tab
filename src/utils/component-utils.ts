import { App, getIcon, TFile } from 'obsidian';
import { getFileType } from './file-utils';
import { FileType } from 'src/data/file-type';
import { getBaseColorVariable } from './style-utils';
import type { IconDesc } from 'src/typings/iconic';

interface IconOptions {
	ariaLabel?: string;
	class?: string;
	size?: number;
	strokeWidth?: number;
	color?: string;
}

interface HotkeyHintSpec {
	hotkey: string;
	action: string;
}

export function getLucideIcon(iconId: string, options?: IconOptions): SVGSVGElement | null {
	let iconEl = getIcon(iconId);
	if (iconEl) {
		let size = options?.size ?? 24,
			color = getBaseColorVariable(options?.color ?? 'gray') ?? options?.color;
		iconEl.ariaLabel = options?.ariaLabel ?? '';

		if (
			(size != 24 || options?.strokeWidth != 1.75) &&
			iconEl.hasClass('svg-icon')
		) {
			iconEl.removeClass('svg-icon');
		}

		if (options?.class) iconEl.addClass(options.class);
		if (!color) color = 'currentColor';

		iconEl.setAttribute('width', size.toString());
		iconEl.setAttribute('height', size.toString());
		iconEl.setAttribute('stroke', color);
		iconEl.setAttribute('stroke-width', (options?.strokeWidth ?? 1.75).toString());
	
		return iconEl;
	}
	return null;
}

export function getFileIconDesc(
	app: App,
	fileOrPath: TFile | string,
	useIconic = false
): {
	iconId: string | null,
	color: string | null
} | null {
	let file = fileOrPath instanceof TFile
		? fileOrPath
		: app.vault.getFileByPath(fileOrPath);

	if (!file) return null;

	let iconicIconDesc = useIconic
			? getFileIconDescFromIconic(app, file)
			: null,
		iconId =
			iconicIconDesc?.icon ??
			iconicIconDesc?.iconDefault ??
			getDefaultFileIconId(app, file),
		color: string | null = null;
	
	if (iconId && iconicIconDesc?.color) {
		color = iconicIconDesc.color;
	}

	return { iconId, color };
}

export function getFileIcon(
	app: App,
	fileOrPath: TFile | string,
	options?: IconOptions,
	useIconic = false
): SVGSVGElement | null {
	let file = fileOrPath instanceof TFile
		? fileOrPath
		: app.vault.getFileByPath(fileOrPath);

	if (!file) return null;

	let iconicIconDesc = useIconic
			? getFileIconDescFromIconic(app, file)
			: null,
		iconId =
			iconicIconDesc?.icon ??
			iconicIconDesc?.iconDefault ??
			getDefaultFileIconId(app, file);
	
	if (iconId && iconicIconDesc?.color) {
		if (!options) options = {};
		options.color = iconicIconDesc.color;
	}

	if (!iconId) return null;
	
	return getLucideIcon(iconId, options);
}

export function getDefaultFileIconId(
	app: App,
	fileOrPath: TFile | string
): string | null {
	let file = fileOrPath instanceof TFile
		? fileOrPath
		: app.vault.getFileByPath(fileOrPath);

	if (!file) return null;

	let fileType = getFileType(file),
		iconId: string;

	switch (fileType) {
		case FileType.MARKDOWN: iconId = 'file-text'; break;
		case FileType.CANVAS: iconId = 'layout-dashboard'; break;
		case FileType.IMAGE: iconId = 'image'; break;
		case FileType.AUDIO: iconId = 'file-audio'; break;
		case FileType.VIDEO: iconId = 'file-video'; break;
		case FileType.DOCUMENT: iconId = 'file-chart-pie'; break;
		case FileType.GRAPHIC: iconId = 'pencil-ruler'; break;
		case FileType.DATABASE: iconId = 'table'; break;
		default: iconId = 'file';
	}

	return iconId;
}

export function getFileIconDescFromIconic(
	app: App,
	fileOrPath: TFile | string
): IconDesc | undefined {
	let file = fileOrPath instanceof TFile
		? fileOrPath
		: app.vault.getFileByPath(fileOrPath);

	if (!file) return undefined;

	let iconicPlugin = app.plugins.getPlugin("iconic"),
		iconDesc =
			iconicPlugin?.ruleManager.checkRuling('file', file.path) ||
			iconicPlugin?.getFileItem(file.path);

	return iconDesc
}

export function insertLucideIcon(
	parentElement: HTMLElement,
	iconId: string,
	options?: IconOptions
): void | null {
	let icon = getLucideIcon(iconId, options);
	if (icon) parentElement.appendChild(icon);
}

export function generateHotkeyHints(
	hotkeySuggestions: HotkeyHintSpec[],
	containerClass: string
): HTMLElement {
	let hotkeySuggestionElement = createDiv(containerClass);

	hotkeySuggestions.forEach(hotkeySuggestion => {
		let suggestionElement = hotkeySuggestionElement.createDiv('prompt-instruction');
		suggestionElement
			.createEl('span', {text: hotkeySuggestion.hotkey})
			.addClass('prompt-instruction-command');
		suggestionElement
			.createEl('span', {text: hotkeySuggestion.action});
	})

	return hotkeySuggestionElement;
}

export function isGlobalRTL(): boolean {
	return document.body.hasClass('mod-rtl');
}

export function removeTooltip(targetEl: HTMLElement): void {
	targetEl.removeAttribute('aria-label');
}