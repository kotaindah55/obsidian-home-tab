<script lang="ts">
	import { Platform, TFile, TFolder } from "obsidian";
	import { onMount } from 'svelte';
	import type { SearchBarHandler } from "./searchbar-handler";
	import { FilterType } from "src/data/filter";
	import { getFilePathFromObsidianURI } from "src/utils/uri-utils";
	import { pickFileName } from "src/utils/file-utils";
	
	interface SearchBarProps {
		searchBarHandler: SearchBarHandler;
		embedded?: boolean;
	}

	let { searchBarHandler, embedded = false }: SearchBarProps = $props(),
		inputValue = $state('');

	const searchBarEl = searchBarHandler.searchBarEl;
	const activeExtEl = searchBarHandler.activeExtEl;
	const container = searchBarHandler.suggestionContainerEl;
	const isPhone = Platform.isPhone;

	onMount(() => {
		if (!$searchBarEl) return;

		let { app } = searchBarHandler;
		searchBarHandler.load();
		if (!Platform.isMobile) searchBarHandler.setFocus();

		app.dragManager.handleDrop($searchBarEl, (evt, draggable, isOver) => {
			let file = draggable?.file || draggable?.files?.[0],
				filepath = file?.path,
				filename = file?.name,
				transferredText = evt.dataTransfer?.getData('text');

			if (file instanceof TFile)
				filename = file.basename;
			else if (!file && transferredText) {
				filepath = getFilePathFromObsidianURI(app, transferredText) ?? undefined;
				filename = pickFileName(filepath ?? '');
				if (filepath)
					file = app.vault.getAbstractFileByPath(filepath) ?? undefined;
			}

			if (!isOver && (filename || transferredText)) {
				searchBarHandler.suggester?.setInput($searchBarEl.value + (
					filename ?? transferredText
				));
			}

			if (file) return {
				dropEffect: 'copy',
				action: `Paste ${file instanceof TFolder ? 'folder' : 'file'} name`
			}
			else return null;
		}, true);
	});

	function handleKeydown(evt: KeyboardEvent): void {
		// If the input field is empty and a filter is active remove it
		if (
			evt.key === 'Backspace' &&
			!inputValue &&
			searchBarHandler.activeFilter.type !== FilterType.DEFAULT
		) {
			searchBarHandler.updateActiveSuggester('default');
		}

		if (evt.key === 'Tab') {
			evt.preventDefault()
			let key = inputValue.toLowerCase();
			// Activate search filter with tab
			searchBarHandler.updateActiveSuggester(key);
		}
	}

</script>

<div class="home-tab-searchbar-container" bind:this={$container}>
	<div 
		class="home-tab-searchbar"
		class:embedded={embedded}
		style:width={embedded || isPhone ? "90%" : "50%"}
	>
		<div class='nav-file-tag home-tab-suggestion-file-tag hide' bind:this={$activeExtEl}></div>
		<input
			type="search" spellcheck="false" placeholder="Type to search..."
			bind:value={inputValue} bind:this={$searchBarEl}
			onkeydown={evt => handleKeydown(evt)}
		>
	</div>
</div>