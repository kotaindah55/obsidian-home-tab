<script lang="ts">
	import { Platform } from "obsidian";
	import { onMount } from 'svelte';
	import type { SearchBarHandler } from "./searchbar-handler";
	import { FilterType } from "src/data/filter";
	
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
		if ($searchBarEl) {
			searchBarHandler.load();
			if (!Platform.isMobile)
				searchBarHandler.setFocus();
		}
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