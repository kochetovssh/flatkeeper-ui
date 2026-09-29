<script lang="ts">
	/**
	 * One month of a check-in → check-out picker (pen «11» → Guest/
	 * CalendarMonth). Shared by the guest site and the host cabinet:
	 *
	 * - `variant="guest"` — cells under the finger (52 px), the night's price
	 *   under each date, the host's colour for the selection. With `night`,
	 *   the booking rules apply: booked dates are struck through, check-out
	 *   can land on the first booked day (the next guest arrives that
	 *   morning) but never past it, and the check-in's minimum stay mutes
	 *   the days too close to it.
	 * - `variant="cabinet"` — the cabinet's compact popover grid, no prices.
	 *
	 * The month to show and its arrows belong to the parent, so two months
	 * can sit side by side.
	 */
	import { addDays, bookable, checkoutRange, monthDays, monthTitle, todayISO, weekdays } from './calendar.js';
	import type { Night } from './calendar.js';

	interface Labels {
		prev: string;
		next: string;
		/** Under the check-out date: «выезд». */
		checkout: string;
		/** Appended to a booked date's name for screen readers: «занято». */
		booked?: string;
		/** Legend — shown when all three are given. */
		legendDates?: string;
		legendNights?: string;
		legendBooked?: string;
	}

	let {
		month,
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		night,
		min,
		max,
		maxNights = Infinity,
		variant = 'guest',
		locale,
		labels,
		preview = false,
		releasable = variant === 'guest',
		onprev,
		onnext,
		prevDisabled = false,
		nextDisabled = false,
		onpick,
		formatPrice
	}: {
		/** `YYYY-MM`. */
		month: string;
		checkIn?: string;
		checkOut?: string;
		/** Availability per night; without it every day in [min, max] is free. */
		night?: (iso: string) => Night | undefined;
		/** Days before `min` / after `max` are off (the past, a horizon). */
		min?: string;
		max?: string;
		/** Longest stay — check-out can't go further. */
		maxNights?: number;
		variant?: 'guest' | 'cabinet';
		locale: string;
		labels: Labels;
		/** Tint the range up to the hovered day while picking the check-out.
		 *  Cabinet variant only. */
		preview?: boolean;
		/** A second tap on the check-in lets it go (the guest site). Off in the
		 *  cabinet, where the old picker ignored it. */
		releasable?: boolean;
		/** Arrows are drawn only when their handler is given. */
		onprev?: () => void;
		onnext?: () => void;
		prevDisabled?: boolean;
		nextDisabled?: boolean;
		/** After every pick by the guest — never on a write from the parent. */
		onpick?: (checkIn: string, checkOut: string) => void;
		/** Price under the date, from minor units. Default: «8 200». */
		formatPrice?: (minor: number) => string;
	} = $props();

	const guest = $derived(variant === 'guest');
	/** Outlined in the cabinet grid, as before the shared component. */
	const today = todayISO();
	const days = $derived(monthDays(month));
	const names = $derived(weekdays(locale));
	const title = $derived(monthTitle(month, locale));
	const dayName = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' })
	);
	const priceFormat = $derived(new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }));
	const price = (minor: number) => formatPrice?.(minor) ?? priceFormat.format(minor / 100);

	/** Picking the check-out: the check-in is set, the check-out isn't. */
	const choosing = $derived(!!checkIn && !checkOut);
	const range = $derived(
		choosing && night ? checkoutRange(checkIn, night, maxNights) : null
	);
	const lastOut = $derived(
		choosing && !night && Number.isFinite(maxNights) ? addDays(checkIn, maxNights) : null
	);
	let hovered = $state('');

	type Kind =
		| 'off' // outside [min, max] — the past
		| 'free' // can be picked
		| 'booked' // struck through
		| 'unpriced' // free, but the host hasn't set a price
		| 'unknown' // not loaded yet
		| 'short' // closer to the check-in than its minimum stay
		| 'beyond'; // past the first booked night after the check-in

	interface Cell {
		iso: string;
		day: number;
		kind: Kind;
		/** The first booked day after the check-in — check-out only. */
		outOnly: boolean;
		isIn: boolean;
		isOut: boolean;
		isMid: boolean;
		inPreview: boolean;
		price: number | null;
		/** The price goes under a free date and under the selection. */
		showPrice: boolean;
	}

	function kindOf(iso: string): { kind: Kind; outOnly: boolean } {
		if ((min && iso < min) || (max && iso > max)) return { kind: 'off', outOnly: false };
		// The check-out may sit on the next guest's arrival day — still the selection.
		if (iso === checkOut && checkIn) return { kind: 'free', outOnly: false };
		const n = night?.(iso);
		if (choosing && iso > checkIn) {
			if (range) {
				if (iso < range.minOut) return { kind: 'short', outOnly: false };
				if (iso <= range.maxOut) return { kind: 'free', outOnly: !bookable(n) };
				return { kind: n && !n.available ? 'booked' : 'beyond', outOnly: false };
			}
			if (lastOut && iso > lastOut) return { kind: 'beyond', outOnly: false };
			return { kind: 'free', outOnly: false };
		}
		if (!night) return { kind: 'free', outOnly: false };
		if (!n) return { kind: 'unknown', outOnly: false };
		if (!n.available) return { kind: 'booked', outOnly: false };
		if (!bookable(n)) return { kind: 'unpriced', outOnly: false };
		return { kind: 'free', outOnly: false };
	}

	const cells = $derived.by<(Cell | null)[]>(() => {
		const previewTo = preview && choosing && hovered > checkIn ? hovered : '';
		return days.map((iso) => {
			if (!iso) return null;
			const { kind, outOnly } = kindOf(iso);
			const n = night?.(iso);
			const price = n && bookable(n) && !outOnly ? (n.price ?? null) : null;
			const isIn = iso === checkIn;
			const isOut = iso === checkOut;
			const isMid = !!checkIn && !!checkOut && iso > checkIn && iso < checkOut;
			return {
				iso,
				day: Number(iso.slice(8)),
				kind,
				outOnly,
				isIn,
				isOut,
				isMid,
				inPreview: !!previewTo && kind === 'free' && iso > checkIn && iso < previewTo,
				price,
				showPrice: !!price && (kind === 'free' || isIn || isOut || isMid)
			};
		});
	});

	function pick(iso: string) {
		if (choosing && iso === checkIn) {
			if (!releasable) return;
			// Second tap on the check-in lets it go.
			checkIn = '';
		} else if (choosing && iso > checkIn) {
			checkOut = iso;
		} else {
			checkIn = iso;
			checkOut = '';
		}
		hovered = '';
		onpick?.(checkIn, checkOut);
	}

	// ── Keyboard: one tab stop, arrows walk the free days ──────────────
	let grid: HTMLElement | undefined = $state();
	const enabled = $derived(cells.filter((c): c is Cell => !!c && c.kind === 'free'));
	/** The last focused day keeps the tab stop, so Tab leaves the grid. */
	let focused = $state('');
	const tabStop = $derived(
		(enabled.some((c) => c.iso === focused) ? focused : undefined) ??
			enabled.find((c) => c.isOut)?.iso ??
			enabled.find((c) => c.isIn)?.iso ??
			enabled[0]?.iso ??
			''
	);

	function onKey(e: KeyboardEvent) {
		const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
		const from = (e.target as HTMLElement).dataset.iso;
		if (!step || !from) return;
		e.preventDefault();
		const target = addDays(from, step);
		// The nearest free day in the direction of travel.
		const list = step > 0 ? enabled : [...enabled].reverse();
		const next = list.find((c) => (step > 0 ? c.iso >= target : c.iso <= target));
		if (next) grid?.querySelector<HTMLElement>(`[data-iso="${next.iso}"]`)?.focus();
	}

	function aria(c: Cell): string {
		const parts = [dayName.format(new Date(`${c.iso}T00:00:00Z`))];
		if (c.price !== null) parts.push(price(c.price));
		if (c.kind === 'booked' && labels.booked) parts.push(labels.booked);
		if ((c.outOnly || c.isOut) && labels.checkout) parts.push(labels.checkout);
		return parts.join(', ');
	}

	const legend = $derived(
		guest && labels.legendDates && labels.legendNights && labels.legendBooked
	);
