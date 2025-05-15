<script lang="ts">
	import { getIcon } from "obsidian";

	interface IconLogoProps {
		iconId: string;
		fontSize: string;
		logoScale: number;
		color: string;
	}

	let {
		iconId,
		fontSize,
		logoScale,
		color = 'currentColor'
	}: IconLogoProps = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="calc({fontSize}*{logoScale})"
	height="calc({fontSize}*{logoScale})" 
	viewBox="0 0 24 24"
	fill="none" stroke="{color}" 
	stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
	class="svg-icon lucide-{iconId}"
>
	{@html getIcon(iconId)?.innerHTML}
</svg>