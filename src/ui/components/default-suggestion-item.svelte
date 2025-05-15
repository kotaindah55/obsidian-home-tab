<script lang='ts'>
	import { FilePlus, FileQuestion, Forward, Folder, Hash } from 'lucide-svelte';
	import type { SearchFile } from 'src/model/search-file';
	import type { TextInputSuggester } from 'src/core/suggester';
	import SuggestionItem from 'src/ui/components/suggestion-item.svelte';

	interface DefaultSuggestionItemProps {
		index: number;
		suggester: TextInputSuggester<SearchFile>;
		selectedIndex: number;
		searchFile: SearchFile;
		displayName: string;
		filePath?: string | undefined;
		matchedHeading?: string | undefined;
	}

	let {
		index,
		suggester,
		selectedIndex,
		searchFile,
		displayName,
		filePath = undefined,
		matchedHeading = undefined
	}: DefaultSuggestionItemProps = $props();
</script>

<SuggestionItem
	{index} {suggester} {selectedIndex}
	titleClass={`suggestion-title home-tab-suggestion-title ${searchFile.isUnresolved ? 'is-unresolved' : ''}`}
>

	<!-- File name (or alias) -->
	{#snippet titleSnippet()}
		<span>{displayName}</span>
		{#if searchFile.fileType != 'markdown' && !searchFile.isWebUrl}
			<div class='nav-file-tag home-tab-suggestion-file-tag'>
				{searchFile.extension}
			</div>
		{/if}
	{/snippet}

	<!-- File details -->
	{#snippet extraContentSnippet()}
		{#if searchFile.isCreated}
			<!-- If the suggestion name is an alias display the actual filename under it -->
			{#if searchFile.aliases && searchFile.aliases?.includes(displayName)}
				<div class='home-tab-suggestion-description'>
					<Forward size={15} aria-label={'Alias of'}/>
					<span>{searchFile.basename}</span>
				</div>
			{/if}
			<!-- If the match is from a heading -->
			{#if matchedHeading}
				<div class='home-tab-suggestion-description'>
					<Hash size={15} aria-label={'Heading'}/>
					<span>{matchedHeading}</span>
				</div>
			{/if}
		{/if}
	{/snippet}

	{#snippet auxSnippet()}
		<!-- Display if a file is not created -->
		{#if (!searchFile.isCreated)}
			<div class='home-tab-suggestion-tip'>
				{#if searchFile.isUnresolved}
					<FilePlus size={15} aria-label={'Not created yet, select to create'}/>
				{:else}
					<FileQuestion size={15} aria-label={'Non exists yet, select to create'}/>
					<div class='suggestion-hotkey'>
						<span>Enter to create</span>
					</div>
				{/if}
			</div>
		{:else if ((searchFile.isCreated || searchFile.isUnresolved) && filePath)}
			<div class='home-tab-suggestion-filepath' aria-label='File path'>
				<Folder size={15}/>
				<span class='home-tab-file-path'>{filePath}</span>
			</div>
		{/if}
	{/snippet}
</SuggestionItem>