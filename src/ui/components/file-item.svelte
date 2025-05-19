<script lang='ts'>
	import { MoreHorizontal, File } from 'lucide-svelte';
	import { App, debounce, Keymap, Menu, Platform, type EventRef, type PaneType, type TFile } from 'obsidian';
	import { NON_ASCII_RE } from 'src/data/regexps';
	import type { HomeTabSettings } from 'src/settings/settings-config';
	import { getFileIcon, getFileIconDesc } from 'src/utils/component-utils';
	import { onDestroy, onMount } from 'svelte';
	import type { HomeTabEmbed, HomeTabView } from '../view';
	import { getBaseColorVariable } from 'src/utils/style-utils';

	interface FileItemCompProps {
		app: App;
		view: HomeTabEmbed | HomeTabView;
		file: TFile;
		settings: HomeTabSettings;
		contextMenu: Menu;
		itemMenu: (file: TFile) => void;
	}

	let {
		app,
		view,
		file,
		settings,
		contextMenu,
		itemMenu
	}: FileItemCompProps = $props();

	let filename = file.basename,
		useIconic = $state(settings.useIconic && isIconicEnabled()),
		iconDesc = $state(getFileIconDesc(app, file, useIconic)),
		iconSvg = $state(getFileIcon(app, file, {}, useIconic)),
		fileItemEl: HTMLElement;

	let iconRefreshEventRefs: EventRef | undefined;

	function handleFileOpening(file: TFile, newTab?: boolean | PaneType) {
		let leaf = app.workspace.getLeaf(newTab);
		leaf.openFile(file);
	}

	function handleMouseClick(evt: MouseEvent, file: TFile): void {
		if ((evt.target as HTMLElement).classList.contains('home-tab-file-item-remove_btn')) return
		else if (evt.button != 2)
			handleFileOpening(file, Keymap.isModEvent(evt));
	}

	function isIconicEnabled(): boolean {
		return !!app.plugins.getPlugin('iconic');
	}

	function updateIcon(): boolean {
		let newIconDesc = getFileIconDesc(app, file, useIconic);
		if (
			iconDesc?.iconId === newIconDesc?.iconId &&
			iconDesc?.color === newIconDesc?.color
		) return false;

		iconDesc = newIconDesc;
		iconSvg = getFileIcon(app, file, {}, useIconic);
		return true;
	}

	function onCtxMenu(evt: MouseEvent): void {
		contextMenu.showAtMouseEvent(evt);
		itemMenu(file);
	}

	onMount(async () => {
		// iOS webview doesn't have support to contextmenu event yet
		if (!Platform.isIosApp)
			fileItemEl.addEventListener('contextmenu', onCtxMenu);
		
		if (Platform.isDesktop) {
			app.dragManager.handleDrag(fileItemEl, evt => {
				let link = app.getObsidianUrl(file),
					{ dataTransfer } = evt;
				
				if (dataTransfer) {
					dataTransfer.setData('text/plain', link);
					dataTransfer.setData('text/uri-list', link);
				}

				debounce(() => {
					let ghostIconSvg = app.dragManager.ghostEl?.querySelector('svg');
					let color = iconDesc?.color && getBaseColorVariable(iconDesc.color) || 'currentColor';
					if (ghostIconSvg) ghostIconSvg.setAttr('stroke', color);
				})();

				return {
					file,
					icon: iconDesc?.iconId ?? 'file',
					title: `${NON_ASCII_RE.test(iconDesc?.iconId ?? '') ? iconDesc?.iconId + ' ' : ''}${file.getShortName()}`,
					type: 'file',
					source: 'home-tab'
				};
			});
		}

		iconRefreshEventRefs = app.workspace.on(
			'iconic:icons-refresh',
			async () => updateIcon()
		);
	});

	onDestroy(() => {
		if (iconRefreshEventRefs)
			app.workspace.offref(iconRefreshEventRefs);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class='home-tab-file-item'
	class:use-accent-color='{settings.selectionHighlight === 'accentColor'}'
	aria-label={`${filename}.${file.extension}`}
	onclick={evt => {
		evt.preventDefault();
		handleMouseClick(evt, file);
	}}
	bind:this={fileItemEl}
>
	
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class='home-tab-file-item-remove_btn'
		aria-label='File options'
		onclick={onCtxMenu}
	>
		<MoreHorizontal
			strokeWidth={1}
			size={24}
			stroke='var(--text-muted)'
			class='svg-icon lucide-x'
		/>
	</div>

	<div class='home-tab-file-item-preview-icon'>
		{#if iconSvg}
			{@html iconSvg.outerHTML}
		{:else if NON_ASCII_RE.test(iconDesc?.iconId ?? '')}
			<div class='home-tab-file-item-emoji-icon'>{iconDesc?.iconId}</div>
		{:else}
			<File
				strokeWidth={1.75}
				size={24}
				stroke='var(--text-muted)'
			/>
		{/if}
		{#if file.extension !== 'md'}
			<div class='home-tab-file-item-file-tag nav-file-tag'>{file.extension}</div>
		{/if}
	</div>
	<div class='home-tab-file-item-name'>
		{filename}
	</div>
</div>