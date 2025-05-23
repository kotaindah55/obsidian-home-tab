import { Notice, type App } from 'obsidian';
import { writable, type Writable, get } from 'svelte/store';
import { FilterKeysLookupTable, FilterType } from 'src/data/filter';
import { isOmnisearchEnabled, isWebviewerEnabled } from 'src/utils/plugin-utils';
import { DefaultSuggester } from 'src/ui/suggester-handler/default-suggester';
import { OmnisearchSuggester } from 'src/ui/suggester-handler/omnisearch-suggester';
import { WebSuggester } from 'src/ui/suggester-handler/web-suggester';
import type HomeTabPlugin from 'src/main';
import type { HomeTabEmbed, HomeTabView } from './view';

export interface FilterSpec {
	type: FilterType;
	option?: string;
}

/**
 * Get matched filter type with corresponding key. Returns `undefined`
 * when there is no filter matched.
 * 
 * @param key {@link FilterKeysLookupTable}
 */
function _getFilterType(key: string): FilterType | void {
	let lookupTable = FilterKeysLookupTable;
	for (let type in lookupTable)
		if (lookupTable[type as FilterType].includes(key))
			return type as FilterType;
}

/** Handle the searchbar and its suggestion. */
export class SearchBarHandler {
	public readonly app: App;
	public readonly plugin: HomeTabPlugin;
	
	public view: HomeTabView | HomeTabEmbed;
	public activeFilter: FilterSpec;

	/** Element idicating currently active filter type. */
	public activeExtEl: Writable<HTMLElement>;
	public searchBarEl: Writable<HTMLInputElement>;
	public suggestionContainerEl: Writable<HTMLElement>;

	/** May be `undefined` if this handler haven't been loaded yet. */
	public suggester?: DefaultSuggester | OmnisearchSuggester | WebSuggester;
	
	private _onload?: () => unknown;

	constructor(plugin: HomeTabPlugin, view: HomeTabView | HomeTabEmbed, onload?: () => unknown) {
		this.app = view.app
		this.view = view;
		this.plugin = plugin;
		this.searchBarEl = writable();
		this.activeExtEl = writable();
		this.suggestionContainerEl = writable();
		this._onload = onload;
		
		// Default filter.
		this.activeFilter = {
			type: isOmnisearchEnabled(this.app) && plugin.settings.omnisearch
				? FilterType.OMNISEARCH
				: FilterType.DEFAULT,
			option: 'default'
		};
	}

	/** Set cursor on search bar. */
	public setFocus(): void {
		get(this.searchBarEl)?.focus();
	}

	public load(): void {
		if (this.plugin.settings.omnisearch && this.plugin.app.plugins.getPlugin('omnisearch')) {
			this.suggester = new OmnisearchSuggester(this.plugin.app, this.plugin, this.view, this);
		} else {
			this.suggester = new DefaultSuggester(this.plugin.app, this.plugin, this.view, this);
		}

		this._onload?.();
	}

	public unload(): void {
		this.suggester?.close();
	}

	public updateActiveSuggester(filterKey: string) {
		devel: console.log('%cSearchbar handler:%c Updating', 'color: gray;', 'color: auto;');
		let filterType = _getFilterType(filterKey),
			isFileFilter = filterType === FilterType.FILE_EXT || filterType === FilterType.FILE_TYPE,
			filterOption = isFileFilter ? filterKey : undefined;

		// Use default filter when there is no matched filter retrieved by
		// _getFilterType(), or when both are equal.
		if (
			!filterType ||
			this.activeFilter.type === filterType &&
			this.activeFilter.option === filterOption
		) return;
		
		let filterEl = get(this.activeExtEl),
			hideFilterTag = filterType === FilterType.DEFAULT,
			useOmnisearch = this.plugin.settings.omnisearch,
			hasOmnisearch = isOmnisearchEnabled(this.app),
			hasWebviewer = isWebviewerEnabled(this.app),
			choosenSuggester:
				| undefined
				| typeof DefaultSuggester
				| typeof OmnisearchSuggester
				| typeof WebSuggester;

		this.activeFilter.type = filterType;
		this.activeFilter.option = filterKey;
		// Remove previous suggester.
		this.suggester?.destroy();

		filterEl.setText(filterOption || filterType);

		switch (filterType) {
			case FilterType.DEFAULT: {
				choosenSuggester = hasOmnisearch && useOmnisearch
					? OmnisearchSuggester
					: DefaultSuggester;
				break;
			}
			case FilterType.OMNISEARCH: {
				if (hasOmnisearch) choosenSuggester = OmnisearchSuggester;
				else new Notice('Omnisearch plugin is not enabled.');
				break;
			}
			case FilterType.WEB: {
				if (hasWebviewer) choosenSuggester = WebSuggester;
				else new Notice('Webviewer plugin is not enabled.');
				break;
			}
			case FilterType.FILE_EXT:
			case FilterType.FILE_TYPE: {
				choosenSuggester = DefaultSuggester;
				break;
			}
		}

		if (choosenSuggester) {
			filterEl.toggleClass('hide', hideFilterTag);
			this.suggester = new choosenSuggester(this.app, this.plugin, this.view, this);

			// File filter should only be applied to DefaultSuggester.
			if (isFileFilter && this.suggester instanceof DefaultSuggester)
				this.suggester.setFileFilter(this.activeFilter);
			this.suggester.setInput('');
		}     
	}
}