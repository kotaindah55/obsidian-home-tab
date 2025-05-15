import type { uninstaller } from "monkey-around";
import { View, WorkspaceLeaf } from "obsidian";
import type HomeTabPlugin from "src/main";
import { HomeTabView } from "src/ui/view";

function _deproxifyViewFieldOnWorkspaceLeaf(plugin: HomeTabPlugin): void {
	delete (WorkspaceLeaf.prototype as { view?: View }).view;
	plugin.app.workspace.iterateAllLeaves(leaf => {
		leaf.view = leaf._originView;
		delete (leaf as { _originView?: View })._originView;
	});
}

export function proxifyViewFieldOnWorkspaceLeaf(plugin: HomeTabPlugin): uninstaller {
	let leafProto = WorkspaceLeaf.prototype;

	Object.defineProperty(leafProto, 'view', {
		configurable: true,
		enumerable: true,
		get(this: WorkspaceLeaf) {
			return this._originView;
		},
		set(this: WorkspaceLeaf, view: View) {
			if (view.getViewType() == 'empty' && plugin.settings.replaceNewTabs) {
				view.close();
				this._originView = new HomeTabView(this, plugin);
			}
			else this._originView = view;
		}
	});

	return () => { _deproxifyViewFieldOnWorkspaceLeaf(plugin) }
}