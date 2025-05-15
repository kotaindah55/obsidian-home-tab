import { AbstractInputSuggest, TextComponent } from 'obsidian';

export class ValidationTextComponent extends TextComponent {
	public suggester?: AbstractInputSuggest<unknown>;
	public validator?: RegExp | ((value: string) => boolean | Promise<boolean>);

	constructor(containerEl: HTMLElement) {
		super(containerEl);
	}

	public onChange(callback: (value: string, component: this) => Promise<unknown>): this {
		super.onChange(value => callback(value, this));
		return this;
	}

	public setValidation(pattern: string | RegExp | ((value: string) => boolean | Promise<boolean>)): this {
		if (!pattern) return this;

		this.validator = typeof pattern === 'function'
			? pattern
			: RegExp(pattern);

		return this;
	}

	public async checkValidity(showWarning = false): Promise<boolean> {
		let { inputEl } = this,
			valid = true;
		
		if (showWarning && this.validator)
			valid = this.validator instanceof RegExp
				? this.validator.test(inputEl.value)
				: await this.validator(inputEl.value);

		inputEl.toggleClass('mod-invalid', showWarning && !valid);
		return valid;
	}

	public setSuggester(
		suggesterConstructor: (inputEl: HTMLInputElement) => AbstractInputSuggest<unknown>
	): this {
		this.suggester = suggesterConstructor(this.inputEl);
		return this;
	}
}