/**
 * Date helpers and the booking rules behind CalendarMonth. Dates are ISO
 * `YYYY-MM-DD` strings, months `YYYY-MM` — plain strings compare in
 * calendar order and never shift with the time zone.
 */

/** @param {Date} date — read in UTC */
export function isoOf(date) {
	return date.toISOString().slice(0, 10);
}

/** @param {string} iso */
function utc(iso) {
	return new Date(`${iso}T00:00:00Z`);
}

/** Today in the visitor's own calendar (not UTC), as ISO. */
export function todayISO() {
	const d = new Date();
	return isoOf(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
}

/** @param {string} iso @param {number} n */
export function addDays(iso, n) {
	const d = utc(iso);
	d.setUTCDate(d.getUTCDate() + n);
	return isoOf(d);
}

/** Whole days from `a` to `b`. @param {string} a @param {string} b */
export function daysBetween(a, b) {
	return Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000);
}

/** @param {string} iso */
export function monthOf(iso) {
	return iso.slice(0, 7);
}

/** @param {string} month `YYYY-MM` @param {number} n */
export function addMonths(month, n) {
	const [y, m] = month.split('-').map(Number);
	return isoOf(new Date(Date.UTC(y, m - 1 + n, 1))).slice(0, 7);
}

/**
 * The month's days, Monday first, `null` for the blanks before the 1st.
 * @param {string} month `YYYY-MM`
 * @returns {(string | null)[]}
 */
export function monthDays(month) {
	const first = utc(`${month}-01`);
	const blanks = (first.getUTCDay() + 6) % 7;
	const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
	/** @type {(string | null)[]} */
	const cells = Array(blanks).fill(null);
	for (let d = 1; d <= count; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);
	return cells;
}

/** «Октябрь 2026» — the standalone month name, no «г.».
 *  @param {string} month @param {string} locale */
export function monthTitle(month, locale) {
	const date = utc(`${month}-01`);
	const name = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(date);
	return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getUTCFullYear()}`;
}

/** Short weekday names, Monday first. @param {string} locale */
export function weekdays(locale) {
	const f = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
	// 2024-01-01 is a Monday.
	return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i))));
}

/**
 * @typedef {object} Night
 * @property {boolean} available - false when booked, closed by the host or past the sale horizon
 * @property {number} [price] - minor units, 0 when the host has not set one
 * @property {number} [minStay]
 */

/** A night the guest can pay for. @param {Night | undefined} night */
export function bookable(night) {
	return !!night && night.available && (night.price ?? 0) > 0;
}

/**
 * Where the check-out can go once the check-in is picked (pen «11» →
 * Календарь · 2–3). Occupancy is per night, so the first night that can't
 * be booked is still a valid check-out day — the next guest arrives that
 * morning — and nothing past it can be reached: the stay can't jump a
 * booked night.
 *
 * @param {string} checkIn
 * @param {(iso: string) => Night | undefined} night
 * @param {number} maxNights — the backend's cap on one stay
 * @returns {{ minOut: string, maxOut: string, minStay: number, edge: 'booked' | 'cap' }}
 *   `edge` — why the range stops: at a night that can't be booked, or at the cap.
 */
export function checkoutRange(checkIn, night, maxNights) {
	const minStay = Math.max(1, night(checkIn)?.minStay ?? 1);
	for (let i = 1; i < maxNights; i++) {
		const day = addDays(checkIn, i);
		if (!bookable(night(day))) {
			return { minOut: addDays(checkIn, minStay), maxOut: day, minStay, edge: 'booked' };
		}
	}
	return { minOut: addDays(checkIn, minStay), maxOut: addDays(checkIn, maxNights), minStay, edge: 'cap' };
}
