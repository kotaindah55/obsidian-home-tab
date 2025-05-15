import {
	AbstractInputSuggest,
	ColorComponent,
	DropdownComponent,
	ExtraButtonComponent,
	Setting,
	SliderComponent,
	TextComponent,
	ToggleComponent,
	ValueComponent
} from 'obsidian';
import { ValidationTextComponent } from 'src/settings/components/control-components';
import {
	createColorPicker,
	createSlider,
	createText,
	createToggle
} from 'src/settings/components/control-utils';

interface NamedSettingSpec {
	containerEl: HTMLElement;
	name: string;
	desc?: string;
	cls?: string[];
}

interface ControlSettingSpec<R extends object, K, T> extends NamedSettingSpec {
	record: R;
	key: K extends keyof R ? R[K] extends T ? K : never : never;
	callback?: (value: T) => unknown;
	defaultValue?: T;
}

type ControlSpecTypes = 'toggle' | 'text' | 'colorPicker' | 'slider';

type ControlSpecMap<R extends object, K> = {
	'toggle': Omit<ToggleSettingSpec<R, K>, keyof NamedSettingSpec> & { type: 'toggle' };
	'text': Omit<TextSettingSpec<R, K>, keyof NamedSettingSpec> & { type: 'text' };
	'colorPicker': Omit<ColorPickerSettingSpec<R, K>, keyof NamedSettingSpec> & { type: 'colorPicker' };
	'slider': Omit<SliderSettingSpec<R, K>, keyof NamedSettingSpec> & { type: 'slider' };
}

