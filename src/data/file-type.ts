export enum FileType {
	UNKNOWN = 'unknown',
	MARKDOWN = 'markdown',
	CANVAS = 'canvas',
	IMAGE = 'image',
	AUDIO = 'audio',
	VIDEO = 'video',
	DOCUMENT = 'document',
	GRAPHIC = 'graphic',
	DATABASE = 'database'
}

export const SupportedExtLookupTable: Record<FileType, string[]> = {
	[FileType.MARKDOWN]: ['md'],
	[FileType.CANVAS]: ['canvas'],
	[FileType.IMAGE]: ['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
	[FileType.AUDIO]: ['flac', 'mp3', 'm4a', 'ogg', '3gp', 'wav'],
	[FileType.VIDEO]: ['mkv', 'mov', 'mp4', 'ogv', 'webm'],
	[FileType.DOCUMENT]: ['pdf'],
	[FileType.GRAPHIC]: ['drawing', 'excalidraw', 'tldr'],
	[FileType.DATABASE]: ['loom'],
	[FileType.UNKNOWN]: []
};

export const FileTypeLookupTable: Record<string, FileType> = (() => {
	let lookupTable: Record<string, FileType> = {};
	for (let type in SupportedExtLookupTable) {
		SupportedExtLookupTable[type as FileType].forEach(ext => {
			lookupTable[ext] = type as FileType;
		});
	}
	return lookupTable;
})();

export const SUPPORTED_FILE_TYPES = [
	FileType.MARKDOWN,
	FileType.CANVAS,
	FileType.IMAGE,
	FileType.AUDIO,
	FileType.VIDEO,
	FileType.DOCUMENT,
	FileType.GRAPHIC,
	FileType.DATABASE
] as const;