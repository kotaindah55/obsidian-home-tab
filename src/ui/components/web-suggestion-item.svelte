<script lang="ts">
	import SuggestionItem from './suggestion-item.svelte';
	import type { TextInputSuggester } from 'src/core/suggester';
	import { Globe, Link, Search } from 'lucide-svelte';
	import type { LinkSearchFile, LinkType } from 'src/model/search-file';
	
	interface WebSuggestionItemProps {
		index: number;
		suggester: TextInputSuggester<LinkSearchFile>;
		selectedIndex: number;
		displayName: string;
		type: LinkType,
		url: string;
	}

	let {
		index,
		suggester,
		selectedIndex,
		displayName,
		type,
		url
	}: WebSuggestionItemProps = $props();
</script>

<SuggestionItem
	{index} {suggester} {selectedIndex}
	titleClass={`suggestion-title home-tab-suggestion-title`}
>
	<!-- Site name -->
	{#snippet titleSnippet()}
		{#if type === 'search'}
			<span>Search for <strong>{displayName}</strong></span>
		{:else if type === 'goto'}
			<span>Go to <strong>{displayName}</strong></span>
		{:else}
			<span>{displayName}</span>
		{/if}
		{#if type == 'bookmark'}
			<div class='nav-file-tag home-tab-suggestion-file-tag'>
				bookmark
			</div>
		{/if}
	{/snippet}

	<!-- Site details -->
	{#snippet extraContentSnippet()}
		<div class='home-tab-suggestion-description'>
			{#if type === 'search'}
				<Search size={15} aria-label={'Search'}/>
			{:else if type === 'goto'}
				<Globe size={15} aria-label={'Goto'}/>
			{:else}
				<Link size={15} aria-label={'Link'}/>
			{/if}
			<span>{url}</span>
		</div>
	{/snippet}
</SuggestionItem>