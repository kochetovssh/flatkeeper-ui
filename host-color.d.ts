export declare const DEFAULT_HOST_ACCENT: string;
export declare const HOST_SWATCHES: readonly [
	{ readonly key: 'clay'; readonly hex: '#a85d3f' },
	{ readonly key: 'graphite'; readonly hex: '#2b2825' },
	{ readonly key: 'pine'; readonly hex: '#2e4a43' },
	{ readonly key: 'sea'; readonly hex: '#2c5f7c' },
	{ readonly key: 'plum'; readonly hex: '#6b3e5e' },
	{ readonly key: 'olive'; readonly hex: '#5b6236' },
	{ readonly key: 'brick'; readonly hex: '#9a3b2e' },
	{ readonly key: 'indigo'; readonly hex: '#3e4a8a' }
];
export type HostSwatch = (typeof HOST_SWATCHES)[number];
export declare function sanitizeHex(value: unknown): string | null;
export declare function contrast(a: string, b: string): number;
export interface HostColors {
	accent: string;
	onAccent: string;
	ink: string;
	buttonContrast: number;
	readable: boolean;
}
export declare function hostColors(primary: unknown): HostColors;
export declare function hostColorStyle(primary: unknown): string;
