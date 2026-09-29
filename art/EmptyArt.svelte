<script module lang="ts">
	/** One composition per app section. */
	export type EmptyArtName = 'bookings' | 'units' | 'catalog' | 'chats' | 'notifications' | 'flows';
</script>

<script lang="ts">
	let {
		name,
		animated = true,
		class: className = ''
	}: {
		name: EmptyArtName;
		/** Slow ambient motion. Always off under `prefers-reduced-motion`. */
		animated?: boolean;
		class?: string;
	} = $props();

	// Filter ids must be unique per instance — two arts on one page would
	// otherwise share (and fight over) the same <filter>.
	const uid = $props.id();
	const grainId = `empty-grain-${uid}`;
	// Moving layers skip the grain while animating (see the layers below).
	const motionFilter = $derived(animated ? undefined : `url(#${grainId})`);

	// Units: 3×4 window grid. `lit` windows glow amber, `flicker` ones fade
	// in and out on staggered delays so the building feels inhabited.
	const windowCols = [120, 144, 168];
	const windowRows = [80, 104, 128, 152];
	const litWindows = new Set(['0-0', '1-0', '2-0', '2-1', '0-2']);
	const flickerWindows: Record<string, string> = { '1-2': '0s', '2-3': '-2.6s', '0-1': '-5.2s' };

	// Catalog: three overlapping circles on a 22px orbit, 120° apart.
	const orbit = [
		{ cx: 172, cy: 100, tone: 'primary' },
		{ cx: 139, cy: 80.95, tone: 'secondary' },
		{ cx: 139, cy: 119.05, tone: 'muted' }
	];
</script>

<!--
	Paper-cut compositions built from the logo's shapes (arch, keyhole) plus
	per-section motifs. All colours come from theme tokens, so dark mode works
	without extra assets. viewBox is 300×200; size it with `class`.