export type ControlSpec<R extends object, K, T extends ControlSpecTypes> = ControlSpecMap<R, K>[T];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ToggleSettingSpec<R extends object, K> extends ControlSettingSpec<R, K, boolean> {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ColorPickerSettingSpec<R extends object, K> extends ControlSettingSpec<R, K, string> {}

interface TextSettingSpec<R extends object, K> extends ControlSettingSpec<R, K, string> {
	pattern?: RegExp | ((value: string) => boolean | Promise<boolean>);
	callback?: (value: string, valid?: boolean) => unknown;
	suggester?: (inputEl: HTMLInputElement) => AbstractInputSuggest<unknown>;
	useAsync?: boolean
}

interface SliderSettingSpec<R extends object, K> extends ControlSettingSpec<R, K, number> {
	limit?: [min: number, max: number, step: number | 'any'];
}

interface DropdownSettingSpec<R extends object, K, T extends string> extends ControlSettingSpec<R, K, T> {
	options: Record<T, string>;
}

interface ComplexDropdownSettingSpec<
	R extends object, K, T extends string,
	RChild extends object, KChild
> extends DropdownSettingSpec<R, K, T> {
	childControls: Partial<Record<T, ControlSpec<RChild, KChild, ControlSpecTypes>>>
}

interface ChildComponentDesc {
	component: ValueComponent<unknown>;
	defaultValue?: unknown;
	el: HTMLElement;
}

abstract class NamedSetting extends Setting {
	constructor(spec: NamedSettingSpec) {
		let { containerEl, name, desc, cls = [] } = spec;
		super(containerEl);
		this.setName(name);
		this.settingEl.addClass(...cls);
		if (desc) this.setDesc(desc);
	}
}

abstract class ControlSetting<R extends object, K, T> extends NamedSetting {
	public readonly defaultValue?: T;
	public mainInput?: ValueComponent<unknown>;
	public resetBtn: ExtraButtonComponent;

	constructor(spec: ControlSettingSpec<R, K, T>) {
		let { record, key, defaultValue } = spec;
		super(spec);
		this.defaultValue = defaultValue;
		if (defaultValue !== undefined) {
			this.addExtraButton(btn => btn
				.setIcon('reset')
				.setTooltip('Reset to default')
				.then(btn => this.resetBtn = btn)
				.onClick(() => {
					(record[key] as T) = defaultValue;
					this.resetValue();
				})
			);
		}
	}

	public resetValue(): this {
		if (this.defaultValue === undefined) return this;
		this.mainInput?.setValue(this.defaultValue);
		return this;
	}

	public addValidationText(callback: (component: ValidationTextComponent) => unknown): this {
		let component = new ValidationTextComponent(this.controlEl);
		this.components.push(component);
		callback(component);
		return this;
	}

	protected setMainInput(component: ValueComponent<unknown>): this {
		let controlEl: HTMLElement | undefined;
		this.mainInput = component;

		switch (true) {
			case component instanceof ToggleComponent:
				controlEl = component.toggleEl;
				break;
			case component instanceof SliderComponent:
				controlEl = component.sliderEl;
				break;
			case component instanceof TextComponent:
				controlEl = component.inputEl;
				break;
			case component instanceof ColorComponent:
				controlEl = component.colorPickerEl;
				break;
			case component instanceof DropdownComponent:
				controlEl = component.selectEl;
				break;
		}

		if (controlEl)
			this.resetBtn?.extraSettingsEl.before(controlEl);

		return this;
	}
}

export class HeadingSetting extends NamedSetting {
	constructor(spec: NamedSettingSpec) {
		super(spec);
		this.setHeading();
	}
}

export class ToggleSetting<R extends object, K> extends ControlSetting<R, K, boolean> {
	public mainInput: ToggleComponent;

	constructor(spec: ToggleSettingSpec<R, K>) {
		let { key, record, callback } = spec;
		super(spec);
		this.addToggle(toggle => toggle
			.setValue(record[key] as boolean)
			.then(() => this.setMainInput(toggle))
			.onChange(value => {
				(record[key] as boolean) = value;
				callback?.(value);
			})
		);
	}
}

export class SliderSetting<R extends object, K> extends ControlSetting<R, K, number> {
	public mainInput: SliderComponent;

	constructor(spec: SliderSettingSpec<R, K>) {
		let { key, record, limit, callback } = spec;
		super(spec);
		this.addSlider(slider => slider
			.setValue(record[key] as number)
			.setDynamicTooltip()
			.onChange(value => {
				(record[key] as number) = value;
				callback?.(value);
			})
			.then(() => {
				this.setMainInput(slider);
				if (limit) slider.setLimits(...limit);
			})
		);
	}
}

export class TextSetting<R extends object, K> extends ControlSetting<R, K, string> {
	public mainInput: TextComponent;

	constructor(spec: TextSettingSpec<R, K>) {
		let { key, record, callback, pattern, suggester } = spec;
		super(spec);

		this.addValidationText(text => text
			.setValue(record[key] as string)
			.setValidation(pattern ?? '')
			.then(text => { if (suggester) text.setSuggester(suggester) })
			.then(async () => text.checkValidity(true))
			.then(() => this.setMainInput(text))
			.onChange(async value => {
				let valid = await text.checkValidity(true);
				if (valid) (record[key] as string) = value;
				callback?.(value, valid);
			})
		);
	}
}

export class ColorPickerSetting<R extends object, K> extends ControlSetting<R, K, string> {
	public mainInput: ColorComponent;

	constructor(spec: ColorPickerSettingSpec<R, K>) {
		let { key, record, callback } = spec;
		super(spec);
		this.addColorPicker(colorPicker => colorPicker
			.setValue(record[key] as string)
			.then(() => this.setMainInput(colorPicker))
			.onChange(value => {
				(record[key] as string) = value;
				callback?.(value);
			})
		);
	}
}

export class DropdownSetting<R extends object, K, T extends string> extends ControlSetting<R, K, T> {
	public mainInput: DropdownComponent;

	constructor(spec: DropdownSettingSpec<R, K, T>) {
		let { key, record, options, callback } = spec;
		super(spec);
		this.addDropdown(dropdown => dropdown
			.addOptions(options)
			.setValue(record[key] as string)
			.then(() => this.setMainInput(dropdown))
			.onChange(value => {
				(record[key] as string) = value;
				callback?.(value as T);
			})
		);
	}
}

export class ComplexDropdownSetting<
	R extends object, K, T extends string,
	RChild extends object, KChild
> extends DropdownSetting<R, K, T> {
	public childrenEl: HTMLElement;
	private _childrenMap: Map<T, ChildComponentDesc>;

	constructor(spec: ComplexDropdownSettingSpec<R, K, T, RChild, KChild>) {
		let { childControls, record, key, callback } = spec,
			curValue = record[key];

		super(spec);
		this.childrenEl = this.controlEl.createDiv({
			cls: 'child-control-container'
		});
		this.mainInput.selectEl.before(this.childrenEl);
		this._childrenMap = new Map();

		for (let option in childControls) {
			let childSpec = childControls[option],
				component: ValueComponent<unknown>,
				el: HTMLElement;
			
			if (!childSpec) continue;

			if (childSpec.type === 'toggle') {
				let toggle = createToggle({ ...childSpec, containerEl: this.childrenEl });
				component = toggle;
				el = toggle.toggleEl;
			} else if (childSpec.type === 'colorPicker') {
				let colorPicker = createColorPicker({ ...childSpec, containerEl: this.childrenEl });
				component = colorPicker;
				el = colorPicker.colorPickerEl;
			} else if (childSpec.type === 'slider') {
				let slider = createSlider({ ...childSpec, containerEl: this.childrenEl });
				component = slider;
				el = slider.sliderEl;
			} else {
				let text = createText({ ...childSpec, containerEl: this.childrenEl });
				component = text;
				el = text.inputEl;
			}

			this._childrenMap.set(
				option,
				{ component, el, defaultValue: childSpec.defaultValue }
			);
		}

		this.switchChild(curValue as T);
		
		this.mainInput.onChange((childKey: T) => {
			this.switchChild(childKey);
			(record[key] as string) = childKey;
			callback?.(childKey);
		});
	}

	public resetValue(): this {
		for (let { component, defaultValue } of this._childrenMap.values()) {
			if (defaultValue === undefined) continue;
			component.setValue(defaultValue);
		}
		return super.resetValue();
	}

	public switchChild(childKey: T) {
		let { el } = this._childrenMap.get(childKey) ?? {};
		this.childrenEl.empty();
		if (el) this.childrenEl.append(el);
	}
}