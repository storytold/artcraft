# Custom desktop colors

In Settings → Appearance, choose **Custom** to load colors from a local
`theme.json`. Your selection is saved with the other themes and restored when
ArtCraft starts. Ordinary browser sessions cannot read this file and use Default.

On Linux, save the file at:

```text
$XDG_CONFIG_HOME/ai.artcraft.app/theme.json
```

When `XDG_CONFIG_HOME` is unset, empty, or relative, the configuration directory
is `~/.config`, so the file is `~/.config/ai.artcraft.app/theme.json`.
The native reader uses the platform configuration directory on other desktops:
`~/Library/Application Support/ai.artcraft.app/theme.json` on macOS and
`%APPDATA%\ai.artcraft.app\theme.json` on Windows. Native behavior on these two
platforms still needs verification.

```json
{
  "background": "#112233",
  "surface": "#223344",
  "border": "#334455",
  "text": "#eeeeee",
  "textDim": "#aabbcc",
  "accent": "#44aaff",
  "accentText": "#000000",
  "danger": "#ff0000",
  "warning": "#ffaa00"
}
```

All nine fields are required. Colors must contain exactly `#` and six ASCII hex
digits, with either case accepted. Unknown properties are ignored. Comments,
trailing commas, duplicate palette fields, CSS expressions, short hex colors,
and alpha hex colors are invalid. The file must be a readable regular file of
at most 16 KiB; symbolic links are rejected. ArtCraft creates the per-app directory
when Custom is selected, but never creates or rewrites the palette file.

Changes apply automatically while Custom is selected, including saves that replace
the file by rename. Save events are debounced for 120 ms. A missing, invalid, or
unreadable file leaves the last valid palette active; without a previously loaded
palette, Default remains active. Appearance displays a status explaining the
problem. After a directory/watch failure, select another theme and then Custom
to retry. Switching away removes every custom override and stops the watcher.

Use an atomic rename when generating palettes to avoid incomplete saves. Only
a complete valid palette is ever applied, and it is applied through individual
CSS properties, never as stylesheet text. The frontend cannot choose a file path.

## Palette mapping

| Field      | ArtCraft tokens                                             | Editor HSL tokens                     |
|------------|-------------------------------------------------------------|---------------------------------------|
| background | Background and sunken surfaces                              | background                            |
| surface    | Panels, modals, controls (including matching RGB values)    | card, popover, secondary, muted       |
| border     | Panel/control borders and dividers                          | border, input                         |
| text       | Foreground (including matching RGB values)                  | foreground and surface foregrounds    |
| textDim    | Dim text token                                              | muted-foreground                      |
| accent     | Semantic primary/brand colors, focus, selection, accent ink | primary, accent, ring                 |
| accentText | Accent text and selection text                              | primary-foreground, accent-foreground |
| danger     | Semantic danger color                                       | destructive                           |
| warning    | Semantic warning color                                      | warning                               |

RGB and HSL values are derived from the same validated colors. Semantic Tailwind
colors retain their existing fallbacks in the five built-in themes. Explicitly
numbered color shades, hardcoded decorative colors, and artwork colors are not
recolored. Native controls and monochrome icons follow the brightness of the
custom background. Choose readable foreground/background pairs; ArtCraft does
not adjust palette contrast automatically.

This feature does not read a shared Craft palette or add automatic System mode.

## Regression tests

From `frontend/`, run `npm run test:themes --workspace=artcraft` for the focused
Vitest suite. On a machine with the native build prerequisites installed, run
`SQLX_OFFLINE=true cargo test -p artcraft themes:: --lib` from the repository root
for parsing, file reading, watcher behavior, and subscription cleanup tests.