-->
<svg
	class="empty-art {className}"
	class:animated
	viewBox="0 0 300 200"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<filter id={grainId} x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
			<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0 0 0 -0.22" result="grain" />
			<feComposite in="grain" in2="SourceGraphic" operator="in" result="grainOnShapes" />
			<feMerge>
				<feMergeNode in="SourceGraphic" />
				<feMergeNode in="grainOnShapes" />
			</feMerge>
		</filter>
	</defs>

	<ellipse class="ink" cx="150" cy="172" rx="68" ry="11" opacity="0.07" />

	<!--
		Three layers so the grain filter never sits on something that moves: a
		filtered group is re-rasterised (fractal noise and all) on every animation
		frame. Moving shapes get grain only in the static frame (section thumbnail).
		Back / front keep the original stacking order.
	-->
	<g filter={motionFilter}>
		{#if name === 'bookings'}
			<circle class="secondary bob" cx="184" cy="80" r="30" />
		{:else if name === 'units'}
			<circle class="primary bob bob-slow" cx="190" cy="56" r="22" />
		{:else if name === 'catalog'}
			<g class="spin">
				{#each orbit as c (c.tone)}
					<circle class={c.tone} cx={c.cx} cy={c.cy} r="38" opacity="0.72" />
				{/each}
			</g>
		{:else if name === 'notifications'}
			{#each ['0s', '-1.83s', '-3.67s'] as delay (delay)}
				<circle
					class="ring"
					style:animation-delay={delay}
					cx="150"
					cy="100"
					r="80"
					stroke-width="2.4"
					vector-effect="non-scaling-stroke"
				/>
			{/each}
		{/if}
	</g>

	<g filter="url(#{grainId})">
		{#if name === 'bookings'}
			<path class="primary" d="M102 172V92a44 44 0 0 1 88 0v80z" />
			<path class="paper" d="M122 172v-56a24 24 0 0 1 48 0v56z" />
			<circle class="ink" cx="146" cy="116" r="5.6" opacity="0.85" />
			<rect class="ink" x="144.2" y="118" width="3.6" height="16" rx="1.2" opacity="0.85" />
		{:else if name === 'units'}
			<rect class="ink" x="104" y="52" width="80" height="120" rx="6" opacity="0.92" />
			{#each windowCols as cx, i (cx)}
				{#each windowRows as cy, j (cy)}
					<rect class="paper" x={cx - 7} y={cy - 7} width="14" height="14" rx="1.6" />
					{#if litWindows.has(`${i}-${j}`)}
						<rect class="secondary" x={cx - 7} y={cy - 7} width="14" height="14" rx="1.6" />
					{/if}
				{/each}
			{/each}
		{:else if name === 'chats'}
			<g class="primary">
				<rect x="86" y="58" width="96" height="44" rx="18" />
				<circle cx="96" cy="106" r="8" />
			</g>
			<g class="ink" opacity="0.9">
				<rect x="130" y="112" width="80" height="36" rx="16" />
				<circle cx="202" cy="152" r="7" />
			</g>
		{:else if name === 'notifications'}
			<circle class="secondary" cx="150" cy="100" r="20" />
			<g class="ink" opacity="0.9">
				<path d="M142 109V97a8 8 0 0 1 16 0v12z" />
				<rect x="138" y="105.4" width="24" height="3.2" rx="1.2" />
			</g>
		{:else if name === 'flows'}
			<path class="line" d="M98 76L150 120L202 72" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
			<rect class="primary" x="80" y="62" width="36" height="28" rx="5" />
			<rect class="ink" x="132" y="106" width="36" height="28" rx="5" opacity="0.9" />
			<rect class="secondary" x="184" y="58" width="36" height="28" rx="5" />
		{/if}
	</g>

	<g filter={motionFilter}>
		{#if name === 'units'}
			{#each windowCols as cx, i (cx)}
				{#each windowRows as cy, j (cy)}
					{@const key = `${i}-${j}`}
					{#if flickerWindows[key]}
						<rect
							class="secondary flicker"
							style:animation-delay={flickerWindows[key]}
							x={cx - 7}
							y={cy - 7}
							width="14"
							height="14"
							rx="1.6"
						/>
					{/if}
				{/each}
			{/each}
		{:else if name === 'catalog'}
			<circle class="paper" cx="150" cy="100" r="7" />
		{:else if name === 'chats'}
			<circle class="paper typing" cx="118" cy="80" r="4.4" />
			<circle class="paper typing" style:animation-delay="0.2s" cx="134" cy="80" r="4.4" />
			<circle class="paper typing" style:animation-delay="0.4s" cx="150" cy="80" r="4.4" />
		{:else if name === 'notifications'}
			<circle class="ink swing" cx="150" cy="111" r="2.6" opacity="0.9" />
		{:else if name === 'flows'}
			<circle class="paper travel" r="3.6" />
		{/if}
	</g>
</svg>

<style>
	.empty-art {
		display: block;
		overflow: visible;
	}

	/* Palette — theme tokens from app.css, so `.light` / dark just work. */
	.primary {
		fill: var(--accent-deep);
	}
	.secondary {
		fill: var(--warning);
	}
	.ink {
		fill: var(--text-primary);
	}
	.paper {
		fill: var(--nav-active-bg);
	}
	.muted {
		fill: color-mix(in srgb, var(--text-primary) 55%, var(--nav-active-bg));
	}
	.ring {
		fill: none;
		stroke: var(--accent-deep);
		opacity: 0;
		transform: scale(0.2);
	}
	.line {
		fill: none;
		stroke: var(--text-primary);
		opacity: 0.45;
	}
	.travel {
		offset-path: path('M98 76L150 120L202 72');
		offset-distance: 0%;
		offset-rotate: 0deg;
	}

	/* SVG transforms need an explicit box/origin to rotate or scale in place. */
	.spin,
	.ring {
		transform-box: view-box;
		transform-origin: 150px 100px;
	}
	.typing,
	.swing {
		transform-box: fill-box;
		transform-origin: center;
	}

	/* Static frame (animated={false} or reduced motion): rings rest mid-pulse. */
	.empty-art:not(.animated) .ring {
		opacity: 0.35;
		transform: scale(0.55);
	}

	.animated .bob {
		animation: bob 10s ease-in-out infinite alternate;
	}
	.animated .bob-slow {
		animation-duration: 12.5s;
	}
	.animated .flicker {
		animation: flicker 7.8s steps(1, end) infinite;
	}
	.animated .spin {
		animation: spin 42s linear infinite;
	}
	.animated .typing {
		animation: typing 1.4s ease-in-out infinite;
	}
	.animated .ring {
		animation: ripple 5.5s linear infinite;
	}
	.animated .swing {
		animation: swing 2s ease-in-out infinite alternate;
	}
	.animated .travel {
		animation: travel 4s linear infinite;
	}

	@keyframes bob {
		from {
			transform: translateY(-5px);
		}
		to {
			transform: translateY(5px);
		}
	}
	@keyframes flicker {
		0%,
		60% {
			opacity: 1;
		}
		61%,
		100% {
			opacity: 0;
		}
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes typing {
		0%,
		60%,
		100% {
			transform: scale(1);
		}
		30% {
			transform: scale(1.35);
		}
	}
	@keyframes ripple {
		from {
			opacity: 0.8;
			transform: scale(0.2);
		}
		to {
			opacity: 0;
			transform: scale(1);
		}
	}
	@keyframes swing {
		from {
			transform: translateX(-1.6px);
		}
		to {
			transform: translateX(1.6px);
		}
	}
	@keyframes travel {
		to {
			offset-distance: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animated * {
			animation: none !important;
		}
		.animated .ring {
			opacity: 0.35;
			transform: scale(0.55);
		}
	}
</style>
