import type { IFuseOptions } from "fuse.js";
import type { TFile } from "obsidian";
import type { FileType } from "src/data/file-type";

export type LinkType = 'bookmark' | 'history' | 'search' | 'goto';

export interface MarkdownSearchFile {
	name: string;
	basename: string;
	path: string;
	aliases?: string[];
	isCreated: boolean;
	file?: TFile;
}

export interface SearchFile {
	name: string;
	basename: string;
	path: string;
	aliases?: string[];
	title?: string;
	headings?: string[];
	isCreated: boolean;
	isUnresolved?: boolean;
	file?: TFile;
	extension?: string;
	fileType?: FileType;
	isWebUrl?: boolean;
	url?: string;
}

export interface IconSearchFile {
	name: string;
	tags: string[];
}

export interface LinkSearchFile {
	title: string;
	url: string;
	type: LinkType;
}

export const DEFAULT_FUSE_OPTIONS: IFuseOptions<unknown> = {
	includeScore : true,
	includeMatches : true,
	findAllMatches : true,
	fieldNormWeight : 1.35,
	threshold : 0.2,
	distance: 125,
	useExtendedSearch : true
}