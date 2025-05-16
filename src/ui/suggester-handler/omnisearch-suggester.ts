import { MarkdownView, Platform, TFile, WorkspaceLeaf, type App } from 'obsidian';
import { get } from 'svelte/store';
import type { SearchBarHandler } from "src/ui/searchbar-handler";
import { TextInputSuggester } from 'src/core/suggester';
import { generateHotkeyHints } from 'src/utils/component-utils';
import { concatStringsToRegexp, literalize } from 'src/utils/regex-utils';
import type { OmnisearchApi, ResultNoteApi } from 'src/typings/omnisearch';
import { DEFAULT_HOTKEY_HINTS } from 'src/data/hotkey-hints';
import { getOmnisearchApi } from 'src/utils/plugin-utils';
import OmnisearchSuggestionItem from 'src/ui/components/omnisearch-suggestion-item.svelte';
import type HomeTabPlugin from 'src/main';
import { HomeTabView, type HomeTabEmbed } from 'src/ui/view';
import { scrollMDViewInto } from 'src/utils/markdown-utils';

export class OmnisearchSuggester extends TextInputSuggester<ResultNoteApi> {
	public readonly plugin: HomeTabPlugin;
	public view: HomeTabView | HomeTabEmbed;
	public omnisearch?: OmnisearchApi;

	constructor(app: App, plugin: HomeTabPlugin, view: HomeTabView | HomeTabEmbed, searchBar: SearchBarHandler) {
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
		);

		this.plugin = plugin;
		this.view = view;
		this.omnisearch = getOmnisearchApi(this.app);
	}

	protected onOpen(): void {
		let active = !!this.source.getSuggestions().length;
		this._toggleSearchBarContainerState(active);    
	}

	protected onClose(): void {
		this._toggleSearchBarContainerState(false);
	}
	
	public async getSuggestions(input: string): Promise<ResultNoteApi[]> {
		let suggestions = (await this.omnisearch?.search(input))?.splice(0, this.plugin.settings.maxResults)
		return suggestions ?? [];
	}

	public useSelectedItem(selectedItem: ResultNoteApi, newTab?: boolean): void {
		let file = this.app.vault.getAbstractFileByPath(selectedItem.path),
			offset = selectedItem.matches[0]?.offset;
		if (file instanceof TFile)
			this.openFile(file, newTab, offset);
	}

	public getComponentProps(suggestion: ResultNoteApi): {
		displayName: string,
		filePath?: string,
		excerpt?: string
	} {
		let displayName = suggestion.basename,
			filePath: string | undefined,
			excerpt: string | undefined;

		if (this.plugin.settings.showPath)
			filePath = suggestion.path;

		if (this.plugin.settings.showOmnisearchExcerpt) {
			let literal = suggestion.foundWords.map(word => literalize(word)),
				regexp = concatStringsToRegexp(literal, 'gi');
			excerpt = this._highlightMatches(suggestion.excerpt, regexp);
		}

		return {
			displayName,
			filePath,
			excerpt
		};
	}

	public getComponentType(): typeof OmnisearchSuggestionItem {
		return OmnisearchSuggestionItem;
	}

	public async openFile(file: TFile, newTab?: boolean, offset?: number): Promise<void> {
		let targetLeaf: null | WorkspaceLeaf = null;

		if (newTab) {
			targetLeaf = this.app.workspace.createLeafInTabGroup();
		} else if (this.view instanceof HomeTabView) {
			targetLeaf = this.view.leaf;
		} else {
			targetLeaf = this.app.workspace.getMostRecentLeaf();
		}

		await targetLeaf?.openFile(file);

		if (
			this.plugin.settings.jumpToFirstMatch &&
			offset !== undefined &&
			targetLeaf?.view instanceof MarkdownView
		) {
			scrollMDViewInto(targetLeaf.view, offset);
		}
	}

	protected registerScope(): void {
		super.registerScope();

		// Open file in new tab
		this.scope.register(['Mod'], 'Enter', evt => {
			evt.preventDefault();
			this.useSelectedItem(this.source.getSelected(), true);
		});
	}

	private _highlightMatches(content: string, pattern: RegExp): string {
		return content.replace(
			pattern,
			match => `<span class="suggestion-highlight omnisearch-highlight omnisearch-default-highlight">${match}</span>`
		);
	}

	private _toggleSearchBarContainerState(isActive: boolean): void {
		this.inputEl.parentElement?.toggleClass('is-active', isActive);
	}
}