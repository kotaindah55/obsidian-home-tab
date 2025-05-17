import type { FileIconManager, IconicPlugin } from 'src/typings/iconic';
import { around, type uninstaller } from 'monkey-around';
import type HomeTabPlugin from 'src/main';

const refreshIcons = (oldFn: FileIconManager['refreshIcons']) => function (
	this: FileIconManager,
	unloading?: boolean
): void {
	oldFn.call(this, unloading);
	this.app.workspace.trigger('iconic:icons-refresh');
}

export function patchIconic(homeTabPlugin: HomeTabPlugin, iconicPlugin: IconicPlugin): uninstaller {
	if (iconicPlugin.fileIconManager) {
		let { fileIconManager } = iconicPlugin;
		return around(fileIconManager, { refreshIcons });
	} else {
		homeTabPlugin.selfReenable();
		return () => void 0;
	}
}