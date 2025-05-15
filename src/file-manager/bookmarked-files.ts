import {
	type App,
	type BookmarksPlugin,
	Component,
	normalizePath,
	TAbstractFile,
	TFile
} from 'obsidian';
import { get, type Writable } from 'svelte/store';
import type HomeTabPlugin from 'src/main';

export interface BookmarkedFileStoreItem {
	filepath: string;
	iconId?: string;
}

export interface BookmarkedFile {
	file: TFile;
	iconId?: string;
}

export class BookmarkedFileManager extends Component {
	public readonly app: App;
	public readonly plugin: HomeTabPlugin;
	public readonly bookmarksPlugin: BookmarksPlugin;

	private readonly _store: Writable<BookmarkedFile[]>;

	constructor(plugin: HomeTabPlugin, bookmarkedFileStore: Writable<BookmarkedFile[]>) {
		super();
		this.app = plugin.app;
		this.plugin = plugin;
		this.bookmarksPlugin = this.app.internalPlugins.getPluginById('bookmarks');
		this._store = bookmarkedFileStore;
	}

	public removeBookmark = (file: TFile): void => {
		let item = this.bookmarksPlugin.instance.getBookmarks().find(item => item.path === file.path);
		if (item) this.bookmarksPlugin.instance.removeItem(item);
	}

	public onload(): void {
		// Load stored bookmarked files, then check if they've changed
		this._loadStoredBookmarkedFiles();
		this._updateBookmarkedFiles();
		// Update stored bookmarked files list when a file is bookmarked or unbookmarked
		this.registerEvent(this.bookmarksPlugin.instance.on('changed', () => this._updateBookmarkedFiles()));
	}

	private _updateBookmarkedFiles(): void {
		let bookmarkedFiles = this._getBookmarkedFiles();
		
		this._store.update(files => {
			files.splice(0);

			bookmarkedFiles.forEach(file => {
				files.push({ file });
			});
			
			return files;
		})

		this._storeBookmarkedFiles();
	}

	private _getBookmarkedFiles(): TFile[] {
		let bookmarkedItems = this.bookmarksPlugin.instance.getBookmarks(),
			bookmarkedFiles: TFile[] = [];

		bookmarkedItems.forEach(item => {
			if (item.type === 'file' && item.path) {
				let path = normalizePath(item.path),
					file = this.app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile)
					bookmarkedFiles.push(file);
			}
		});

		return bookmarkedFiles;
	}

	private async _storeBookmarkedFiles(): Promise<void> {
		let storedItems: BookmarkedFileStoreItem[] = [];
		get(this._store).forEach(item => storedItems.push({
			// Store only the path instead of the entire TFile instance
			filepath: item.file.path
		}));

		this.plugin.settings.bookmarkedFileStore = storedItems;
		await this.plugin.saveData(this.plugin.settings);
	}

	private _loadStoredBookmarkedFiles(): void {
		let filesToLoad: BookmarkedFile[] = [];

		this.app.workspace.onLayoutReady(() => {
			this.plugin.settings.bookmarkedFileStore.forEach((item: BookmarkedFileStoreItem) => {
				let file: TAbstractFile | null = this.app.vault.getAbstractFileByPath(item.filepath)
				if (file instanceof TFile) filesToLoad.push({ file });
			});
			this._store.set(filesToLoad);
		});
	}
}