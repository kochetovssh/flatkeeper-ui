# @flatkeeper/ui

Design tokens shared by the host cabinet (`flatkeeper-front`) and the guest
mini-site (`flatkeeper-direct`); the error scene also by the landing
(`flatkeeper-landing`). Source of truth — pen.dev boards «01 · Foundations»,
«11 · Direct» and «13 · Страница 404».

```css
@import "tailwindcss";
@import "@flatkeeper/ui/tokens.css";
```

```ts
import { hostColors, HOST_SWATCHES } from '@flatkeeper/ui/host-color';
import { addDays, checkoutRange, type Night } from '@flatkeeper/ui/calendar';
import CalendarMonth from '@flatkeeper/ui/CalendarMonth.svelte';
import EmptyArt from '@flatkeeper/ui/EmptyArt.svelte';
import NotFoundArt from '@flatkeeper/ui/NotFoundArt.svelte';
```

| Export | What |
|---|---|
| `tokens.css` | Fonts, colours (`.light` / `.dark`), radii, shadows, host slot `--host-*`; `@source` for the components below |
| `host-color` | `hostColors` — text on the host's button by contrast (≥ 4.5), the 8 swatches |
| `calendar` | ISO date helpers; `checkoutRange` — where a check-out may go (per-night occupancy, min stay) |
| `CalendarMonth.svelte` | One month of a range picker: `variant="guest"` (52 px cells, prices, booking rules) or `"cabinet"` (compact popover grid) |
| `EmptyArt.svelte` | Paper-cut compositions for empty states |
| `NotFoundArt.svelte` | The error scene: the apartment plate with the status code and the floating paper ghost. `layout` — `wide` / `compact` / `side`; plate colour via `--plate` / `--plate-ink`; glows under `.dark`. Plain CSS, no Tailwind — works in Astro via `@astrojs/svelte` |

Installed as a git dependency pinned to a tag:

```json
"@flatkeeper/ui": "github:kochetovssh/flatkeeper-ui#v0.3.0"
```

Release: bump `version`, commit, `git tag vX.Y.Z && git push --tags`, then
update the tag in the apps. No build step — the files ship as they are.
The apps bring Tailwind v4 themselves; it isn't a peer, so it stays a dev
dependency there and out of the runtime image.
