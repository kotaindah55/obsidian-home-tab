import type { FuseResult } from 'fuse.js';
import { type App, normalizePath, Platform, TFile } from 'obsidian';
import { get } from 'svelte/store'
import { DEFAULT_FUSE_OPTIONS, type SearchFile } from 'src/model/search-file';
import { FileFuzzySearch } from 'src/core/fuzzy-search';
import type { SearchBarHandler } from 'src/ui/searchbar-handler';
import { getParentFolderFromPath } from 'src/utils/file-utils';
import {
	generateSearchFile,
	getSearchFiles,
	getUnresolvedMarkdownFiles
} from 'src/core/search-utils';
import { TextInputSuggester } from 'src/core/suggester';
import { generateHotkeyHints } from 'src/utils/component-utils';
import { FileType, FileTypeLookupTable } from 'src/data/file-type';
import type { FilterSpec } from 'src/ui/searchbar-handler';
import { FILE_HOTKEY_HINTS } from 'src/data/hotkey-hints';
import { FilterType } from 'src/data/filter';
import DefaultSuggestionItem from 'src/ui/components/default-suggestion-item.svelte' 
import type HomeTabPlugin from 'src/main';
import { HomeTabView, type HomeTabEmbed } from '../view';

export class DefaultSuggester extends TextInputSuggester<FuseResult<SearchFile>>{
	private _files: SearchFile[];
	private _fuzzySearch: FileFuzzySearch;
	private _activeFilter: FilterSpec;

	public readonly plugin: HomeTabPlugin;
	public view: HomeTabView | HomeTabEmbed;

	constructor(app: App, plugin: HomeTabPlugin, view: HomeTabView | HomeTabEmbed, searchBar: SearchBarHandler) {
		super(
			app, get(searchBar.searchBarEl), get(searchBar.suggestionContainerEl),
			{
				containerClass: `home-tab-suggestion-container ${Platform.isPhone ? 'is-phone' : ''}`,
				additionalClasses: `${plugin.settings.selectionHighlight === 'accentColor' ? 'use-accent-color' : ''}`,
				additionalModalInfo: plugin.settings.showShortcuts
					? generateHotkeyHints(FILE_HOTKEY_HINTS, 'home-tab-hotkey-suggestions')
					: undefined
			},
			plugin.settings.searchDelay
		);

		this.plugin = plugin;
		this.view = view;
		this.app.metadataCache.onCleanCache(() => this._init());
	}

	protected onOpen(): void {
		let active = !!this.source.getSuggestions().length;
		this._toggleSearchBarContainerState(active);
	}

	protected onClose(): void {
		this._toggleSearchBarContainerState(false);
	}

	/**
	 * @override
	 */
	public onNoSuggestion(): void {
		// To support showing create new file suggestion
		// We replace prototype's method with this method
		devel: console.log('%cDefault suggester:%c Handling on no-suggestion event', 'color: gray;', 'color: auto;');
		if (
			this._activeFilter &&
			this._activeFilter.option !== FileType.MARKDOWN &&
			this._activeFilter.option !== 'md'
		) {
			devel: console.log('%cDefault suggester:%c Closing suggester soon', 'color: gray;', 'color: auto;');
			this.close();
			return;
		}

		let input = this.inputEl.value;
		if (input) {
			this.source.setSuggestions([{
				item: {
					name: `${input}.md`,
					path: `${input}.md`,
					basename: input,
					isCreated: false,
					fileType: FileType.MARKDOWN,
					extension: 'md',
				},
				refIndex: 0,
				score: 0,
			}]);
			devel: console.log('%cDefault suggester:%c Displaying create new file', 'color: gray;', 'color: auto;');
			this.open();
		} else {
			devel: console.log('%cDefault suggester:%c No input detected, closing suggester soon', 'color: gray;', 'color: auto;');
			this.close();
		}
	}
	
	public getSuggestions(input: string): FuseResult<SearchFile>[] {
		return this._fuzzySearch.rawSearch(input, this.plugin.settings.maxResults);
	}

