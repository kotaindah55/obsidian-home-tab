import type { App } from 'obsidian';
import type { OmnisearchApi } from 'src/typings/omnisearch';

export function isOmnisearchEnabled(app: App): boolean {
	return !!app.plugins.getPlugin('omnisearch');
}

export function isIconicEnabled(app: App): boolean {
	return !!app.plugins.getPlugin('iconic');
}

export function getOmnisearchApi(app: App): OmnisearchApi | undefined {
	return app.plugins.getPlugin('omnisearch')?.api;
}

export function isWebviewerEnabled(app: App): boolean {
	return !!app.internalPlugins.getEnabledPluginById('webviewer');
}

export function isBookmarksEnabled(app: App): boolean {
	return !!app.internalPlugins.getEnabledPluginById('bookmarks');
}

export async function reenablePlugin(app: App, id: string) {
	let pluginManager = app.plugins;
	try {
		await pluginManager.disablePluginAndSave(id);
		await pluginManager.enablePluginAndSave(id);
	} catch (err) {
		console.log('Error when reenable the plugin:\n', err);
	}
}