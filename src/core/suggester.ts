// Inspired from @liamcain periodic notes suggest: https://github.com/liamcain/obsidian-periodic-notes/blob/main/src/ui/suggest.ts

import {
	Component as ObsidianComponent,
	debounce,
	Scope,
	type App,
	type Debouncer
} from 'obsidian';
import { get, writable, type Writable } from 'svelte/store';
import { mount, unmount, type Component as SvelteComponent } from 'svelte';
import SuggestionResult from 'src/ui/suggestion-result.svelte';

export interface SuggesterViewOptions {
	/** Additional suggestion list classes. */
	additionalClasses?: string;
	/** HTMLelement to render under suggestion items. */
	additionalModalInfo?: HTMLElement;
	/** The class of the suggestion list container. */
	containerClass?: string;
	isScrollable?: boolean;
	/** The style of the suggestion list, usefull to implement variables. */
	style?: string;
	/** Class of the suggestion list, if not given will be used the obsidian default 'suggestion'. */
	suggestionClass?: string;
}

interface ISuggester<T> {
	onNoSuggestion(): void;
	getSuggestions(input: string): T[] | Promise<T[]>;
	useSelectedItem(item: T, middleClick?: boolean): void;
	getComponentProps(suggestion: T): Record<string, unknown>;
	scrollSelectedItemIntoView(): void;
}

export class SuggestionSource<T> {
	private _suggestions: T[];
	private _selectedIndex: number;
	
	public suggester: ISuggester<T>;
	public containerEl: Writable<HTMLElement>;
	public sourceStore: Writable<T[]>;
	public selectedIndexStore: Writable<number>;

	constructor(suggester: ISuggester<T>, scope: Scope){
		this.suggester = suggester;

		// Svelte store variables
		this.sourceStore = writable();
		this.selectedIndexStore = writable();
		this.containerEl = writable();

		this.selectedIndexStore.subscribe(value => this._selectedIndex = value);
		this.sourceStore.subscribe(value => this._suggestions = value);

		this.setSuggestions([]);
		this.setSelectedIndex(0);
	}

	public setSuggestions(suggestions: T[]): void {
		this.selectedIndexStore.set(0); // Reset selected item to the first result
		this.sourceStore.set(suggestions); // Update suggestions list
	}

	public getSuggestions(): T[] {
		return this._suggestions
	}

	public getSelected(): T {
		return this._suggestions[this._selectedIndex]
	}

	public getSelectedIndex(): number {
		return this._selectedIndex
	}

	public getSuggestionByIndex(index: number): T {
		return this._suggestions[index]
	}

	public setSelectedIndex(newIndex: number): void {
		if (newIndex >= this._suggestions.length) {
			this.selectedIndexStore.set(0);
		} else if (newIndex < 0) {
			this.selectedIndexStore.set(this._suggestions.length - 1);
		} else {
			this.selectedIndexStore.set(newIndex);
		}
	}
}

export abstract class TextInputSuggester<T> implements ISuggester<T> {
	public readonly app: App;
	public readonly win: Window;
	
	/**
	 * All events should be registered under this wrapper, in order to be
	 * detached safely when this suggester is going to be destroyed.
	 */
	protected eventWrapper: ObsidianComponent;
	protected scope: Scope;

	protected inputEl: HTMLInputElement;
	protected wrapperEl: HTMLElement;
	protected containerEl: HTMLElement;
	
	protected resultView: SuggestionResult | undefined;
	protected viewOptions: SuggesterViewOptions;
	protected isDisplayed: boolean;

	protected source: SuggestionSource<T>;
	
	protected closingAnimationTimer: number | null;
	protected closingAnimationRunning: boolean;

