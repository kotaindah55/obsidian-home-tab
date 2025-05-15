<script lang='ts'>
	import { Menu, type TFile } from 'obsidian';
	import type { HomeTabSettings } from 'src/settings/settings-config';
	import type { BookmarkedFile, BookmarkedFileManager } from 'src/file-manager/bookmarked-files';
	import FileItem from 'src/ui/components/file-item.svelte';
	import type { HomeTabEmbed, HomeTabView } from '../view';

	interface BookmarkShelfProps {
		view: HomeTabEmbed | HomeTabView;
		files: BookmarkedFile[];
		settings: HomeTabSettings;
		manager: BookmarkedFileManager;
	}

	let {
		view,
		files,
		settings,
		manager
	}: BookmarkShelfProps = $props();

	let selectedFile: TFile | undefined = $state(),
		app = manager.app,
		contextMenu: Menu = new Menu()
			.addItem((item) => item
				.setTitle('Remove from bookmarks')
				.setIcon('bookmark-minus')
				.setWarning(true)
				.onClick(() => selectedFile && manager.removeBookmark(selectedFile)))
			.setUseNativeMenu(app.vault.config.nativeMenus ?? false);
</script>

<div class='home-tab-shelf-bookmarked-files-container'>
	{#each files as item (item.file.path)}
		<FileItem
			file={item.file} {app} {settings} {view} {contextMenu}
			itemMenu={file => selectedFile = file}
		/>
	{/each}
</div>