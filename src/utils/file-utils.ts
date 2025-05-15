import type { App, TFile } from "obsidian";
import { getLinkpath, normalizePath } from "obsidian";
import { FileType, FileTypeLookupTable } from "src/data/file-type";
import { BASENAME_RE, FILE_EXT_RE, PARENT_PATH_RE } from "src/data/regexps";

export function getFileType(file: TFile): FileType {
	let ext = file.extension.toLowerCase();
	return FileTypeLookupTable[ext] ?? FileType.UNKNOWN;
}

export function getImageFiles(app: App): TFile[] {
	let fileList: TFile[] = [];
	app.vault.getFiles().forEach(file => {
		if (getFileType(file) === FileType.IMAGE)
			fileList.push(file);
	});
	return fileList;
}

export function getFileTitle(app: App, file: TFile): string | undefined {
	let frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
	return frontmatter?.title;
}

export function getFileHeadings(app: App, file: TFile): string[] | undefined {
	let headings = app.metadataCache.getFileCache(file)?.headings;
	return headings?.map(h => h.heading);
}

export function getFileAliases(app: App, file: TFile): string[] {
	let aliases: string[] = [],
		rawAliases = app.metadataCache.getFileCache(file)?.frontmatter?.aliases;

	if (rawAliases instanceof Array)
		aliases.push(...rawAliases);

	else if (typeof rawAliases === 'string') {
		rawAliases
			.replace('[', '')
			.replace(']', '')
			.split(',')
			.forEach((alias: string) => {
				if (alias.length > 0) aliases.push(alias.trim());
			});
	}

	return aliases;
}

export function getParentFolderFromPath(filepath: string): string {
    let regexResult = filepath.match(PARENT_PATH_RE);
    return regexResult ? regexResult[1] : '/';
}

export function getUnresolvedLinkPath(app: App, cachedFilename: string, newFilePath?: boolean): string {
    let normalizedFilename = getLinkpath(cachedFilename);
    if (newFilePath && !normalizedFilename.includes('/')) {
        return normalizePath(`${app.fileManager.getNewFileParent('').path}/${normalizedFilename}`)
    }
    return normalizePath(normalizedFilename);
}

export function getUnresolvedLinkBasename(cachedFilename: string): string {
    let normalizedPath = getLinkpath(cachedFilename);
    
    if (normalizedPath.includes('/')) {
        let regexResult = normalizedPath.match(BASENAME_RE);
        return regexResult ? regexResult[1] : normalizedPath;
    }
    return normalizedPath
}

export function getExtensionFromFilename(filename: string): string | undefined {
    // const extension = filename.match(/(?<=\.)[^.]+$/g) on iOS lookbehind groups don't work
    let extension = filename.match(FILE_EXT_RE);
    if (extension) {
        // Remove the dot selected by the regex and return the string as extension
        return extension[0].substring(1);
    }
    return undefined;
}

export function getSupportedFileExts(): readonly string[] {
	let exts: string[] = [];
	for (let ext in FileTypeLookupTable) exts.push(ext);
	return exts;
}

export function isValidExtension(ext: string): boolean {
	return Object.hasOwn(FileTypeLookupTable, ext);
}

export function pickParentPath(fullPath: string): string | undefined {
	if (!fullPath || fullPath === '/') return;

	let lastCharPos = fullPath.length - 1,
		nameStartPos = fullPath.lastIndexOf('/', lastCharPos);
	
	if (nameStartPos < 0) return '/';
	return fullPath.slice(0, nameStartPos);
}

export function pickFileName(fullPath: string): string | undefined {
	if (!fullPath || fullPath === '/') return;

	let lastCharPos = fullPath.length - 1,
		nameStartPos = fullPath.lastIndexOf('/', lastCharPos);

	if (nameStartPos < 0) return '/';

	let name = fullPath.slice(nameStartPos);
	if (name.endsWith('/')) name = name.slice(0, -1);
	return name;
}