import type { App, Plugin } from "obsidian";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FileIconManager extends IconManager {}

export interface IconDesc {
	icon: string | null;
	iconDefault: string | null;
	color: string | null;
}

export interface IconManager {
	app: App;
	refreshIcon(desc: IconDesc, iconEl: HTMLElement, onClick?: (evt: MouseEvent) => void): void;
	refreshIcons(unloading?: boolean): void;
}

export interface IconicPlugin extends Plugin {
	fileIconManager: FileIconManager;
	ruleManager: RuleManager;
	getFileItem(filepath: string, unloading?: boolean): IconDesc;
}

export interface RuleManager extends IconManager {
	checkRuling(page: RulePage, filepath: string, unloading?: boolean): IconDesc | null;
}

export type RulePage = 'file' | 'folder';

declare module "obsidian" {
	interface PluginManager {
		getPlugin(id: "iconic"): IconicPlugin | null;
	}

	interface Workspace {
		on(name: 'iconic:icons-refresh', callback: () => unknown, ctx?: unknown): EventRef;
	}
}