import { TFile, Vault, type App } from 'obsidian';
import { FileType } from 'src/data/file-type';
import type { MarkdownSearchFile, SearchFile } from 'src/model/search-file';
import {
	getExtensionFromFilename,
	getFileAliases,
	getFileHeadings,
	getFileTitle,
	getFileType,
	getUnresolvedLinkBasename,
	getUnresolvedLinkPath
} from 'src/utils/file-utils';

export function generateSearchFile(app: App, file: TFile, extended = true): SearchFile {
	return {
		name: file.name,
		basename: file.basename,
		path: file.path,
		aliases: extended ? getFileAliases(app, file) : undefined,
		title: extended ? getFileTitle(app, file) : undefined,
		headings: extended ? getFileHeadings(app, file) : undefined,
		isCreated: true,
		file: file,
		fileType: getFileType(file),
		extension: file.extension
	};
}

export function generateMarkdownSearchFile(app: App, file: TFile): MarkdownSearchFile {
	return {
		name: file.name,
		basename: file.basename,
		path: file.path,
		aliases: getFileAliases(app, file),
		isCreated: true,
		file: file,
	};
}

export function generateMarkdownUnresolvedFile(app: App, cachedFilename: string): SearchFile {
	let filename = getExtensionFromFilename(cachedFilename)
		? cachedFilename.replace('.md', '')
		: cachedFilename;

	return {
		name: `${getUnresolvedLinkBasename(filename)}.md`,
		basename: getUnresolvedLinkBasename(filename),
		path: getUnresolvedLinkPath(app, `${filename}.md`, true),
		isCreated: false,
		isUnresolved: true,
		fileType: FileType.MARKDOWN,
		extension: 'md'
	};
}

export function getSearchFiles(app: App, unresolvedLinks?: boolean): SearchFile[] {
	let files = app.vault.getFiles(),
		fileList: SearchFile[] = [];

	files.forEach(file => {
		fileList.push(generateSearchFile(app, file));
	});

	if (unresolvedLinks) fileList.push(...getUnresolvedMarkdownFiles(app));

	return fileList;
}

export function getMarkdownSearchFiles(app: App): MarkdownSearchFile[] {
	let files = app.vault.getMarkdownFiles(),
		fileList: MarkdownSearchFile[] = [];
	
	files.forEach(file => {
		fileList.push(generateMarkdownSearchFile(app, file));
	});

	return fileList;
}

export function getUnresolvedMarkdownFiles(app: App): SearchFile[] {
	let fileList: SearchFile[] = [],
		unresolvedLinkParents = app.metadataCache.unresolvedLinks,
		unresolvedFilenames: string[] = [];

	Object.entries(unresolvedLinkParents).forEach(([_, links]) => {
		Object.keys(links).forEach(filename => {
			// md notes does not have any extension, even if the link is [[somefile.md]]
			if (!getExtensionFromFilename(filename) && !unresolvedFilenames.includes(filename)) {
				unresolvedFilenames.push(filename);
			}
		});
	});

	unresolvedFilenames.forEach(filename => fileList.push(generateMarkdownUnresolvedFile(app, filename)));
	return fileList;
}

export function getSearchFilesByType(app: App, type: FileType): SearchFile[] {
	let root = app.vault.getRoot(),
		searchFiles: SearchFile[] = [];

	Vault.recurseChildren(root, file => {
		if (file instanceof TFile && getFileType(file) === type)
			searchFiles.push(generateSearchFile(app, file, false));
	});

	return searchFiles;
}