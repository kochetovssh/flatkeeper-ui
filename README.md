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
```

Installed as a git dependency pinned to a tag:

```json
"@flatkeeper/ui": "github:kochetovssh/flatkeeper-ui#v0.1.0"
```

Release: bump `version`, commit, `git tag vX.Y.Z && git push --tags`, then
update the tag in both apps. No build step — the files ship as they are.
