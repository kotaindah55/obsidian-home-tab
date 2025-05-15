import { ColorComponent, SliderComponent, ToggleComponent } from 'obsidian';
import type { ControlSpec } from 'src/settings/components/setting-components';
import { ValidationTextComponent } from 'src/settings/components/control-components';

export function createToggle<R extends object, K>(
	spec: ControlSpec<R, K, 'toggle'> & { containerEl: HTMLElement }
): ToggleComponent {
	let { containerEl, record, key, callback } = spec;
	return new ToggleComponent(containerEl)
		.setValue(record[key] as boolean)
		.onChange(value => {
			(record[key] as boolean) = value;
			callback?.(value);
		});
}

export function createSlider<R extends object, K>(
	spec: ControlSpec<R, K, 'slider'> & { containerEl: HTMLElement }
): SliderComponent {
	let { containerEl, record, key, callback, limit } = spec;
	return new SliderComponent(containerEl)
		.setValue(record[key] as number)
		.setDynamicTooltip()
		.then(slider => { if (limit) slider.setLimits(...limit) })
		.onChange(value => {
			(record[key] as number) = value;
			callback?.(value);
		});
}

export function createText<R extends object, K>(
	spec: ControlSpec<R, K, 'text'> & { containerEl: HTMLElement }
): ValidationTextComponent {
	let { containerEl, record, key, callback, pattern, suggester } = spec;

	return new ValidationTextComponent(containerEl)
		.setValue(record[key] as string)
		.setValidation(pattern ?? '')
		.then(text => { if (suggester) text.setSuggester(suggester) })
		.then(async text => text.checkValidity(true))
		.onChange(async (value, text) => {
			let valid = await text.checkValidity(true);
			if (valid) (record[key] as string) = value;
			callback?.(value, valid);
		});
}

export function createColorPicker<R extends object, K>(
	spec: ControlSpec<R, K, 'colorPicker'> & { containerEl: HTMLElement }
): ColorComponent {
	let { containerEl, record, key, callback } = spec;
	return new ColorComponent(containerEl)
		.setValue(record[key] as string)
		.onChange(value => {
			(record[key] as string) = value;
			callback?.(value);
		});
}