<script lang='ts'>
	import { onDestroy } from 'svelte';
	import type { App } from 'obsidian';
	import SearchBar from './searchbar.svelte';
	import { settingsStore, recentFileStore, bookmarkedFileStore } from 'src/store';
	import BookmarkShelf from 'src/ui/file-shelf/bookmark-shelf.svelte';
	import RecentFileShelf from 'src/ui/file-shelf/recent-file-shelf.svelte';
	import ObsidianNew from './logo/obsidian-new.svelte';
	import ObsidianOld from './logo/obsidian-old.svelte';
	import IconLogo from './logo/icon-logo.svelte';
	import ImageLogo from './logo/image-logo.svelte';
	import type { BookmarkedFile } from 'src/file-manager/bookmarked-files';
	import type { RecentFile } from 'src/file-manager/recent-files';
	import type { SearchBarHandler } from 'src/ui/searchbar-handler';
	import type { Unsubscriber } from 'svelte/store';
	import { HomeTabEmbed, type HomeTabView } from 'src/ui/view';
	import type { HomeTabSettings } from 'src/settings/settings-config';
	import type HomeTabPlugin from 'src/main';
	import { Bookmark, History } from 'lucide-svelte';
	
	interface Props {
		app: App;
		searchBarHandler: SearchBarHandler;
		plugin: HomeTabPlugin;
		view: HomeTabEmbed | HomeTabView;
	}

	let {
		app,
		searchBarHandler,
		plugin,
		view
	}: Props = $props();

	// let viewType: 'embed' | 'standalone' = view instanceof HomeTabView ? 'standalone' : 'embed'
	let bookmarkedFileList: BookmarkedFile[] = $state([]),
		recentFileList: RecentFile[] = $state([]),
		settings: HomeTabSettings = $state(plugin.settings),
		embeddedView = view instanceof HomeTabEmbed ? view : undefined,
		contracts: Unsubscriber[] = [];
	
	settingsStore.subscribe(pluginSettings => {
		settings = pluginSettings;

		contracts.push(
			bookmarkedFileStore.subscribe(files => bookmarkedFileList = files)
		);

		contracts.push(
			recentFileStore.subscribe(files => recentFileList = files)
		);
	});
		
	onDestroy(() => {
		plugin.settings.lastFileShelf = settings.lastFileShelf;
		contracts.forEach(unsubscriber => unsubscriber());
	});
</script>
  
<main class='home-tab' class:embedded={embeddedView}>
	{#if !embeddedView?.searchbarOnly}
		<div class='home-tab-wordmark-container'>
			{#if !(settings.logoType === 'none')}
				<div class='home-tab-logo' style='margin-right: calc({settings.fontSize}/5)'>
					{#if settings.logoType === 'default'}
						<!-- New obsidian logo -->
						<ObsidianNew
							fontSize={settings.fontSize}
							logoScale={settings.logoScale}
						/>
					{:else if settings.logoType === 'oldLogo'}
						<!-- Old obsidian logo -->
						<ObsidianOld
							fontSize={settings.fontSize}
							logoScale={settings.logoScale}
						/>
					{:else if settings.logoType === 'lucideIcon' && !!settings.logo.lucideIcon}
						<IconLogo
							fontSize={settings.fontSize}
							logoScale={settings.logoScale}
							iconId={settings.logo.lucideIcon}
							color={
								settings.iconColorType === 'default' ?
									'currentColor'
									: settings.iconColorType === 'accentColor'
										? 'var(--interactive-accent)'
										: settings.iconColor ?? ''
							}
						/>
					{:else if settings.logoType === 'imagePath' && settings.logo.imagePath}
						<ImageLogo
							{app}
							fontSize={settings.fontSize}
							logoScale={settings.logoScale}
							pathOrLink={settings.logo.imagePath}
							asInternal={true}
						/>
					{:else if settings.logoType === 'imageLink' && settings.logo.imageLink}
						<ImageLogo
							{app}
							fontSize={settings.fontSize}
							logoScale={settings.logoScale}
							pathOrLink={settings.logo.imageLink}
							asInternal={false}
						/>
					{/if}
				</div>
			{/if}
			<div class='home-tab-wordmark'>
				<h1 style='
					font-family: {
						settings.customFont === 'interfaceFont'
							? 'var(--interface-font)'
							: settings.customFont === 'textFont'
								? 'var(--font-text)'
								: settings.customFont === 'monospaceFont'
									? 'var(--font-monospace)'
									: settings.font
					};
					font-size: {settings.fontSize};
					font-weight: {settings.fontWeight.toString()};
					color: {
						settings.fontColorType === 'default'
							? '' : settings.fontColorType === 'accentColor'
								? 'var(--interactive-accent)' : settings.fontColor
					};
				'>
					{settings.wordmark}
				</h1>
			</div>
		</div>
	{/if}
	
	<SearchBar {searchBarHandler} embedded={embeddedView && true}/>

	<div class='home-tab-shelf-header'>
		{#if embeddedView?.bookmarkedFiles ?? settings.showBookmarkedFiles}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class='home-tab-shelf-header-button {settings.lastFileShelf == 'bookmarks' ? 'is-active' : ''}'
				onclick={() => {
					plugin.settings.lastFileShelf = settings.lastFileShelf =
						settings.lastFileShelf == 'bookmarks'
							? null
							: 'bookmarks';
				}}
				aria-label={`${settings.lastFileShelf == 'bookmarks' ? 'Hide' : 'Show'} bookmarked files`}
			>
				<div class='home-tab-shelf-header-icon'><Bookmark/></div>
				<div class='home-tab-shelf-header-label'>Bookmarks</div>
			</div>
		{/if}
		{#if embeddedView?.recentFiles ?? settings.showRecentFiles}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class='home-tab-shelf-header-button {settings.lastFileShelf == 'recents' ? 'is-active' : ''}'
				onclick={() => {
					plugin.settings.lastFileShelf = settings.lastFileShelf =
						settings.lastFileShelf == 'recents'
							? null
							: 'recents';
				}}
				aria-label={`${settings.lastFileShelf == 'recents' ? 'Hide' : 'Show'} recent files`}
			>
				<div class='home-tab-shelf-header-icon'><History/></div>
				<div class='home-tab-shelf-header-label'>Recent</div>
			</div>
		{/if}
	</div>

	{#if
		settings.lastFileShelf == 'bookmarks' &&
		(embeddedView?.bookmarkedFiles ?? settings.showBookmarkedFiles) &&
		bookmarkedFileList.length
	}
		<BookmarkShelf {view} files={$bookmarkedFileStore} {settings} manager={plugin.bookmarkedFileManager}/>
	{/if}

	{#if
		settings.lastFileShelf == 'recents' &&
		(embeddedView?.recentFiles ?? settings.showRecentFiles) &&
		recentFileList.length
	}
		<RecentFileShelf {view} files={$recentFileStore} {settings} manager={plugin.recentFileManager}/>
	{/if}
</main>