import type { FuseResult } from 'fuse.js';
import { AbstractInputSuggest, setIcon, type App } from 'obsidian';
import { IconFuzzySearch } from 'src/core/fuzzy-search';
import { IconSearchFiles } from 'src/data/icons';
import { DEFAULT_FUSE_OPTIONS, type IconSearchFile } from 'src/model/search-file';

export class IconSuggester extends AbstractInputSuggest<FuseResult<IconSearchFile>> {
	private _fuzzySearch: IconFuzzySearch;
	private readonly MAX_RESULT = 100;

	constructor(app: App, inputEl: HTMLInputElement | HTMLDivElement) {
		super(app, inputEl);
		this._fuzzySearch = new IconFuzzySearch(
			IconSearchFiles,
			Object.assign({}, DEFAULT_FUSE_OPTIONS, { keys: [
				{ name: 'name', weight: 0.95 },
				{ name: 'tags', weight: 0.05 }
			]})
		);

		this.onSelect(result => {
			this.setValue(result.item.name);
			inputEl.dispatchEvent(new InputEvent('input'));
		});
	}

	public async getSuggestions(query: string): Promise<FuseResult<IconSearchFile>[]> {
		return this._fuzzySearch.rawSearch(query, this.MAX_RESULT);
	}

	public renderSuggestion(result: FuseResult<IconSearchFile>, el: HTMLElement): void {
		let iconWrapperEl = el.createDiv({ cls: 'suggestion-icon' });

		el.createDiv({ cls: 'suggestion-content', text: result.item.name });
		el.addClass('mod-complex', 'home-tab-icon-suggestion');
		setIcon(iconWrapperEl, result.item.name);
	}
}