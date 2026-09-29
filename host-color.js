/**
 * The host's brand colour on the guest site (pen «11» → Слот бренда хоста).
 * One function for the mini-site and for the cabinet's preview, so the
 * host sees the button exactly as the guest will.
 */

/** Clay — the default: the cabinet saves it when the host picks nothing. */
export const DEFAULT_HOST_ACCENT = '#a85d3f';

/** The set the host picks from — each checked against the button text and
 *  the page (≥ 4.5). Names are message keys on the consumer side. */
export const HOST_SWATCHES = /** @type {const} */ ([
	{ key: 'clay', hex: '#a85d3f' },
	{ key: 'graphite', hex: '#2b2825' },
	{ key: 'pine', hex: '#2e4a43' },
	{ key: 'sea', hex: '#2c5f7c' },
	{ key: 'plum', hex: '#6b3e5e' },
	{ key: 'olive', hex: '#5b6236' },
	{ key: 'brick', hex: '#9a3b2e' },
	{ key: 'indigo', hex: '#3e4a8a' }
]);

/** The guest paper (`--bg-card`) and light button text. */
const PAPER = '#fbf8f3';
/** Graphite (`--text-primary`) — button text and links on a light host colour. */
const GRAPHITE = '#2b2825';
/** WCAG AA for normal text. */
const MIN_CONTRAST = 4.5;

/** `#rrggbb` or null — `appearance` is opaque JSONB and must never reach CSS unchecked.
 *  @param {unknown} value
 *  @returns {string | null} */
export function sanitizeHex(value) {
	return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : null;
}

/** @param {string} hex */
function luminance(hex) {
	/** @param {number} i */
	const channel = (i) => {
		const c = parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio of two `#rrggbb` colours, 1…21.
 *  @param {string} a
 *  @param {string} b */
export function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * A colour that reads on the paper keeps light button text and colours
 * links, focus and selected dates; a light one (mustard, mint) gets graphite
 * text on the button, and graphite takes over wherever the colour would sit
 * on the paper itself.
 * @param {unknown} primary `appearance.primary_color`
 */
export function hostColors(primary) {
	const accent = sanitizeHex(primary) ?? DEFAULT_HOST_ACCENT;
	const readable = contrast(accent, PAPER) >= MIN_CONTRAST;
	const onAccent = readable ? PAPER : GRAPHITE;
	return {
		accent,
		onAccent,
		ink: readable ? accent : GRAPHITE,
		/** Contrast of the button text with the fill — for the cabinet's hint. */
		buttonContrast: contrast(accent, onAccent),
		readable
	};
}

/** The same as inline CSS custom properties (`--host-*`) for a wrapper.
 *  @param {unknown} primary */
export function hostColorStyle(primary) {
	const c = hostColors(primary);
	return `--host-accent: ${c.accent}; --host-on-accent: ${c.onAccent}; --host-ink: ${c.ink}`;
}
