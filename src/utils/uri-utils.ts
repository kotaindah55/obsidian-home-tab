import type { App } from "obsidian";

export function getFilePathFromObsidianURI(app: App, uri: string): string | null {
	let urlObject: URL | undefined;

	try { urlObject = new URL(uri) }
	catch { return null }

	let { protocol } = urlObject,
		vaultName = urlObject.searchParams.get('vault'),
		fileName = urlObject.searchParams.get('file');

	if (
		protocol === 'obsidian:' &&
		vaultName === app.vault.getName()
	) return fileName;

	return null;
}