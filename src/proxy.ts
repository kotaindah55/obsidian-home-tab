import type HomeTabPlugin from "src/main";

function _walkObjectDeeply(
	target: Partial<Record<string, unknown>>,
	callback: (
		curObj: Partial<Record<string, unknown>>,
		prop: string
	) => unknown
): void {
	for (let prop in target) {
		callback(target, prop);
		if (target[prop] && typeof target[prop] === 'object')
			_walkObjectDeeply(target[prop], callback);
	}
}

export function proxifySettings(plugin: HomeTabPlugin): void {
	let setter = <T extends object>(
		target: T,
		prop: string,
		newValue: unknown,
		receiver: unknown
	) => {
		let succeed = Reflect.set(target, prop, newValue, receiver);
		if (succeed) plugin.requestSave();
		return succeed;
	};

	_walkObjectDeeply(plugin.settings, (curObj, prop) => {
		let value = curObj[prop];
		if (value && typeof value === 'object')
			curObj[prop] = new Proxy(value, { set: setter });
	});

	plugin.settings = new Proxy(plugin.settings, { set: setter });
}