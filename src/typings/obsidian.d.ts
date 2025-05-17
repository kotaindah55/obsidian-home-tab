import {} from 'obsidian';
import { EditorView } from '@codemirror/view';

// Most of the types were sourced from obsidian-typings by Fevol, being
// licensed with MIT License.
//
// See https://github.com/Fevol/obsidian-typings.

declare module 'obsidian' {
	interface App {
		dom: AppDOM;
		dragManager: DragManager;
		plugins: PluginManager;
		internalPlugins: InternalPluginManager;
		getObsidianUrl(file: TFile): string;
	}

	interface AppDOM {
		appContainerEl: HTMLElement;
	}

	interface AppVaultConfig {
		nativeMenus?: boolean | null;
	}

	interface BookmarkItem<T extends BookmarkItemType = BookmarkItemType> {
		type: T;
		title?: string | undefined;
		path?: string | undefined;
		url?: string | undefined;
	}

	type BookmarkItemType =
		| 'file'
		| 'folder'
		| 'group'
		| 'graph'
		| 'search'
		| 'url';

	interface BookmarkLookup<T extends BookmarkItemType = BookmarkItemType> {
		[path: string]: BookmarkItem<T>;
	}

	type BookmarksPlugin = InternalPlugin<BookmarksPluginInstance>;

	interface BookmarksPluginInstance extends InternalPluginInstance, Events {
		bookmarkLookup: BookmarkLookup<'file' | 'folder'>;
		items: BookmarkItem[];
		getBookmarks(): BookmarkItem[];
		removeItem(item: BookmarkItem): void;
		urlBookmarkLookup: BookmarkLookup<'url'>;
	}

	interface ColorComponent {
		colorPickerEl: HTMLInputElement;
	}

	interface Draggable {
		file?: TAbstractFile;
		files?: TAbstractFile[];
		icon: string;
		linktext?: string;
		source?: unknown;
		sourcePath?: string;
		title: string;
		type: DraggableType;
	}

	type DraggableType =
		| 'file'
		| 'files'
		| 'folder'
		| 'link';

	interface DragManager {
		handleDrag(el: HTMLElement, draggableGetter: (event: DragEvent) => Draggable | null): void;
	}

	interface Editor {
		cm: EditorView;
	}

	interface EmptyView extends ItemView {
		getViewType(): 'empty';
	}

	interface FrontMatterCache {
		aliases?: string[] | string;
		title?: string;
	}

	interface InternalPlugin<T extends InternalPluginInstance> extends Component {
		instance: T;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface InternalPluginInstance {}
	
	interface InternalPluginInstanceMap {
		'bookmarks': BookmarksPluginInstance;
		'webviewer': WebviewerPluginInstance;
	}

	interface InternalPluginManager extends Events {
		plugins: {
			[ID in keyof InternalPluginInstanceMap]: InternalPlugin<InternalPluginInstanceMap[ID]>;
		};
		getPluginById<T extends IntenalPluginIDs>(id: T): InternalPlugin<InternalPluginInstanceMap[T]>;
		getEnabledPluginById<T extends IntenalPluginIDs>(id: T): InternalPluginInstanceMap[T] | null;
	}

	type IntenalPluginIDs = keyof InternalPluginInstanceMap;

	interface MarkdownPreviewRenderer {
		sections: MarkdownPreviewSection[];
		applyScroll(line: number, option?: { highlight?: boolean, center?: boolean }): boolean;
		onRendered(callback: () => unknown): void;
	}

	interface MarkdownPreviewSection {
		lineEnd: number;
		lineStart: number;
	}

	interface MarkdownPreviewView {
		renderer: MarkdownPreviewRenderer;
	}

	interface MenuItem {
		setWarning(on: boolean): this;
	}

	interface MetadataCache {
		onCleanCache(callback: () => void): void;
	}
	
	interface PluginManager {
		enabledPlugins: Set<string>;
		requestSaveConfig: Debouncer<[], void>;
		disablePluginAndSave(id: string): Promise<void>;
		enablePluginAndSave(id: string): Promise<boolean>;
		getPlugin(id: string): Plugin | null;
	}

	interface TAbstractFile {
		deleted: boolean;
	}

	interface TFile {
		getShortName(): string;
	}

	interface Vault {
		config: AppVaultConfig;
	}

	interface View {
		close(): Promise<void>;
	}

	interface WebviewerDBStore {
		db: IDBDatabase;
		getHistoryItems(): Promise<WebviewerHistoryItem[]>;
	}

	interface WebviewerHistoryItem {
		accessTs: number;
		id: number;
		title: string;
		url: string;
	}

	type WebviewerPlugin = InternalPlugin<WebviewerPluginInstance>;

	interface WebviewerPluginInstance extends InternalPluginInstance {
		db: WebviewerDBStore;
		getSearchEngineUrl(query: string): string;
	}

	interface Workspace {
		createLeafInTabGroup(tabs?: WorkspaceTabs): WorkspaceLeaf;
	}

	interface WorkspaceLeaf {
		app: App;
		rebuildView(): Promise<void>;
		_empty: EmptyView;
		_originView: View;
	}
}