# @flatkeeper/ui

Design tokens shared by the host cabinet (`flatkeeper-front`) and the guest
mini-site (`flatkeeper-direct`). Source of truth — pen.dev boards
«01 · Foundations» and «11 · Direct».

```css
@import "tailwindcss";
@import "@flatkeeper/ui/tokens.css";
```

```ts
import { hostColors, HOST_SWATCHES } from '@flatkeeper/ui/host-color';
import { addDays, checkoutRange, type Night } from '@flatkeeper/ui/calendar';
import CalendarMonth from '@flatkeeper/ui/CalendarMonth.svelte';
import EmptyArt from '@flatkeeper/ui/EmptyArt.svelte';
```

| Export | What |
|---|---|
| `tokens.css` | Fonts, colours (`.light` / `.dark`), radii, shadows, host slot `--host-*`; `@source` for the components below |
| `host-color` | `hostColors` — text on the host's button by contrast (≥ 4.5), the 8 swatches |
| `calendar` | ISO date helpers; `checkoutRange` — where a check-out may go (per-night occupancy, min stay) |
| `CalendarMonth.svelte` | One month of a range picker: `variant="guest"` (52 px cells, prices, booking rules) or `"cabinet"` (compact popover grid) |
| `EmptyArt.svelte` | Paper-cut compositions for empty states |

Installed as a git dependency pinned to a tag:

```json
"@flatkeeper/ui": "github:kochetovssh/flatkeeper-ui#v0.2.0"
```

Release: bump `version`, commit, `git tag vX.Y.Z && git push --tags`, then
update the tag in both apps. No build step — the files ship as they are.
