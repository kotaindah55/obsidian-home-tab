<script lang='ts'>
	import { Menu, type TFile } from 'obsidian';
	import type { RecentFileManager, RecentFile } from 'src/file-manager/recent-files';
	import type { HomeTabSettings } from 'src/settings/settings-config';
	import FileItem from 'src/ui/components/file-item.svelte';
	import type { HomeTabEmbed, HomeTabView } from '../view';

	interface RecentFileShelfProps {
		view: HomeTabEmbed | HomeTabView;
		files: RecentFile[];
		settings: HomeTabSettings;
		manager: RecentFileManager;
	}

	let {
		view,
		files,
		settings,
		manager
	}: RecentFileShelfProps = $props();

	let selectedFile: TFile | undefined = $state(),
		app = manager.app,
		contextMenu: Menu = new Menu()
			.addItem(item => item
				.setTitle('Remove from recents')
				.setIcon('trash-2')
				.setWarning(true)
				.onClick(() => selectedFile && manager.removeRecentFile(selectedFile))
			)
			.setUseNativeMenu(app.vault.config.nativeMenus ?? false);
</script>

<div class='home-tab-shelf-recent-files-container'>
	{#each files as recentFile (recentFile.file.path)}
		<FileItem
			file={recentFile.file} {app} {settings} {view} {contextMenu}
			itemMenu={file => selectedFile = file}
		/>
	{/each}
</div>