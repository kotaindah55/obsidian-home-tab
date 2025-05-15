import type { BookmarkedFileStoreItem } from "src/file-manager/bookmarked-files";
import type { RecentFileStoreItem } from "src/file-manager/recent-files";

interface ObjectKeys {
	[key: string]: unknown;
}

interface LogoStoreItem {
	imageLink: string;
	imagePath: string;
	lucideIcon: string;
	default?: string;
	oldLogo?: string;
	none?: string;
}

export type ColorChoices = 'default' | 'accentColor' | 'custom';
export type LogoChoices = 'default' | 'imagePath' | 'imageLink' | 'lucideIcon' | 'oldLogo' | 'none';
export type FontChoices = 'interfaceFont' | 'textFont' | 'monospaceFont' | 'custom';
export type FileShelfChoices = 'bookmarks' | 'recents' | null;

export interface HomeTabSettings extends ObjectKeys {
	autoJumpToHeading: boolean;
	bookmarkedFileStore: BookmarkedFileStoreItem[];
	closePreviousSessionTabs: boolean;
	customFont: FontChoices;
	font: string;
	fontColor: string;
	fontColorType: ColorChoices;
	fontSize: string;
	fontWeight: number;
	iconColor: string;
	iconColorType: ColorChoices;
	jumpToFirstMatch: boolean;
	lastFileShelf: FileShelfChoices;
	logo: LogoStoreItem;
	logoScale: number;
	logoType: LogoChoices;
	markdownOnly: boolean;
	maxRecentFiles: number;
	maxResults: number;
	newTabOnStart: boolean;
	omnisearch: boolean;
	recentFilesStore: RecentFileStoreItem[];
	replaceNewTabs: boolean;
	searchDelay: number;
	searchHeadings: boolean;
	searchTitle: boolean;
	selectionHighlight: Exclude<ColorChoices, 'custom'>;
	showBookmarkedFiles: boolean;
	showOmnisearchExcerpt: boolean;
	showPath: boolean;
	showRecentFiles: boolean;
	showShortcuts: boolean;
	storeRecentFile: boolean;
	unresolvedLinks: boolean;
	useIconic: boolean;
	wordmark: string;
}

export const DEFAULT_SETTINGS: HomeTabSettings = {
	autoJumpToHeading: true,
	logoType: 'default',
	get logo() {
		return {
			lucideIcon: '', 
			imagePath: '', 
			imageLink: '',
			default: undefined,
			oldLogo: undefined,
			none: undefined
		};
	},
	logoScale: 1.2,
	iconColorType: 'default',
	iconColor: '',
	wordmark: 'Obsidian',
	customFont: 'interfaceFont',
	font: '',
	fontSize: '4em',
	fontColorType: 'default', 
	fontWeight: 600,
	fontColor: '',
	maxResults: 12,
	showBookmarkedFiles: true,
	showRecentFiles: true,
	maxRecentFiles: 8,
	storeRecentFile: true,
	showPath: true,
	selectionHighlight: 'default',
	showShortcuts: true,
	markdownOnly: false,
	unresolvedLinks: false,
	searchTitle: false,
	searchHeadings: true,
	recentFilesStore: [],
	bookmarkedFileStore: [],
	searchDelay: 0,
	replaceNewTabs: true,
	newTabOnStart: false,
	closePreviousSessionTabs: false,
	omnisearch: false,
	showOmnisearchExcerpt: true,
	useIconic: true,
	jumpToFirstMatch: true,
	lastFileShelf: null
};