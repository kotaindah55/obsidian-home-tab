import type { FuseResult } from 'fuse.js';
import { AbstractInputSuggest, type App } from 'obsidian';
import { ArrayFuzzySearch } from 'src/core/fuzzy-search';
import { SYSTEM_FONTS, tryGetSystemFonts } from 'src/data/system-fonts';

export class FontSuggester extends AbstractInputSuggest<FuseResult<string>> {
	private _fuzzySearch: ArrayFuzzySearch;
	
	constructor(app: App, inputEl: HTMLInputElement | HTMLDivElement) {
		super(app, inputEl);
		this.onSelect(result => {
			this.setValue(result.item);
			inputEl.dispatchEvent(new InputEvent('input'));
		});
	}

	private get MAX_RESULT() {
		return SYSTEM_FONTS.length;
	}

	public async getSuggestions(query: string): Promise<FuseResult<string>[]> {
		if (!this._fuzzySearch) {
			if (!SYSTEM_FONTS.length) await tryGetSystemFonts();
			this._fuzzySearch = new ArrayFuzzySearch(SYSTEM_FONTS);
		}
		return this._fuzzySearch.rawSearch(query, this.MAX_RESULT);
	}

	public renderSuggestion(result: FuseResult<string>, el: HTMLElement): void {
		let fontName = result.item;
		el.setText(fontName);
		el.setCssStyles({ fontFamily: `"${fontName}"` });
	}
}