<script lang="ts">
	import { quintOut } from 'svelte/easing'
	import { slide } from 'svelte/transition'
	import type {
		SuggesterViewOptions,
		SuggestionSource,
		TextInputSuggester
	} from 'src/core/suggester';
	import { onDestroy } from 'svelte';

	interface SuggestionResultProps {
		options: SuggesterViewOptions;
		suggester: TextInputSuggester<unknown>;
	}

	let { options, suggester }: SuggestionResultProps = $props(),
		items: unknown[] = $state<unknown[]>([]),
		source: SuggestionSource<unknown> = suggester.getSuggester(),
		selectedIndex: number | undefined = $state(),
		prevAmount = 0;

	let sourceContract = source.sourceStore.subscribe(newItems => {
			newItems ??= [];
			if (newItems.length !== prevAmount) {
				prevAmount = newItems.length;
				items = newItems;
			}
		}),
		selectedIndexContract = source.selectedIndexStore.subscribe(value => selectedIndex = value);
	
	const suggestionWrapper = source.containerEl;

	onDestroy(() => {
		// Unsubscribe store contracts when this component is going to be detached.
		sourceContract();
		selectedIndexContract();
	});
</script>

{#if items?.length > 0}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="{options.containerClass ?? 'suggestion-container popover suggestion-popover'}" 
		onmousedown={(e) => e.preventDefault()}
		in:slide|global={{ duration:200, easing: quintOut }}
		out:slide={{ duration:200, easing: quintOut }}
	>
		<div
			class="{options.suggestionClass ?? 'suggestion'} {options.additionalClasses ?? ''}"
			class:scrollable="{options.isScrollable}"
			style="{options.style ?? ''}" bind:this={$suggestionWrapper}
		>
			{#each items as suggestion, index (index)}
				{@const SvelteComponent = suggester.getComponentType()}
				<SvelteComponent
					{index} {suggestion} {suggester} {selectedIndex}
					{...suggester.getComponentProps(suggestion)}
				/>
			{/each}
		</div>

		{#if options.additionalModalInfo}
			<div class="suggester-additional-info">
				{@html options.additionalModalInfo.outerHTML}
			</div>
		{/if}
	</div>
{/if}