	private _reqInputHandling: Debouncer<[evt: Event], Promise<void>>;
	private _lastValue: string;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		wrapperEl: HTMLElement,
		viewOptions: SuggesterViewOptions = {},
		searchDelay: number = 200
	) {
		this.app = app;
		this.win = app.dom.appContainerEl.win;
		this.eventWrapper = new ObsidianComponent();
		this.inputEl = inputEl;
		this.scope = new Scope(this.app.scope);
		this.source = new SuggestionSource(this, this.scope);

		this._reqInputHandling = debounce(
			async (evt: Event) => {
				const target = evt.target as HTMLInputElement;
				if (target.value !== this._lastValue) {
					this._lastValue = target.value;
					await this.onInput();
				}
			},
			searchDelay,
			false
		);
		
		this.registerEvents();
		this.registerScope();
		
		this.viewOptions = viewOptions;
		this.wrapperEl = wrapperEl;
		this.closingAnimationRunning = false;
	}

	public async onInput(): Promise<void>{
		let input = this.inputEl.value,
			suggestions = await this.getSuggestions(input);
		
		this.source.setSuggestions([]);
		
		if (suggestions && suggestions.length > 0) {
			this.source.setSuggestions(suggestions);
			this.open();
		} else {
			this.onNoSuggestion();
		}
	}

	public onNoSuggestion(): void {
		this.close();
	}

	public getWrapperEl(): HTMLElement {
		return this.wrapperEl;
	}

	public open(): void {
		if (this.closingAnimationRunning) this.abortClosingAnimation();
		if (this.resultView) return;
		
		this.containerEl = this.getWrapperEl();

		this.app.keymap.pushScope(this.scope);

		this.resultView = mount(SuggestionResult, {
			target: this.containerEl,
			props: {
				suggester: this,
				options: this.viewOptions,
			},
			intro: true,
		});

		this.onOpen();
	}

	public close(): void {
		this.app.keymap.popScope(this.scope);

		// Reset suggestions
		this.source.setSuggestions([]);

		// Allow svelte to run the animation, then remove the component(s)
		if (this.resultView) {
			this.closingAnimationRunning = true;
			this.closingAnimationTimer = this.win.setTimeout(() => {
				if (this.resultView) unmount(this.resultView);
				this.resultView = undefined;
				this.closingAnimationRunning = false;
			}, 200);
		}

		this.additionalCleaning();
		this.onClose();
	}

	public abortClosingAnimation(): void {
		if (this.closingAnimationTimer !== null) {
			this.win.clearTimeout(this.closingAnimationTimer);
			this.closingAnimationTimer = null;
		}

		if (this.resultView) unmount(this.resultView);
		this.resultView = undefined;
		this.closingAnimationRunning = false;
	}
	
	public destroy(): void {
		this.close();

		// Detached all registered events
		this.eventWrapper.unload();
	}
	
	public scrollSelectedItemIntoView(): void {
		get(this.source.containerEl).children[this.source.getSelectedIndex()]?.scrollIntoView({
			behavior: 'auto', block: 'nearest', inline: 'nearest'
		});
	}
	
	public getSuggester(): SuggestionSource<T> {
		return this.source;
	}

	public setInput(input: string, triggerEvent = true): void {
		this.inputEl.value = input;
		if (triggerEvent)
			this.inputEl.dispatchEvent(new InputEvent('input')); // Trigger input
	}

	protected registerEvents(): void {
		// Load the wrapper, so it can detach its events when unloading
		this.eventWrapper.load();
		this.eventWrapper.registerDomEvent(this.inputEl, 'input', this._reqInputHandling);
		this.eventWrapper.registerDomEvent(this.inputEl, 'blur', this.close.bind(this));
	}

	protected registerScope(): void {
		this.scope.register([], 'ArrowUp', evt => {
			evt.preventDefault();
			this.source.setSelectedIndex(this.source.getSelectedIndex() - 1);
			this.scrollSelectedItemIntoView();
		});

		this.scope.register([], 'ArrowDown', evt => {
			evt.preventDefault();
			this.source.setSelectedIndex(this.source.getSelectedIndex() + 1);
			this.scrollSelectedItemIntoView();
		});

		this.scope.register([], 'Enter', evt => {
			evt.preventDefault();
			this.useSelectedItem(this.source.getSelected());
		});

		this.scope.register([], 'escape', this.close.bind(this));
	}

	protected additionalCleaning(): void {}
	protected onOpen(): void {}
	protected onClose(): void {}

	abstract getSuggestions(input: string): T[] | Promise<T[]>;
	abstract useSelectedItem(item: T, middleClick?: boolean): void;
	abstract getComponentProps(suggestion: T): Record<string, unknown>;
	abstract getComponentType(): SvelteComponent;
}