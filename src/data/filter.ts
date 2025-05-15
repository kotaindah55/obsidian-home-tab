import { SUPPORTED_FILE_TYPES } from "src/data/file-type";
import { getSupportedFileExts } from "src/utils/file-utils";

export enum FilterType {
	FILE_EXT = 'file-ext',
	FILE_TYPE = 'file-type',
	WEB = 'web',
	OMNISEARCH = 'omnisearch',
	DEFAULT = 'default'
}

export const FilterKeysLookupTable: Record<FilterType, readonly string[]> = {
	[FilterType.DEFAULT]: ['default'],
	[FilterType.OMNISEARCH]: ['omnisearch', 'omni'],
	[FilterType.WEB]: ['web', 'internet', 'webviewer'],
	[FilterType.FILE_TYPE]: SUPPORTED_FILE_TYPES,
	[FilterType.FILE_EXT]: getSupportedFileExts(),
}