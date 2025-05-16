import type { FuseResult } from 'fuse.js';
import { Platform, WorkspaceLeaf, type App, type BookmarksPlugin, type WebviewerPlugin } from 'obsidian';
import { get } from 'svelte/store';
import WebSuggestionItem from 'src/ui/components/web-suggestion-item.svelte';
import { WebFuzzySearch } from 'src/core/fuzzy-search';
import { TextInputSuggester } from 'src/core/suggester';
import { DEFAULT_HOTKEY_HINTS } from 'src/data/hotkey-hints';
import { NOSCHEME_URL_RE, URL_SCHEME_RE } from 'src/data/regexps';
import type { SearchBarHandler } from '../searchbar-handler';
import { generateHotkeyHints } from 'src/utils/component-utils';
import type HomeTabPlugim from 'src/main';
import type { HomeTabEmbed, HomeTabView } from '../view';
import { DEFAULT_FUSE_OPTIONS, type LinkSearchFile, type LinkType } from 'src/model/search-file';

/**
 * @returns Return `true` if it's started with scheme component
 * (e.g. `https://`), or `'noscheme'` when isn't.
 * 
 * @remarks Wasn't intended to _validate_ URL syntax.
 */
function _recognizeAsURL(str: string): boolean | 'noscheme' {
	if (!/\s/.test(str)) {
		if (URL_SCHEME_RE.test(str)) return true;
		if (NOSCHEME_URL_RE.test(str)) return 'noscheme';
	}
	return false;
}

export class WebSuggester extends TextInputSuggester<FuseResult<LinkSearchFile>> {
	private _fuzzySearch: WebFuzzySearch;
	
	public readonly plugin: HomeTabPlugim;
	public readonly webviewerPlugin: WebviewerPlugin;
	public readonly bookmarksPlugin: BookmarksPlugin;

	public view: HomeTabView | HomeTabEmbed;
	public searchBarHandler: SearchBarHandler;

	constructor(app: App, plugin: HomeTabPlugim, view: HomeTabView | HomeTabEmbed, searchBar: SearchBarHandler) {
		super(
			app, get(searchBar.searchBarEl), get(searchBar.suggestionContainerEl),
			{
				containerClass: `home-tab-suggestion-container ${Platform.isPhone ? 'is-phone' : ''}`,
				additionalClasses: `${plugin.settings.selectionHighlight === 'accentColor' ? 'use-accent-color' : ''}`,
				additionalModalInfo: plugin.settings.showShortcuts
					? generateHotkeyHints(DEFAULT_HOTKEY_HINTS, 'home-tab-hotkey-suggestions')
					: undefined
			},
			plugin.settings.searchDelay
		)

		this.plugin = plugin;
		this.view = view;
		this.searchBarHandler = searchBar;
		this.webviewerPlugin = this.app.internalPlugins.getPluginById('webviewer');
		this.bookmarksPlugin = this.app.internalPlugins.getPluginById('bookmarks');
	}

	protected onOpen(): void {
		let active = !!this.source.getSuggestions().length;
		this._toggleSearchBarContainerState(active);
	}

	protected onClose(): void {
		this._toggleSearchBarContainerState(false);
	}
	
	public async getSuggestions(input: string): Promise<FuseResult<LinkSearchFile>[]> {
		if (!input) return [];

		if (!this._fuzzySearch)
			this._fuzzySearch = new WebFuzzySearch(
				await this._getUrlList(),
				Object.assign({}, DEFAULT_FUSE_OPTIONS, { keys: ['title', 'url'] })
			);

		let results: FuseResult<LinkSearchFile>[] = [{
			refIndex: 0,
			score: 0,
			item: {
				url: this.webviewerPlugin.instance.getSearchEngineUrl(input),
				title: input,
				type: 'search'
			}
		}];
		
		let	recognizedAsURL = _recognizeAsURL(input),
			noScheme = recognizedAsURL === 'noscheme',
			urlWithScheme = noScheme ? 'https://' + input : input;
		
		if (recognizedAsURL) results.unshift({
			refIndex: 0,
			score: 0,
			item: {
				url: encodeURI(urlWithScheme),
				title: input,
				type: 'goto'
			}
		});

		return results.concat(
			this._fuzzySearch.rawSearch(input, this.plugin.settings.maxResults)
		);
	}

	public async useSelectedItem(selectedItem: FuseResult<LinkSearchFile>, newTab?: boolean): Promise<void> {
		let leaf = this.app.workspace.getLeaf(newTab && 'tab'),
			{ url, title } = selectedItem.item;

		if (!url && title)
			url = this.webviewerPlugin.instance.getSearchEngineUrl(title);
		
		if (leaf && url)
			await this._patchLeaf(leaf, url);
	}

	public getComponentProps(suggestion: FuseResult<LinkSearchFile>): {
		displayName: string,
		url: string,
		type: LinkType;
	} {
		let url = suggestion.item.url,
			displayName = suggestion.item.title,
			type = suggestion.item.type;

		return { displayName, url, type };
	}

	public getComponentType(): typeof WebSuggestionItem {
		return WebSuggestionItem;
	}

	protected registerScope(): void {
		super.registerScope();

		// Open url in new tab
		this.scope.register(['Mod'], 'Enter', evt => {
			evt.preventDefault();
			this.useSelectedItem(this.source.getSelected(), true);
		});
	}

	private _toggleSearchBarContainerState(isActive: boolean): void {
		this.inputEl.parentElement?.toggleClass('is-active', isActive)
	}

	private async _patchLeaf(leaf: WorkspaceLeaf, url: string): Promise<void> {
		await leaf.setViewState({
			type: 'webviewer',
			active: true,
			state: { url }
		});
	}

	private async _getUrlList(): Promise<LinkSearchFile[]> {
		return (await this._getBookmarks()).concat(
			await this._getHistory()
		);
	}

	private async _getHistory(): Promise<LinkSearchFile[]> {
		return (await this.webviewerPlugin.instance.db.getHistoryItems())
			.map(({ title, url }) => ({ title, url, type: 'history' }));
	}

	private async _getBookmarks(): Promise<LinkSearchFile[]>{
		let items: LinkSearchFile[] = [],
			{ urlBookmarkLookup } = this.bookmarksPlugin.instance;

		for (let key in urlBookmarkLookup) {
			let { title = '', url = '' } = urlBookmarkLookup[key];
			items.push({ title, url, type: 'bookmark' });
		}

		return items;
	}
}