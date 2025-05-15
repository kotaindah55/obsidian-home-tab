import type { Plugin } from "obsidian";

export interface OmnisearchApi {
	/** Refreshes the index */
	refreshIndex: () => Promise<void>;
	/** Register a callback that will be called when the indexing is done */
	registerOnIndexed: (callback: () => void) => void;
	/** Returns a promise that will contain the same results as the Vault modal. */
	search: (query: string) => Promise<ResultNoteApi[]>;
	/** Unregister a callback that was previously registered */
	unregisterOnIndexed: (callback: () => void) => void;
}

export interface OmnisearchPlugin extends Plugin {
	api: OmnisearchApi;
}

export interface ResultNoteApi {
	basename: string;
	excerpt: string;
	foundWords: string[];
	matches: SearchMatchApi[];
	path: string;
	score: number;
}

export interface SearchMatchApi {
	match: string;
	offset: number;
}

declare module "obsidian" {
	interface PluginManager {
		getPlugin(id: "omnisearch"): OmnisearchPlugin | null;
	}
}