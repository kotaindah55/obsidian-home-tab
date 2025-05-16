import { App, debounce, Platform, Plugin, type PluginManifest } from 'obsidian';
import { DEFAULT_SETTINGS, type HomeTabSettings } from 'src/settings/settings-config';
import { RecentFileManager } from 'src/file-manager/recent-files';
import { BookmarkedFileManager } from 'src/file-manager/bookmarked-files';
import { HOMETAB_VIEW_TYPE, HomeTabEmbed, HomeTabView } from 'src/ui/view';
import { HomeTabSettingTab } from 'src/settings/setting-tab';
import { bookmarkedFileStore, settingsStore } from 'src/store';
import type { uninstaller } from 'monkey-around';
import { proxifySettings } from 'src/proxy';
import { patchIconic } from 'src/patch/iconic-patch';
import { proxifyViewFieldOnWorkspaceLeaf } from 'src/patch/workspace-leaf-patch';

export default class HomeTabPlugin extends Plugin {
	public settings: HomeTabSettings;
	public activeHomeTabEmbeds: HomeTabEmbed[];
	public recentFileManager: RecentFileManager;
	public bookmarkedFileManager: BookmarkedFileManager;
	public refreshQueued: boolean = false;

	private _patchContracts: uninstaller[] = [];

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
	}
	
	public async onload() {
		console.log('Loading Home Tab (mod) plugin');
		
		await this.loadSettings();

		this.addSettingTab(new HomeTabSettingTab(this.app, this));
		this.registerView(HOMETAB_VIEW_TYPE, leaf => new HomeTabView(leaf, this));		

		// Refocus search bar on leaf change
		this.registerEvent(this.app.workspace.on('active-leaf-change', leaf => {
			if (leaf?.view instanceof HomeTabView && !Platform.isMobile)
				leaf.view.searchBarHandler.setFocus();
		}));

		this.activeHomeTabEmbeds = [];

		this.recentFileManager = new RecentFileManager(this.app, this);
		this.bookmarkedFileManager = new BookmarkedFileManager(this, bookmarkedFileStore);

		this.addCommand({
			id: 'open-new-home-tab',
			name: 'Open new Home tab',
			callback: () => this.activateView(false, true)
		});

		this.addCommand({
			id: 'open-home-tab',
			name: 'Replace current tab',
			callback: () => this.activateView(true)
		});

		// Wait for all plugins to load before check if the bookmarked plugin is enabled
		this.app.workspace.onLayoutReady(() => {
			this.recentFileManager.load();
			this.bookmarkedFileManager.load();

			this.registerMarkdownCodeBlockProcessor('search-bar', (source, el, ctx) => {
				let embeddedHomeTab = new HomeTabEmbed(el, this, source);
				this.activeHomeTabEmbeds.push(embeddedHomeTab);
				ctx.addChild(embeddedHomeTab);
			});

			if (this.settings.newTabOnStart) {
				// If an Home tab leaf is already open focus it
				let leaves = this.app.workspace.getLeavesOfType(HOMETAB_VIEW_TYPE);
				if (leaves.length > 0) {
					this.app.workspace.revealLeaf(leaves[0])
					// If more than one home tab leaf is open close them
					leaves.forEach((leaf, index) => {
						if (index < 1) return;
						leaf.detach();
					});
				} else {
					this.activateView(false, true);
				}
				// Close all other open leaves
				if (this.settings.closePreviousSessionTabs) {
					// Get open leaves type
					let leafTypes: string[] = [];
					this.app.workspace.iterateRootLeaves(leaf => {
						let leafType = leaf.view.getViewType();
						if (leafTypes.indexOf(leafType) < 0 && leafType != HOMETAB_VIEW_TYPE)
							leafTypes.push(leafType);
					});
					leafTypes.forEach(type => this.app.workspace.detachLeavesOfType(type));
				}
			}

			this._registerPatch();
		})
	}

	public onunload(): void {
		console.log('Unloading Home Tab (mod) plugin');
		this.app.workspace.detachLeavesOfType(HOMETAB_VIEW_TYPE);
		this.activeHomeTabEmbeds.forEach(embed => embed.unload());
		this.recentFileManager.unload();
		this.bookmarkedFileManager.unload();
		this._uninstallPatch();
	}

	public async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		proxifySettings(this);
		settingsStore.set(this.settings);
	}

	public async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		settingsStore.update(() => this.settings);
	}

	public requestSave = debounce(this.saveSettings, 20, true);

	public activateView(overrideView?: boolean, openNewTab?: boolean): void {
		let leaf = openNewTab
			? this.app.workspace.getLeaf('tab')
			: this.app.workspace.getMostRecentLeaf();
		// const leaf = newTab ? this.app.workspace.getLeaf() : this.app.workspace.getMostRecentLeaf()
		if (leaf && (overrideView || leaf.getViewState().type === 'empty')) {
			leaf.setViewState({ type: HOMETAB_VIEW_TYPE });
			// Focus newly opened tab
			if (openNewTab) this.app.workspace.revealLeaf(leaf);
		}
	}

	public refreshAllViews(): void {
		this.app.workspace
			.getLeavesOfType(HOMETAB_VIEW_TYPE)
			.forEach(leaf => {
				if (leaf.view instanceof HomeTabView)
					leaf.view.rebuild();
			});
	}

	private _registerPatch(): void {
		let iconicPlugin = this.app.plugins.getPlugin('iconic');
		if (iconicPlugin) {
			this._patchContracts.push(patchIconic(iconicPlugin));
		}
				
		// Replace new tabs with home tab view
		this._patchContracts.push(
			proxifyViewFieldOnWorkspaceLeaf(this)
		);
	}

	private _uninstallPatch(): void {
		this._patchContracts.forEach(uninstaller => uninstaller());
	}
}