</script>

<div class="flex flex-col {guest ? 'gap-2' : 'gap-1'}">
	<header class="flex items-center {guest ? 'min-h-10 pb-1' : 'mb-1'}">
		{#if onprev}
			<button
				type="button"
				class={guest ? 'nav-guest' : 'nav-cabinet'}
				aria-label={labels.prev}
				disabled={prevDisabled}
				onclick={onprev}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
			</button>
		{/if}
		<div
			class="flex-1 text-center {guest
				? 'font-serif text-20 text-text-primary'
				: 'font-mono text-12 text-text-primary'}"
			aria-live="polite"
		>
			{title}
		</div>
		{#if onnext}
			<button
				type="button"
				class={guest ? 'nav-guest' : 'nav-cabinet'}
				aria-label={labels.next}
				disabled={nextDisabled}
				onclick={onnext}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
			</button>
		{/if}
	</header>

	<div
		class="grid grid-cols-7 text-center font-mono uppercase text-text-muted {guest
			? 'text-11 font-semibold'
			: 'text-10'}"
		aria-hidden="true"
	>
		{#each names as name, i (i)}
			<span class="py-1">{name}</span>
		{/each}
	</div>

	<!-- No gaps: the check-in, the nights and the check-out read as one bar. -->
	<div class="grid grid-cols-7" bind:this={grid} role="group" aria-label={title}>
		{#each cells as c, i (c?.iso ?? `blank-${i}`)}
			{#if !c}
				<span class={guest ? 'h-[52px]' : 'h-8'}></span>
			{:else if guest}
				{@const end = c.isIn || c.isOut}
				<button
					type="button"
					data-iso={c.iso}
					tabindex={c.iso === tabStop ? 0 : -1}
					disabled={c.kind !== 'free'}
					aria-pressed={end}
					aria-label={aria(c)}
					class="cell group relative flex h-[52px] flex-col items-center justify-center gap-0.5 outline-none
						{end
						? 'rounded-lg bg-host-accent text-host-on-accent'
						: c.isMid
							? 'bg-host-accent-subtle'
							: 'rounded-lg'}"
					onclick={() => pick(c.iso)}
					onkeydown={onKey}
					onfocus={() => (focused = c.iso)}
					onmouseenter={() => (hovered = c.iso)}
					onmouseleave={() => hovered === c.iso && (hovered = '')}
				>
					<span
						class="text-15 leading-none {end
							? 'font-semibold'
							: c.kind === 'free'
								? 'font-medium text-text-primary'
								: 'font-medium text-text-muted'} {c.kind === 'booked'
							? 'line-through decoration-[1.5px]'
							: ''}"
					>
						{c.day}
					</span>
					{#if c.isOut || (c.outOnly && !c.isIn)}
						<span
							class="text-11 leading-none {c.isOut
								? ''
								: 'text-text-secondary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}"
						>
							{labels.checkout}
						</span>
					{:else if c.showPrice}
						<span class="price-cell {end ? 'text-host-on-accent' : ''}">{price(c.price ?? 0)}</span>
					{/if}
				</button>
			{:else}
				{@const col = i % 7}
				{@const bar = (c.isMid && c.kind !== 'off') || c.inPreview}
				<button
					type="button"
					data-iso={c.iso}
					tabindex={c.iso === tabStop ? 0 : -1}
					disabled={c.kind !== 'free'}
					aria-pressed={c.isIn || c.isOut}
					aria-label={aria(c)}
					class="h-8 cursor-pointer text-12 tabular-nums outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent-deep disabled:cursor-not-allowed disabled:text-text-muted/40
						{c.isIn && c.isOut
						? 'rounded-xs bg-accent-deep text-text-on-color'
						: c.isIn
							? `bg-accent-deep text-text-on-color ${checkOut ? 'rounded-l-xs' : 'rounded-xs'}`
							: c.isOut
								? 'rounded-r-xs bg-accent-deep text-text-on-color'
								: c.isMid && c.kind !== 'off'
									? 'bg-accent-deep/20 text-text-primary'
									: c.inPreview
										? 'bg-accent-deep/10 text-text-primary'
										: c.iso === today
											? 'rounded-xs border border-accent-deep/50 text-text-primary hover:bg-nav-active-bg'
											: 'rounded-xs text-text-primary hover:bg-nav-active-bg'}
						{(bar || c.isOut) && col === 0 ? 'rounded-l-xs' : ''} {(bar || (c.isIn && checkOut)) && col === 6 ? 'rounded-r-xs' : ''}"
					onclick={() => pick(c.iso)}
					onkeydown={onKey}
					onfocus={() => (focused = c.iso)}
					onmouseenter={() => (hovered = c.iso)}
					onmouseleave={() => hovered === c.iso && (hovered = '')}
				>
					{c.day}
				</button>
			{/if}
		{/each}
	</div>

	{#if legend}
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-13 text-text-secondary">
			<span class="flex items-center gap-1.5">
				<span class="size-2.5 rounded-xs bg-host-accent" aria-hidden="true"></span>
				{labels.legendDates}
			</span>
			<span class="flex items-center gap-1.5">
				<span class="size-2.5 rounded-xs bg-host-accent-subtle" aria-hidden="true"></span>
				{labels.legendNights}
			</span>
			<span class="flex items-center gap-1.5">
				<span class="text-text-muted line-through decoration-[1.5px]" aria-hidden="true">12</span>
				{labels.legendBooked}
			</span>
		</div>
	{/if}
</div>

<style>
	.nav-guest,
	.nav-cabinet {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		transition: background-color 150ms;
	}
	.nav-guest {
		width: 40px;
		height: 40px;
		border: 1px solid var(--stroke-default);
		border-radius: 9999px;
	}
	.nav-cabinet {
		width: 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
	}
	.nav-guest:hover:enabled,
	.nav-cabinet:hover:enabled {
		background-color: var(--bg-surface);
	}
	.nav-guest:disabled,
	.nav-cabinet:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.nav-guest:focus-visible,
	.nav-cabinet:focus-visible {
		outline: 2px solid var(--host-ink);
		outline-offset: 2px;
	}
	svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	/* Hover and keyboard focus: the host's colour around a free date. */
	.cell:enabled {
		cursor: pointer;
	}
	.cell:enabled:hover,
	.cell:focus-visible {
		box-shadow: inset 0 0 0 1.5px var(--host-ink);
		border-radius: var(--radius-lg);
	}
</style>
