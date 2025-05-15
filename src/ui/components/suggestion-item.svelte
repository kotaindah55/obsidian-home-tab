<script lang="ts">
	import type { SuggestionSource, TextInputSuggester } from "src/core/suggester";
	import type { Snippet } from "svelte";

	interface SuggestionItemProps {
		index: number;
		suggester: TextInputSuggester<any>;
		selectedIndex: number;
		itemClass?: string;
		contentClass?: string;
		titleClass?: string;
		auxClass?: string;
		titleSnippet?: Snippet;
		extraContentSnippet?: Snippet;
		auxSnippet?: Snippet;
	}

	let {
		index,
		suggester,
		selectedIndex,
		itemClass,
		contentClass,
		titleClass,
		auxClass,
		titleSnippet,
		extraContentSnippet,
		auxSnippet
	}: SuggestionItemProps = $props();

	let source: SuggestionSource<any> = suggester.getSuggester();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="{itemClass ?? 'suggestion-item mod-complex'}" 
	class:is-selected="{selectedIndex === index}"
	onmousemove="{() => source.setSelectedIndex(index)}"
	onclick="{() => suggester.useSelectedItem(source.getSelected())}"
	onauxclick="{evt => {
		if (evt.button === 1) suggester.useSelectedItem(source.getSelected(), true)
	}}"
>

	<div class="{contentClass ?? 'suggestion-content'}">
		<div class="{titleClass ?? 'suggestion-title'}">
			{@render titleSnippet?.()}
		</div>
		{@render extraContentSnippet?.()}
	</div>

	<div class="{auxClass ?? 'suggestion-aux'}">
		{@render auxSnippet?.()}
	</div>
</div>