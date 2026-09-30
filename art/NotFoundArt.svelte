<script module lang="ts">
	/**
	 * wide — the plate in the middle, the ghost to its right (desktop pages);
	 * compact — the ghost floating over the plate (phones);
	 * side — plate and ghost side by side, nothing centred (next to text, the
	 * landing). Proportions are the board's frames (pen «13» → Art/404,
	 * Art/404/Compact, Лэндинг · Art/404).
	 */
	export type NotFoundLayout = 'wide' | 'compact' | 'side';
</script>

<script lang="ts">
	/**
	 * The error scene (pen «13 · Страница 404»): an apartment plate and a paper
	 * ghost from the street's grammar — the flat is there, nobody lives in it.
	 *
	 * Plain CSS, no Tailwind — the landing uses it too. The plate takes
	 * `--plate` / `--plate-ink` (brass and ink by default; the host's accent on
	 * their site). Under `.dark` the ghost glows instead of casting a paper
	 * shadow.
	 *
	 * Motion (ghost.glsl, one seamless 4 s loop): the ghost bobs, its hem
	 * ripples, the floor shadow shrinks and fades while it's up, and it blinks
	 * once. The plate never moves. Only transforms and opacity animate, and the
	 * grain is a tiled image, not a filter — nothing is re-rasterised per frame
	 * beyond the ghost itself. Still under `prefers-reduced-motion`.
	 */
	let {
		layout = 'wide',
		code = '404',
		class: className = '',
		style
	}: {
		layout?: NotFoundLayout;
		/** Digits on the plate — the status code. */
		code?: string | number;
		class?: string;
		/** For `--plate` / `--plate-ink`. */
		style?: string;
	} = $props();

	const uid = $props.id();

	// ── Frames, in each layout's own units (the board's pixels) ───────────
	type Box = [x: number, y: number, w: number, h: number];
	const FRAMES: Record<NotFoundLayout, { w: number; h: number; plate: Box; ghost: Box }> = {
		wide: { w: 660, h: 340, plate: [260, 145, 140, 70], ghost: [428, 0, 260, 340] },
		compact: { w: 342, h: 400, plate: [101, 328, 140, 70], ghost: [78, 0, 240, 314] },
		side: { w: 558, h: 442, plate: [0, 190, 182, 91], ghost: [220, 0, 338, 442] }
	};
	const frame = $derived(FRAMES[layout]);
	/** A box as percentages of the frame, for absolute placement. */
	function place([x, y, w, h]: Box) {
		return `left:${(x / frame.w) * 100}%;top:${(y / frame.h) * 100}%;width:${(w / frame.w) * 100}%;height:${(h / frame.h) * 100}%`;
	}

	// ── The ghost (ghost.glsl), in a 260 × 340 frame ─────────────────────
	// The shader works in frame heights with y up; here it's SVG pixels.
	const W = 260;
	const H = 340;
	const X = (u: number) => W / 2 + u * H;
	const Y = (u: number) => H - u * H;
	const R = 0.26 * H; // arch radius
	const HX = X(-0.03);
	const HY = Y(0.66); // the head's centre
	const LEAN = 0.12; // the hem drifts right as the sheet goes down
	const HEM = Y(0.22);
	const WAVE = 0.045 * H; // scallop depth
	const LOBE = R / 2; // four scallops across the sheet
	const LOOK = -0.6; // towards the plate

	/** The sheet below the head, unsheared: from the head's line down to a
	 *  scalloped hem two lobes wider on each side, so it can slide sideways
	 *  (the ripple) and stay under the clip. */
	const sheet = (() => {
		const from = -R - 2 * LOBE;
		const to = R + 2 * LOBE;
		let d = `M${HX + from} ${HY - 1}H${HX + to}`;
		for (let xl = to; xl >= from - 0.01; xl -= 2) {
			const s = Math.abs(Math.sin((2 * Math.PI * (xl + R)) / R));
			d += `L${(HX + xl).toFixed(1)} ${(HEM + WAVE * s).toFixed(1)}`;
		}
		return d + 'Z';
	})();
	const eyes = [-1, 1].map((side) => ({ cx: HX + side * 0.085 * H + 0.035 * LOOK * H, cy: HY + 0.01 * H }));

	// ── The plate: 140 × 70, the code set in curves ──────────────────────
	/** Fraunces 700 (opsz 36, as the plate is set on the board) in curves, at
	 *  36 px: advance width and outline from the baseline. Curves, not text —
	 *  the plate reads the same on every site, fonts loaded or not. */
	const DIGITS: Record<string, { w: number; d: string }> = {
		'0': { w: 24.98, d: 'M12.6 -25.8Q16.1 -25.8 18.7 -24.2Q21.2 -22.7 22.5 -19.7Q23.8 -16.8 23.8 -12.5Q23.8 -8.5 22.4 -5.5Q21 -2.6 18.4 -1Q15.9 0.6 12.4 0.6Q8.8 0.6 6.3 -0.9Q3.8 -2.5 2.5 -5.5Q1.2 -8.4 1.2 -12.7Q1.2 -16.7 2.6 -19.7Q4 -22.6 6.6 -24.2Q9.1 -25.8 12.6 -25.8ZM16.8 -11.7Q16.8 -16.2 16.3 -18.9Q15.8 -21.7 14.8 -22.9Q13.8 -24.1 12.4 -24.1Q11 -24.1 10.1 -23Q9.1 -22 8.7 -19.6Q8.2 -17.3 8.2 -13.5Q8.2 -9 8.7 -6.3Q9.2 -3.5 10.2 -2.3Q11.2 -1.1 12.6 -1.1Q14 -1.1 14.9 -2.1Q15.8 -3.2 16.3 -5.6Q16.8 -7.9 16.8 -11.7Z' },
		'1': { w: 17.17, d: 'M2.8 -21.8 4.4 -21.8Q5 -21.8 5.2 -21.5Q5.5 -21.2 5.5 -20.5V-3.7Q5.5 -3.1 5.2 -2.7Q4.9 -2.4 4.4 -2.3L2.3 -1.9Q1.4 -1.7 1.4 -0.9Q1.4 -0.5 1.7 -0.2Q2 0 2.6 0H15.1Q15.6 0 15.9 -0.2Q16.1 -0.5 16.1 -0.9Q16.1 -1.7 15.3 -1.9L13.4 -2.3Q12.9 -2.4 12.7 -2.7Q12.4 -3.1 12.4 -3.7V-24.7Q12.4 -25.8 11.3 -25.8Q10.9 -25.8 10.6 -25.7Q10.3 -25.6 10 -25.4Q8.8 -24.6 7.7 -24.3Q6.5 -23.9 4.8 -23.9L2.8 -23.9Q2.2 -23.9 1.9 -23.6Q1.6 -23.3 1.6 -22.9Q1.6 -22.4 1.9 -22.1Q2.1 -21.8 2.8 -21.8Z' },
		'2': { w: 22.84, d: 'M4.4 -5.5 3.4 -6.3 7.2 -8.6Q9.3 -9.9 10.7 -11.3Q12 -12.7 12.7 -14.4Q13.4 -16.2 13.4 -18.4Q13.4 -20.6 13.1 -21.9Q12.7 -23.2 12.1 -23.8Q11.5 -24.4 10.6 -24.4Q9.3 -24.4 8.7 -23.5Q8.1 -22.5 8.1 -21V-18.7Q8.1 -17.2 7.3 -16.4Q6.4 -15.5 4.9 -15.5Q3.5 -15.5 2.6 -16.4Q1.8 -17.3 1.8 -18.9Q1.8 -20.7 2.8 -22.3Q3.9 -23.9 6 -24.8Q8.1 -25.8 11.4 -25.8Q14.5 -25.8 16.5 -24.9Q18.6 -24 19.6 -22.3Q20.6 -20.7 20.6 -18.7Q20.6 -16.8 19.6 -15.2Q18.6 -13.6 16.5 -12.1Q14.4 -10.5 11 -8.8ZM1.2 -2.7Q1.2 -4.7 2.8 -6Q4.4 -7.2 7.3 -7.2Q8.6 -7.2 9.8 -6.9Q11 -6.7 12.2 -6.4Q13.4 -6.1 14.6 -5.9Q15.8 -5.6 17 -5.6Q18.3 -5.6 19 -6.1Q19.8 -6.6 20.3 -7.8Q20.5 -8.1 20.8 -8.3Q21 -8.4 21.3 -8.4Q21.7 -8.4 21.9 -8.1Q22.1 -7.8 22 -7.1Q21.8 -4.3 21 -2.6Q20.2 -0.9 18.9 -0.1Q17.7 0.6 16 0.6Q14.6 0.6 13.5 0.2Q12.5 -0.2 11.7 -1.1Q10.9 -2.1 10.2 -3.7Q9.7 -4.5 9.4 -4.8Q9 -5.1 8.6 -5.1Q8.1 -5.1 7.8 -4.7Q7.5 -4.2 7.4 -3.1Q7.3 -1.7 6.9 -0.9Q6.5 -0.1 5.7 0.2Q5 0.6 4 0.6Q2.8 0.6 2 -0.3Q1.2 -1.2 1.2 -2.7Z' },
		'3': { w: 21.04, d: 'M9.6 -13.2 9.1 -13.7Q9.4 -13.7 9.7 -13.8Q10.1 -13.8 10.5 -13.9Q10.9 -13.9 11.3 -13.9Q14 -13.9 15.9 -13.1Q17.9 -12.3 19 -10.9Q20 -9.4 20 -7.3Q20 -4.9 18.8 -3.1Q17.6 -1.4 15.4 -0.4Q13.2 0.6 10.2 0.6Q7.3 0.6 5.3 -0.1Q3.3 -0.9 2.3 -2.2Q1.3 -3.5 1.3 -5.1Q1.3 -6.7 2.3 -7.6Q3.2 -8.6 4.6 -8.6Q6.1 -8.6 6.9 -7.8Q7.6 -7 7.6 -5.6V-3.7Q7.6 -2.5 8.3 -1.7Q9 -0.9 10.2 -0.9Q11.2 -0.9 12 -1.4Q12.7 -2 13.1 -3.2Q13.6 -4.4 13.6 -6.3Q13.6 -9.3 12.5 -10.6Q11.5 -11.9 9.5 -11.9H8.3Q7.8 -11.9 7.5 -12.2Q7.2 -12.4 7.2 -12.9Q7.2 -13.2 7.4 -13.5Q7.5 -13.8 8 -14.2L15.9 -21.7L16 -20H6.2Q5.6 -20 5.2 -19.8Q4.9 -19.6 4.7 -19L4.3 -17.3Q4.2 -16.9 3.9 -16.6Q3.6 -16.4 3.1 -16.4Q2.6 -16.4 2.3 -16.7Q2 -16.9 2.1 -17.5L2.7 -23.8Q2.8 -24.5 3.3 -24.8Q3.7 -25.2 4.5 -25.2H18.8Q19.6 -25.2 20 -25Q20.3 -24.8 20.3 -24.3Q20.3 -24 20.1 -23.6Q19.9 -23.3 19.2 -22.6Z' },
		'4': { w: 23.56, d: 'M11.6 -11.8Q11.6 -12.2 11.7 -12.5Q11.9 -12.8 12.1 -13L16.4 -16.9Q16.8 -17.3 17.1 -17.4Q17.3 -17.5 17.5 -17.5Q17.8 -17.5 18 -17.3Q18.2 -17.1 18.2 -16.7L18.2 -3.4Q18.2 -2.9 18.5 -2.6Q18.7 -2.4 19.2 -2.3L20.6 -1.9Q21 -1.7 21.3 -1.5Q21.5 -1.3 21.5 -0.9Q21.5 -0.5 21.2 -0.2Q20.9 0 20.3 0H9.3Q8.1 0 8.1 -0.9Q8.1 -1.6 9 -1.9L10.7 -2.3Q11.2 -2.4 11.4 -2.6Q11.6 -2.9 11.6 -3.4ZM8 -15.5Q8.8 -16.2 9.2 -16.8Q9.6 -17.5 9.6 -18.2Q9.6 -18.8 9.3 -19.3Q9.1 -19.8 8.8 -20.3Q8.5 -20.8 8.3 -21.4Q8 -22 8 -22.8Q8 -23.8 8.5 -24.6Q9 -25.4 10 -25.8Q11 -26.3 12.4 -26.3Q14.2 -26.3 15.3 -25.4Q16.3 -24.5 16.3 -22.9Q16.3 -22.1 16.1 -21.4Q15.8 -20.6 15.1 -19.6Q14.3 -18.7 12.9 -17.3L2.5 -7.2L2.2 -8.1H20.9Q21.5 -8.1 21.8 -7.9Q22.1 -7.7 22.1 -7.2Q22.1 -6.3 20.9 -6.3H1.8Q1.2 -6.3 0.8 -6.6Q0.5 -6.9 0.5 -7.4Q0.5 -7.6 0.7 -8Q0.9 -8.3 1.4 -8.7Z' },
		'5': { w: 21.69, d: 'M1.6 -5.1Q1.6 -6.6 2.6 -7.6Q3.5 -8.6 5 -8.6Q6.4 -8.6 7.2 -7.7Q7.9 -6.9 7.9 -5.5V-3.2Q7.9 -2.2 8.6 -1.5Q9.2 -0.8 10.5 -0.8Q11.9 -0.8 12.8 -2.3Q13.7 -3.7 13.7 -6.8Q13.7 -10.1 12.6 -11.7Q11.4 -13.2 9.5 -13.2Q8.8 -13.2 8.1 -13Q7.5 -12.7 6.9 -12.3Q6.2 -11.8 5.6 -11.2Q5.2 -10.8 4.8 -10.7Q4.5 -10.5 4.2 -10.5Q3.7 -10.5 3.4 -10.8Q3.1 -11 3.1 -11.5V-24.1Q3.1 -24.8 3.5 -25.2Q3.9 -25.6 4.7 -25.6Q5.1 -25.6 5.5 -25.5Q5.9 -25.4 6.6 -25.2Q7.5 -24.9 8.6 -24.6Q9.7 -24.4 10.9 -24.2Q12.1 -24.1 13.4 -24.1Q15.4 -24.1 16.7 -24.5Q17.9 -24.9 18.5 -25.6Q19 -26 19.3 -26Q19.6 -26.1 19.9 -26Q20.1 -26 20.2 -25.7Q20.3 -25.5 20.3 -25Q19.9 -22.6 18.9 -21.2Q17.9 -19.8 16.2 -19.1Q14.5 -18.5 12 -18.5Q10.5 -18.5 9.1 -18.7Q7.6 -18.9 6.2 -19.3Q4.9 -19.7 3.9 -20.2L5.2 -21.7V-12L4.4 -12.2Q5.4 -13.2 6.4 -13.9Q7.4 -14.6 8.6 -14.9Q9.9 -15.2 11.5 -15.2Q14.1 -15.2 16.1 -14.3Q18.1 -13.3 19.2 -11.6Q20.3 -9.9 20.3 -7.6Q20.3 -5 19 -3.2Q17.8 -1.3 15.5 -0.4Q13.2 0.6 10.2 0.6Q7.4 0.6 5.5 -0.1Q3.6 -0.9 2.6 -2.2Q1.6 -3.5 1.6 -5.1Z' },
		'6': { w: 23.0, d: 'M13.1 -25.8Q15.7 -25.8 17.5 -25Q19.4 -24.3 20.3 -23Q21.2 -21.8 21.2 -20.4Q21.2 -18.8 20.3 -17.9Q19.4 -17 17.8 -17Q16.3 -17 15.4 -17.8Q14.5 -18.7 14.5 -20.2V-21.9Q14.5 -23 14 -23.6Q13.5 -24.2 12.4 -24.2Q11.5 -24.2 10.7 -23.5Q9.9 -22.8 9.3 -21.4Q8.7 -19.9 8.3 -17.4Q8 -15 8 -11.4Q8 -7.4 8.5 -5.1Q9 -2.8 9.9 -1.9Q10.8 -1 11.9 -1Q13.5 -1 14.4 -2.5Q15.3 -4 15.3 -7.1Q15.3 -10 14.2 -11.5Q13.1 -13 11.4 -13Q10.4 -13 9.5 -12.5Q8.7 -12.1 8.1 -11.2Q7.5 -10.4 7.4 -9.3L6.3 -9.8Q6.4 -11.3 7.5 -12.5Q8.5 -13.8 10.2 -14.5Q11.9 -15.3 14 -15.3Q16.4 -15.3 18.2 -14.4Q20 -13.6 20.9 -11.9Q21.9 -10.3 21.9 -7.9Q21.9 -5.4 20.6 -3.4Q19.4 -1.5 17.2 -0.5Q14.9 0.6 11.9 0.6Q8.5 0.6 6.1 -0.9Q3.7 -2.4 2.5 -5.1Q1.2 -7.9 1.2 -11.7Q1.2 -16.3 2.6 -19.4Q4.1 -22.5 6.8 -24.2Q9.5 -25.8 13.1 -25.8Z' },
		'7': { w: 19.58, d: 'M15 -20.1 16 -19.5H5.3Q4.7 -19.5 4.4 -19.3Q4.1 -19.1 3.9 -18.5L3.4 -16.4Q3.3 -16 3 -15.8Q2.7 -15.5 2.2 -15.5Q1.7 -15.5 1.4 -15.8Q1.2 -16.1 1.2 -16.6L1.8 -23.9Q1.8 -24.5 2.2 -24.8Q2.6 -25.2 3.2 -25.2H18.4Q19.2 -25.2 19.6 -24.9Q20 -24.5 20 -23.9Q20 -23.6 19.8 -23.2Q19.5 -22.8 18.9 -22L14.7 -16.4Q13.5 -14.9 12.7 -13.8Q12 -12.7 11.6 -11.9Q11.2 -11.2 11 -10.6Q10.9 -10 10.9 -9.4Q10.9 -8.4 11.3 -7.7Q11.6 -7 12.1 -6.4Q12.6 -5.8 13 -5Q13.4 -4.2 13.4 -3.1Q13.4 -1.6 12.3 -0.5Q11.3 0.6 9.2 0.6Q7.1 0.6 5.9 -0.6Q4.7 -1.8 4.7 -4Q4.7 -5.3 5.1 -6.7Q5.6 -8 6.7 -9.7Q7.8 -11.3 9.7 -13.5Z' },
		'8': { w: 23.13, d: 'M10.9 0.6Q7.7 0.6 5.6 -0.2Q3.6 -1 2.6 -2.4Q1.6 -3.8 1.6 -5.6Q1.6 -7 2.4 -8.2Q3.3 -9.4 5.1 -10.2Q6.9 -11 9.7 -11.2L9.8 -10.8Q8.9 -10.1 8.6 -8.8Q8.2 -7.4 8.2 -6.1Q8.2 -3.6 9.1 -2.2Q10 -0.8 11.7 -0.8Q13.3 -0.8 14.1 -1.8Q15 -2.8 15 -4.6Q15 -5.8 14.5 -6.9Q14 -7.9 12.8 -8.7Q11.6 -9.5 9.6 -10.1Q5.4 -11.3 3.5 -13.3Q1.7 -15.3 1.7 -17.8Q1.7 -19.9 2.8 -21.8Q4 -23.6 6.4 -24.7Q8.8 -25.8 12.3 -25.8Q15.3 -25.8 17.4 -24.9Q19.5 -24 20.6 -22.5Q21.8 -20.9 21.8 -18.9Q21.8 -17.3 20.9 -15.9Q20 -14.5 18.1 -13.6Q16.3 -12.6 13.3 -12.4L12.8 -12.8Q13.6 -13.4 14.1 -14.3Q14.7 -15.3 15 -16.4Q15.4 -17.5 15.4 -18.8Q15.4 -20.6 14.9 -21.9Q14.5 -23.1 13.6 -23.7Q12.8 -24.4 11.5 -24.4Q10.5 -24.4 9.7 -23.9Q8.9 -23.3 8.5 -22.4Q8.2 -21.5 8.2 -20.3Q8.2 -18.7 8.7 -17.5Q9.3 -16.2 10.6 -15.3Q11.9 -14.3 14.2 -13.6Q18.2 -12.4 20 -10.6Q21.8 -8.8 21.8 -6.6Q21.8 -4.5 20.6 -2.9Q19.3 -1.3 16.8 -0.3Q14.4 0.6 10.9 0.6Z' },
		'9': { w: 23.09, d: 'M10 0.6Q7.4 0.6 5.5 -0.2Q3.7 -0.9 2.8 -2.2Q1.8 -3.4 1.8 -4.8Q1.8 -6.4 2.7 -7.3Q3.7 -8.2 5.2 -8.2Q6.8 -8.2 7.7 -7.4Q8.5 -6.5 8.5 -5V-3.3Q8.5 -2.2 9.1 -1.6Q9.6 -1 10.7 -1Q11.9 -1 12.9 -2.2Q13.9 -3.5 14.5 -6.3Q15.1 -9.1 15.1 -13.8Q15.1 -17.9 14.6 -20.1Q14.1 -22.4 13.2 -23.3Q12.3 -24.2 11.3 -24.2Q9.6 -24.2 8.7 -22.7Q7.7 -21.3 7.7 -18.2Q7.7 -15.4 8.8 -13.9Q9.9 -12.5 11.6 -12.5Q12.7 -12.5 13.5 -12.9Q14.4 -13.3 15 -14.1Q15.6 -14.9 15.7 -15.9L16.7 -15.6Q16.7 -14.2 15.6 -12.9Q14.6 -11.7 12.9 -10.9Q11.2 -10.2 9.1 -10.2Q6.6 -10.2 4.9 -11Q3.1 -11.8 2.1 -13.5Q1.2 -15.1 1.2 -17.4Q1.2 -19.9 2.4 -21.8Q3.7 -23.7 5.9 -24.7Q8.2 -25.8 11.2 -25.8Q14.6 -25.8 17 -24.3Q19.4 -22.8 20.6 -20.1Q21.9 -17.3 21.9 -13.5Q21.9 -9 20.4 -5.8Q19 -2.7 16.3 -1Q13.6 0.6 10 0.6Z' }
	};
	/** Top and bottom of the digits' outlines (px from the baseline). */
	const DIGITS_TOP = -26.3;
	const DIGITS_BOTTOM = 0.62;

	const digits = $derived(
		String(code)
			.split('')
			.filter((c) => c in DIGITS)
	);
	/** Laid out from x = 0 with the board's 0.5 px tracking, then centred. */
	const glyphs = $derived.by(() => {
		let x = 0;
		const out = digits.map((c) => {
			const g = { x, d: DIGITS[c].d };
			x += DIGITS[c].w + 0.5;
			return g;
		});
		const width = x - 0.5;
		const baseline = 35 - (DIGITS_TOP + DIGITS_BOTTOM) / 2;
		return { out, dx: 70 - width / 2, baseline };
	});

	/** 64 px of ink specks — the paper's grain as a tile, cheap to move. */
	const GRAIN = 'data:image/png;base64,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';