	public useSelectedItem(selectedItem: FuseResult<SearchFile>, newTab: boolean = false): void {
		if (selectedItem.item.isCreated && selectedItem.item.file) {
			let { item } = selectedItem,
				headingMatch = selectedItem.matches?.find(match => match.key === 'headings'),
				headingName = headingMatch?.value;
			// Jump to the matched heading directly, inspired by Moyf
			// https://github.com/Moyf/obsidian-home-tab
			if (
				this.plugin.settings.autoJumpToHeading &&
				headingName && item.file
			) {
				let link = `${item.path}#${headingName}`;
				this.app.workspace.openLinkText(link, '/', newTab);
			}
			else this.openFile(selectedItem.item.file, newTab);
		}
		
		else {
			this._handleFileCreation(selectedItem.item, newTab);
		}
	}

	public getComponentProps(suggestion: FuseResult<SearchFile>): {
		displayName: string,
		searchFile: SearchFile,
		filePath?: string,
		matchedHeading?: string
	} {
		let searchFile = suggestion.item;

		if (!this.inputEl || !(this.inputEl instanceof HTMLInputElement)) {
			return {
				displayName: searchFile.basename,
				filePath: undefined,
				searchFile
			};
		}

		let displayName = searchFile.basename,
			filePath: string | undefined,
			matchedHeading: string | undefined;

		if (this.plugin.settings.showPath) {
			filePath = searchFile.file && searchFile.file.parent 
				? searchFile.file.parent.name 
				: getParentFolderFromPath(searchFile.path);
		}

		// Check if the match is from a heading
		if (this.plugin.settings.searchHeadings && suggestion.matches) {
			// Find the first heading match
			let headingMatch = suggestion.matches.find(match => match.key === 'headings');
			if (headingMatch && typeof headingMatch.value === 'string') {
				matchedHeading = headingMatch.value;
				// Keep the basename as nameToDisplay when it's a heading match
				displayName = searchFile.basename;
				// If we have a heading match, we skip other matches like aliases
				return {
					displayName,
					searchFile,
					filePath,
					matchedHeading
				};
			}
		}

		// Only use fuzzy search for non-heading matches
		displayName = this._fuzzySearch.getBestMatch(suggestion, this.inputEl.value);
		
		return {
			displayName,
			searchFile,
			filePath,
			matchedHeading
		};
	}

	public getComponentType(): typeof DefaultSuggestionItem {
		return DefaultSuggestionItem;
	}

	public openFile(file: TFile, newTab?: boolean): void {
		// TODO Check if file is already open
		if (newTab) {
			this.app.workspace.createLeafInTabGroup().openFile(file);
			// this.inputEl.value = ''
		} else {
			if (this.view instanceof HomeTabView) {
				this.view.leaf.openFile(file);
			} else {
				this.app.workspace.getMostRecentLeaf()?.openFile(file);
			}
		}
	}

	public setFileFilter(spec: FilterSpec): void {
		devel: console.log('%cDefault suggester:%c Setting search filter', 'color: gray;', 'color: auto;');
		this._activeFilter = spec;
		
		this.app.metadataCache.onCleanCache(() => {
			this._fuzzySearch.updateSearchArray(this._filterSearchFiles(
				spec,
				this.plugin.settings.markdownOnly
					? getSearchFiles(this.app, this.plugin.settings.unresolvedLinks)
					: this._files
			));
		});
		
		this.source.setSuggestions([]); // Reset search suggestions
		this.close();
	}

	protected registerEvents(): void {
		super.registerEvents();

		this.eventWrapper.registerEvent(this.app.vault.on(
			'create',
			file => { if (file instanceof TFile) this._updateSearchFileList(file) }
		));

		this.eventWrapper.registerEvent(this.app.vault.on(
			'delete',
			file => { if (file instanceof TFile) this._updateSearchFileList(file) }
		));
	
		this.eventWrapper.registerEvent(this.app.vault.on(
			'rename',
			(file, oldPath) => { if (file instanceof TFile) this._updateSearchFileList(file, oldPath) }
		));

		this.eventWrapper.registerEvent(this.app.metadataCache.on(
			'resolved',
			() => this._updateUnresolvedFiles()
		));
	}

