import { App, ItemView, MarkdownRenderChild, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { SearchBarHandler } from 'src/ui/searchbar-handler';
import Homepage from 'src/ui/homepage.svelte';
import type HomeTabPlugin from 'src/main';

export const HOMETAB_VIEW_TYPE = 'home-tab-view' as const;

export class HomeTabEmbed extends MarkdownRenderChild {
	public readonly app: App;
	public readonly plugin: HomeTabPlugin;

	public homepage: Homepage;
	public searchBarHandler: SearchBarHandler;
	public recentFiles: boolean | undefined;
	public bookmarkedFiles: boolean | undefined;
	public searchbarOnly: boolean | undefined;

	constructor(containerEl: HTMLElement, plugin: HomeTabPlugin, codeBlockContent: string) {
		super(containerEl);
		this.app = plugin.app;
		this.plugin = plugin;
		this.searchBarHandler = new SearchBarHandler(plugin, this);

		this._parseCodeBlockContent(codeBlockContent);
	}

	public onload(): void {
		super.onload();
		this.homepage = mount(Homepage, {
			target: this.containerEl,
			props: {
				app: this.plugin.app,
				plugin: this.plugin,
				view: this,
				searchBarHandler: this.searchBarHandler
			}
		});

		devel: console.log('Hometab embed opened');
		devel: HomeTabEmbed.counts++;
	}

	public onunload(): void {
		this.plugin.activeHomeTabEmbeds.splice(
			this.plugin.activeHomeTabEmbeds.findIndex(item => item == this), 1
		);
		this.searchBarHandler.unload();
		unmount(this.homepage);
		super.onunload();

		devel: console.log('Hometab embed closed');
		devel: HomeTabEmbed.counts--;
	}

	private _parseCodeBlockContent(content: string): void {
		content.split('\n')
			.map(line => line.trim())
			.forEach(line => {
				switch (true) {
					case line === '':
						break;
					case line === 'only search bar':
						this.searchbarOnly = true;
						break;
					case line === 'show recent files':
						this.recentFiles = true;
						break;
					case line === 'show bookmarked files':
						this.bookmarkedFiles = true;
						break;
				}
			});
	}

	/**
	 * If `counts` is greater than the amount of available embeds, it leads
	 * to memory leaks.
	 * 
	 * @devel
	 */
	static counts = 0;
}

export class HomeTabView extends ItemView {
	public readonly plugin: HomeTabPlugin;

	public homepage: Homepage;
	public searchBarHandler: SearchBarHandler;
	public containerEl: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: HomeTabPlugin) {
		super(leaf);
		this.leaf = leaf;
		this.plugin = plugin;
		this.navigation = true;
		this.icon = 'search';

		this.searchBarHandler = new SearchBarHandler(this.plugin, this);
	}

	public getViewType() {
		return HOMETAB_VIEW_TYPE;
	}
	
	public getDisplayText(): string {
		return 'Home tab';
	}

	public async onOpen(): Promise<void> {
		super.onOpen();
		this.homepage = mount(Homepage, {
			target: this.contentEl,
			props: {
				app: this.plugin.app,
				plugin: this.plugin,
				view: this,
				searchBarHandler: this.searchBarHandler
			}
		});

		devel: console.log('Hometab opened');
		devel: HomeTabView.counts++;
	}

	public async onClose(): Promise<void> {
		this.searchBarHandler.unload();
		unmount(this.homepage);
		super.onClose();

		devel: console.log('Hometab closed');
		devel: HomeTabView.counts--;
	}

	public async rebuild(): Promise<void> {
		this.searchBarHandler.unload();
		unmount(this.homepage);
		this.contentEl.empty();

		this.searchBarHandler = new SearchBarHandler(this.plugin, this);
		this.homepage = mount(Homepage, {
			target: this.contentEl,
			props: {
				app: this.plugin.app,
				plugin: this.plugin,
				view: this,
				searchBarHandler: this.searchBarHandler
			}
		});

		devel: console.log('Hometab rebuilt');
	}

	/**
	 * If `counts` is greater than the amount of available view instances,
	 * it leads to memory leaks.
	 * 
	 * @devel
	 */
	static counts = 0;
}