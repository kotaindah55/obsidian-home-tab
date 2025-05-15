import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResult } from 'fuse.js';
import type { App, TFile } from 'obsidian';
import { DEFAULT_FUSE_OPTIONS, type IconSearchFile, type MarkdownSearchFile, type SearchFile, type LinkSearchFile } from 'src/model/search-file';
import { getMarkdownSearchFiles } from 'src/core/search-utils';
import { getImageFiles } from 'src/utils/file-utils';

abstract class FuzzySearch<T> {
	private readonly _fuse: Fuse<T>;

	constructor(searchArray: T[], searchOptions: IFuseOptions<T> = DEFAULT_FUSE_OPTIONS) {
		this._fuse = new Fuse(searchArray, searchOptions);
	}

	public rawSearch(query: string, limit?: number): FuseResult<T>[] {
		return this._fuse.search(query, limit ? { limit } : undefined);
	}

	public filteredSearch(
		query: string,
		scoreThreshold: number = 0.25,
		maxResults: number = 5
	): FuseResult<T>[] {
		return this
			.rawSearch(query, maxResults)
			.filter(item => item.score ? item.score < scoreThreshold : true);
	}

	public updateSearchArray(newSearchArray: T[]): void {
		this._fuse.setCollection(newSearchArray);
	}
}

export class ArrayFuzzySearch extends FuzzySearch<string> {
	constructor(searchArray: string[], searchOptions?: IFuseOptions<string>) {
		super(searchArray, searchOptions);
	}
}

/** Search created markdown files by basename and aliases. */
export class MarkdownFileFuzzySearch extends FuzzySearch<MarkdownSearchFile> {
	public readonly app: App;

	constructor(
		app: App,
		fileList?: MarkdownSearchFile[],
		searchOptions?: IFuseOptions<MarkdownSearchFile>
	) {
		let searchArray = fileList ?? getMarkdownSearchFiles(app);
		super(searchArray, searchOptions);
		this.app = app;
	}

	// Return the best match between the filename and the aliases.
	public getBestMatch(
		searchResult: FuseResult<MarkdownSearchFile>,
		query: string
	): string {
		let searchFile = searchResult.item;
		if (!searchFile.aliases) return searchFile.basename;

		let searchArray: string[] = [];
		searchArray.push(searchFile.basename);
		searchFile.aliases.forEach(alias => searchArray.push(alias));

		let fuzzySearch = new ArrayFuzzySearch(searchArray),
			bestMatch = fuzzySearch.rawSearch(query, 1)[0];
		
		if (!bestMatch) return searchFile.basename;

		return bestMatch.item;
	}
}

export class FileFuzzySearch extends FuzzySearch<SearchFile> {
	public readonly app: App;

	constructor(app: App, fileList: SearchFile[], searchOptions?: IFuseOptions<SearchFile>) {
		let searchArray = fileList;
		super(searchArray, searchOptions);
		this.app = app;
	}

	/**
	 * @return Best match between basename and aliases.
	 */
	public getBestMatch(
		searchResult: FuseResult<SearchFile>,
		query: string
	): string {
		let searchFile = searchResult.item
		// if(searchFile.fileType != 'markdown') return searchFile.name
		
		// Check if the match is from headings
		if (searchResult.matches?.some(match => match.key === 'headings')) {
			// Find all heading matches and sort by score
			let headingMatches = searchResult.matches
				.filter(match => match.key === 'headings')
				.sort((a, b) => {
					let scoreA = a.indices[0][0] || 0,
						scoreB = b.indices[0][0] || 0;
					return scoreA - scoreB;
				});

			// Get the best heading match
			let bestHeadingMatch = headingMatches[0];
			if (bestHeadingMatch && bestHeadingMatch.value)
				return searchFile.basename;
		}

		if (!searchFile.aliases) return searchFile.basename;

		let searchArray: string[] = [];
		searchArray.push(searchFile.basename);
		searchFile.aliases.forEach(alias => searchArray.push(alias));

		let fuzzySearch = new ArrayFuzzySearch(searchArray),
			bestMatch = fuzzySearch.rawSearch(query, 1)[0];
		
		return bestMatch?.item ?? searchFile.basename;
	}
}

/** Search image file. */
export class ImageFileFuzzySearch extends FuzzySearch<TFile> {
	public readonly app: App;

	/**
	 * @param imageList Optional list of TFile, if not given the search will be in the entire vault.
	 */
	constructor(app: App, imageList?: TFile[], searchOptions?: IFuseOptions<TFile>) {
		let searchArray = imageList ?? getImageFiles(app);
		super(searchArray, searchOptions);
		this.app = app;
	}
}

export class WebFuzzySearch extends FuzzySearch<LinkSearchFile> {
	constructor(urlList: LinkSearchFile[], searchOptions?: IFuseOptions<LinkSearchFile>) {
		super(urlList, searchOptions);
	}

	public getBestMatch(searchResult: FuseResult<LinkSearchFile>, query: string): string {
		let urlItem = searchResult.item;

		if (!urlItem.title) return urlItem.url ?? '';

		let searchArray: string[] = [];
		searchArray.push(urlItem.title, urlItem.url ?? '');

		let fuzzySearch = new ArrayFuzzySearch(searchArray),
			bestMatch = fuzzySearch.rawSearch(query, 1)[0];
		
		return bestMatch?.item ?? urlItem.url ?? '';
	}
}

export class IconFuzzySearch extends FuzzySearch<IconSearchFile> {
	constructor(iconList: IconSearchFile[], searchOptions?: IFuseOptions<IconSearchFile>) {
		super(iconList, searchOptions);
	}
}