import type { FuseResult } from 'fuse.js';
import { AbstractInputSuggest, type App } from 'obsidian';
import { FileFuzzySearch } from 'src/core/fuzzy-search';
import { getSearchFilesByType } from 'src/core/search-utils';
import { FileType } from 'src/data/file-type';
import type { SearchFile } from 'src/model/search-file';

export class ImageSuggester extends AbstractInputSuggest<FuseResult<SearchFile>> {
	private _fuzzySearch: FileFuzzySearch;
	private readonly MAX_RESULT = 100;

	constructor(app: App, inputEl: HTMLInputElement | HTMLDivElement) {
		super(app, inputEl);

		let searchFiles = getSearchFilesByType(app, FileType.IMAGE);
		this._fuzzySearch = new FileFuzzySearch(app, searchFiles);
		this.onSelect(result => {
			this.setValue(result.item.name);
			inputEl.dispatchEvent(new InputEvent('input'));
		});
	}

	public async getSuggestions(query: string): Promise<FuseResult<SearchFile>[]> {
		return this._fuzzySearch.rawSearch(query, this.MAX_RESULT);
	}

	public renderSuggestion(result: FuseResult<SearchFile>, el: HTMLElement): void {
		let filename = result.item.name,
			parentPath = result.item.file?.parent?.path ?? '??',
			contentEl = el.createDiv({ cls: 'suggestion-content' });

		contentEl.createDiv({ cls: 'suggestion-title', text: filename });
		contentEl.createDiv({ cls: 'suggestion-path', text: parentPath });
		el.addClass('mod-complex', 'hometab-image-suggestion');
	}
}