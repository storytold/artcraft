# @storyteller/icons

Companion lib for [Lucide](https://lucide.dev) icons. Regular icons come straight from
`lucide-react` — import them directly:

```tsx
import { PlayIcon } from 'lucide-react';

<PlayIcon className="h-4 w-4" />
```

This lib holds the pieces Lucide doesn't provide:

- `dynamic-icon.tsx` — `<DynamicIcon icon={active ? PauseIcon : PlayIcon} />` for icons chosen
  at runtime (`item.icon`, conditional toggles). Static call sites should render the Lucide
  component directly.
- `brand-icons.tsx` — brand logos (`DiscordIcon`, `TiktokIcon`, ...) as inlined SVG paths;
  Lucide ships no brand marks by policy.
- `custom-icons.tsx` — icons with no Lucide equivalent (`HighDefinitionIcon` /
  `StandardDefinitionIcon` quality badges), drawn in Lucide's stroke style.

Sizing: each app's global stylesheet sets `.lucide { width/height: 1.2em }` so Lucide icons
scale with the surrounding font size (1.2em because Lucide draws on a 20px grid inside its
24px viewBox — the visible mark then fills a full em, matching the previous solid-glyph
icon sizes). Explicit Tailwind sizing classes still win. Brand icons from this lib are
full-bleed paths and default to a plain `1em`.
