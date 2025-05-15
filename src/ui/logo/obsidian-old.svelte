<script lang="ts">
	interface ObsidianLogoProps {
		fontSize: string;
		logoScale: number;
	}

	let { fontSize, logoScale }: ObsidianLogoProps = $props();

	const GRADIENT_UNIQUE_ID = Math.floor(Math.random() * 10e6).toString(16);
</script>

<svg
	viewBox="0 0 65 100"
	width="calc({fontSize}*{logoScale})"
	height="calc({fontSize}*{logoScale})"
>
	<defs>
		<!-- If gradient id is not unique the logo is not rendered correctly -->
		<linearGradient
			id={GRADIENT_UNIQUE_ID}
			x1="82.85"
			y1="30.41"
			x2="51.26"
			y2="105.9"
			gradientTransform="matrix(1, 0, 0, -1, -22.41, 110.97)"
			gradientUnits="userSpaceOnUse"
		>
			<stop offset="0" stop-color="#6c56cc" />
			<stop offset="1" stop-color="#9785e5" />
		</linearGradient>
	</defs>
	<polygon
		points="44.61 0 12.91 17.52 0 45.45 19.57 90.47 47.35 100 52.44 89.8 63 26.39 44.61 0"
		fill="#34208c"
	/>
	<polygon
		points="63 26.39 43.44 14.41 16.43 35.7 47.35 100 52.44 89.8 63 26.39"
		fill="url(#{GRADIENT_UNIQUE_ID})"
	/>
	<polygon
		points="63 26.39 63 26.39 44.61 0 43.44 14.41 63 26.39"
		fill="#af9ff4"
	/>
	<polygon
		points="43.44 14.41 44.61 0 12.91 17.52 16.43 35.7 43.44 14.41"
		fill="#4a37a0"
	/>
	<polygon
		points="16.43 35.7 19.57 90.47 47.35 100 16.43 35.7"
		fill="#4a37a0"
	/>
</svg>