	protected registerScope(): void {
		super.registerScope();

		// Open file in new tab
		this.scope.register(['Mod'], 'Enter', evt => {
			evt.preventDefault();
			this.useSelectedItem(this.source.getSelected(), true);
		});

		// Create file
		this.scope.register(['Shift'], 'Enter', async evt => {
			evt.preventDefault();
			await this._handleFileCreation();
		});

		// Create file and open in new tab
		this.scope.register(['Shift', 'Mod'], 'Enter', async evt => {
			evt.preventDefault();
			await this._handleFileCreation(undefined, true);
		});
	}

	private _init(): void {
		this._files = this.plugin.settings.markdownOnly
			? this._filterSearchFiles(
				{ type: FilterType.FILE_TYPE, option: FileType.MARKDOWN },
				getSearchFiles(this.app, this.plugin.settings.unresolvedLinks)
			)
			: getSearchFiles(this.app, this.plugin.settings.unresolvedLinks);

		this._fuzzySearch = new FileFuzzySearch(this.app, this._files, { 
			...DEFAULT_FUSE_OPTIONS,
			ignoreLocation: true,
			fieldNormWeight: 1.65,
			keys: [
				{ name: 'basename', weight: 1.5 },
				{ name: 'aliases', weight: 0.1 },
				...(this.plugin.settings.searchTitle ? [{ name: 'title', weight: 1.2 }] : []),
				...(this.plugin.settings.searchHeadings ? [{ name: 'headings', weight: 1.0 }] : [])
			]
		});
	}

	private _toggleSearchBarContainerState(isActive: boolean): void {
		this.inputEl.parentElement?.toggleClass('is-active', isActive);
	}

	private _filterSearchFiles(spec: FilterSpec, files: SearchFile[]): SearchFile[] {
		return files.filter(({ extension }) => {
			if (spec.type === FilterType.FILE_EXT)
				return spec.option == extension;
			else if (spec.type === FilterType.FILE_TYPE)
				return !!FileTypeLookupTable[extension ?? ''];
			else
				return false;
		});
	}

	private async _handleFileCreation(selectedFile?: SearchFile, newTab?: boolean): Promise<void> {
		let newFile: TFile;
		
		if (selectedFile?.isUnresolved) {
			let folderPath = selectedFile.path.replace(selectedFile.name, ''),
				exist = await this.app.vault.adapter.exists(folderPath);
			if (!exist)
				await this.app.vault.createFolder(folderPath);

			newFile = await this.app.vault.create(selectedFile.path, '');
		}

		else {
			let input = this.inputEl.value,
				// If a file with the same filename exists open it
				// Mimics the behaviour of the default quick switcher
				files = this._files.filter(file => file.fileType === FileType.MARKDOWN);

			if (files.some(file => file.basename === input)) {
				let fileToOpen = files.find(file => file.basename === input)?.file
				if (fileToOpen)
					return this.openFile(fileToOpen, newTab);
			}

			newFile = await this.app.vault.create(normalizePath(
				`${this.app.fileManager.getNewFileParent('').path}/${input}.md`
			), '');
		}
		
		this.openFile(newFile, newTab);
	}

	private _updateUnresolvedFiles() {
		let unresolvedFiles = getUnresolvedMarkdownFiles(this.app),
			areNewFiles = false;

		if (this._files) {
			unresolvedFiles.forEach((unresolvedFile) => {
				if (!this._files.includes(unresolvedFile)) {
					this._files.push(unresolvedFile);
					areNewFiles = true;
				}
			});
			if (areNewFiles)
				this._fuzzySearch.updateSearchArray(this._files);
		}
	}

	private _updateSearchFileList(file: TFile, oldPath?: string): void {
		this.app.metadataCache.onCleanCache(() => {
			let oldIndex = this._files.findIndex(file => file.path === oldPath);
			
			if (oldPath && oldIndex >= 0) {
				this._files.splice(oldIndex, 1);
				this._files.push(generateSearchFile(this.app, file));
			}

			let targetIndex = this._files.findIndex(file => file.path === file.path);
			
			if (file.deleted) {
				if (targetIndex >= 0) this._files.splice(targetIndex, 1);
			} else if (targetIndex < 0) {
				this._files.push(generateSearchFile(this.app, file));
			} else if (this._files[targetIndex].isUnresolved) {
				this._files[targetIndex] = generateSearchFile(this.app, file);
			}

			this._fuzzySearch.updateSearchArray(this._files);
		});
	}
}
