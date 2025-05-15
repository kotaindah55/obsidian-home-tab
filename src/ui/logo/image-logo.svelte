<script lang='ts'>
	import { normalizePath, type App } from 'obsidian';

	interface IconLogoProps {
		app: App;
		pathOrLink: string;
		fontSize: string;
		logoScale: number;
		asInternal: boolean;
	}

	let {
		app,
		pathOrLink,
		fontSize,
		logoScale,
		asInternal
	}: IconLogoProps = $props();

	let resolvedURI = asInternal
		? app.vault.adapter.getResourcePath(normalizePath(pathOrLink))
		: pathOrLink;
</script>

<img
	src='{resolvedURI}'
	alt='home-tab-logo'
	style='
		max-width: calc({fontSize}*{logoScale});
		max-height: calc({fontSize}*{logoScale});
	'
>