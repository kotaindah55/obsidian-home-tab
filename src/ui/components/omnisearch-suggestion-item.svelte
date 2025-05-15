<script lang='ts'>
	import { FolderOpen, File } from 'lucide-svelte';
	import { getExtensionFromFilename, pickParentPath } from 'src/utils/file-utils';
	import SuggestionItem from 'src/ui/components/suggestion-item.svelte';
	import type { ResultNoteApi } from 'src/typings/omnisearch';
	import { getFileIcon, getFileIconDesc } from 'src/utils/component-utils';
	import type { OmnisearchSuggester } from 'src/ui/suggester-handler/omnisearch-suggester';
	import { isIconicEnabled } from 'src/utils/plugin-utils';
	import { settingsStore } from 'src/store';
	import { NON_ASCII_RE } from 'src/data/regexps';

	interface OmnisearchSuggestionItemProps {
		index: number;
		suggester: OmnisearchSuggester;
		selectedIndex: number;
		displayName: string;
		suggestion: ResultNoteApi;
		excerpt: string;
	}

	let {
		index,
		suggester,
		selectedIndex,
		displayName,
		suggestion,
		excerpt
	}: OmnisearchSuggestionItemProps = $props();

	let app = suggester.app,
		fileExtension = getExtensionFromFilename(suggestion.path),
		folderPath = pickParentPath(suggestion.path) ?? '';
	
	let useIconic = $state($settingsStore.useIconic && isIconicEnabled(app)),
		iconDesc = $state(getFileIconDesc(app, suggestion.path, useIconic)),
		iconSvg = $state(getFileIcon(app, suggestion.path, { size: 16 }, useIconic));

</script>

<SuggestionItem
	{index} {suggester} {selectedIndex}
	itemClass={'suggestion-item omnisearch-result'}
	contentClass={''}
	titleClass={'omnisearch-result__title-container'}
>

	{#snippet titleSnippet()}
		<span class='omnisearch-result__title'>
			<span>
				{#if iconSvg}
					{@html iconSvg.outerHTML}
				{:else if NON_ASCII_RE.test(iconDesc?.iconId ?? '')}
					<div class='home-tab-file-item-emoji-icon'>{iconDesc?.iconId}</div>
				{:else}
					<File
						strokeWidth={1.75}
						height={16}
						width={16}
						stroke='var(--text-muted)'
						class='svg-icon lucide-file'
					/>
				{/if}
			</span>
			<!-- <span>{suggestion.basename}</span> -->
			<span>{@html displayName}</span>
			<span class='omnisearch-result__extension'>{`.${fileExtension}`}</span>
			{#if suggestion.matches.length > 0}
				<span class='omnisearch-result__counter'>{`${suggestion.matches.length} match${suggestion.matches.length > 1 ? 'es' : ''}`}</span>
			{/if}
		</span>
	{/snippet}

	{#snippet extraContentSnippet()}
		<!-- File path -->
		{#if folderPath.length > 0}
			<div class='omnisearch-result__folder-path'>
				<FolderOpen size={15}/>
				<span>{folderPath}</span>
			</div>
		{/if}
		<!-- File content -->
		<div class='omnisearch-result__body'>
			{@html excerpt}
		</div>
	{/snippet}
</SuggestionItem>