import type { FileIconManager, IconicPlugin } from 'src/typings/iconic';
import { around, type uninstaller } from 'monkey-around';

const refreshIcons = (oldFn: FileIconManager['refreshIcons']) => function (
	this: FileIconManager,
	unloading?: boolean
): void {
	oldFn.call(this, unloading);
	this.app.workspace.trigger('iconic:icons-refresh');
}

export function patchIconic(iconicPlugin: IconicPlugin): uninstaller {
	let { fileIconManager } = iconicPlugin;
	return around(fileIconManager, { refreshIcons });
}