</script>

<div
	class="fk-404 {className}"
	{style}
	style:aspect-ratio="{frame.w} / {frame.h}"
	aria-hidden="true"
>
	<svg class="fk-404-plate" style={place(frame.plate)} viewBox="0 0 140 70" focusable="false">
		<defs>
			<clipPath id="plate-{uid}"><rect width="140" height="70" rx="35" /></clipPath>
			<!-- The board's shadow (0 6 14, ink 22 %); a filter is fine here — the plate never moves. -->
			<filter id="lift-{uid}" x="-20%" y="-30%" width="140%" height="190%">
				<feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#2B2825" flood-opacity="0.22" />
			</filter>
			<pattern id="hatch-{uid}" width="3.6" height="3.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<rect width="1.8" height="3.6" class="fk-404-ink" opacity="0.06" />
			</pattern>
			<pattern id="grain-p-{uid}" width="32" height="32" patternUnits="userSpaceOnUse">
				<image href={GRAIN} width="32" height="32" />
			</pattern>
		</defs>
		<rect width="140" height="70" rx="35" class="fk-404-plate-fill" filter="url(#lift-{uid})" />
		<g clip-path="url(#plate-{uid})">
			<rect width="140" height="70" class="fk-404-plate-fill" />
			<rect width="140" height="70" fill="url(#hatch-{uid})" />
			<rect width="140" height="70" fill="url(#grain-p-{uid})" opacity="0.8" />
		</g>
		<circle cx="16" cy="35" r="4" class="fk-404-screw" />
		<circle cx="124" cy="35" r="4" class="fk-404-screw" />
		<g class="fk-404-digits" transform="translate({glyphs.dx} {glyphs.baseline})">
			{#each glyphs.out as g, i (i)}
				<path d={g.d} transform="translate({g.x} 0)" />
			{/each}
		</g>
	</svg>

	<div class="fk-404-ghost" style={place(frame.ghost)}>
		<div class="fk-404-floor"></div>
		<div class="fk-404-float">
			<svg viewBox="0 0 {W} {H}" overflow="visible" focusable="false">
				<defs>
					<clipPath id="sheet-{uid}">
						<rect x={HX - R} y={HY - 1} width={2 * R} height={H - HY} />
					</clipPath>
					<linearGradient id="shade-{uid}" gradientUnits="userSpaceOnUse" x1="0" y1={Y(0.55)} x2="0" y2={Y(0.25)}>
						<stop offset="0" stop-color="#FFFFFF" />
						<stop offset="1" stop-color="#F7F7F7" />
					</linearGradient>
					<pattern id="grain-g-{uid}" width="48" height="48" patternUnits="userSpaceOnUse">
						<image href={GRAIN} width="48" height="48" />
					</pattern>
					<mask id="body-{uid}">
						<circle cx={HX} cy={HY} r={R} fill="#FFF" />
						<g transform="matrix(1 0 {LEAN} 1 {-LEAN * HY} 0)" clip-path="url(#sheet-{uid})">
							<path class="fk-404-hem" d={sheet} fill="#FFF" />
						</g>
					</mask>
				</defs>
				<g mask="url(#body-{uid})">
					<rect width={W} height={H} fill="url(#shade-{uid})" />
					<rect width={W} height={H} fill="url(#grain-g-{uid})" opacity="0.35" />
				</g>
				<g class="fk-404-eyes">
					{#each eyes as e, i (i)}
						<circle cx={e.cx} cy={e.cy} r={0.03 * H} class="fk-404-ink" />
					{/each}
				</g>
			</svg>
		</div>
	</div>
</div>

<style>
	.fk-404 {
		--fk-404-ink: #2b2825;
		position: relative;
		width: 100%;
	}
	.fk-404 > * {
		position: absolute;
	}
	.fk-404-ink {
		fill: var(--fk-404-ink);
	}

	/* ── Plate ──────────────────────────────────────────────────────────── */
	.fk-404-plate {
		overflow: visible;
	}
	.fk-404-plate-fill {
		fill: var(--plate, #c98b2b);
	}
	.fk-404-screw {
		fill: #7a5418;
	}
	.fk-404-digits {
		fill: var(--plate-ink, #2b2825);
	}

	/* ── Ghost ──────────────────────────────────────────────────────────── */
	.fk-404-ghost {
		container-type: size;
	}
	.fk-404-float,
	.fk-404-float svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.fk-404-float svg {
		overflow: visible;
		/* The paper's own shadow: the sheet lifted 2 % off the page. */
		filter: drop-shadow(0 2.2cqh 1.6cqh rgb(43 40 37 / 0.12));
	}
	:global(.dark) .fk-404-float svg {
		/* In the dark the sheet glows instead (u_glow = 1). */
		filter: drop-shadow(0 0 1.6cqh rgb(255 255 255 / 0.5)) drop-shadow(0 0 5cqh rgb(255 255 255 / 0.22));
	}
	/* On the floor under the ghost: smaller and lighter while it's up. */
	.fk-404-floor {
		position: absolute;
		left: calc(52.6% - 27.5%);
		top: 91.8%;
		width: 55%;
		height: 4.4%;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(43 40 37 / 0.13) 60%, transparent);
	}

	/* ── Motion: one 4 s loop ───────────────────────────────────────────── */
	.fk-404-float {
		animation: fk-404-bob 4s ease-in-out -1s infinite;
		will-change: transform;
	}
	.fk-404-floor {
		animation: fk-404-floor 4s ease-in-out -1s infinite;
	}
	.fk-404-hem {
		animation: fk-404-ripple 2s linear infinite;
	}
	.fk-404-eyes {
		transform-box: fill-box;
		transform-origin: center;
		animation: fk-404-blink 4s linear infinite;
	}
	@keyframes fk-404-bob {
		0%,
		100% {
			transform: translateY(-3%);
		}
		50% {
			transform: translateY(3%);
		}
	}
	@keyframes fk-404-floor {
		0%,
		100% {
			transform: scaleX(0.78);
			opacity: 0.62;
		}
		50% {
			transform: scaleX(1);
			opacity: 1;
		}
	}
	@keyframes fk-404-ripple {
		to {
			transform: translateX(-44.2px);
		}
	}
	@keyframes fk-404-blink {
		0%,
		88.5%,
		94.5%,
		100% {
			transform: scaleY(1);
		}
		90.5%,
		92.5% {
			transform: scaleY(0.1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fk-404-float,
		.fk-404-floor,
		.fk-404-hem,
		.fk-404-eyes {
			animation: none;
		}
	}
</style>
