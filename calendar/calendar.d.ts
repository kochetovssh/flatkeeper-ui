export declare function isoOf(date: Date): string;
export declare function todayISO(): string;
export declare function addDays(iso: string, n: number): string;
export declare function daysBetween(a: string, b: string): number;
export declare function monthOf(iso: string): string;
export declare function addMonths(month: string, n: number): string;
export declare function monthDays(month: string): (string | null)[];
export declare function monthTitle(month: string, locale: string): string;
export declare function weekdays(locale: string): string[];
export interface Night {
	/** false when booked, closed by the host or past the sale horizon */
	available: boolean;
	/** minor units, 0 when the host has not set one */
	price?: number;
	minStay?: number;
}
export declare function bookable(night: Night | undefined): boolean;
export declare function checkoutRange(
	checkIn: string,
	night: (iso: string) => Night | undefined,
	maxNights: number
): { minOut: string; maxOut: string; minStay: number; edge: 'booked' | 'cap' };
