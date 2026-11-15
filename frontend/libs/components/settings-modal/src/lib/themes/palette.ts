export const PALETTE_FIELDS = [
  "background",
  "surface",
  "border",
  "text",
  "textDim",
  "accent",
  "accentText",
  "danger",
  "warning",
] as const;

export type Palette = Record<(typeof PALETTE_FIELDS)[number], string>;

// Validate again at the IPC boundary. Only these keys can reach CSS properties.
export function validatePalette(value: unknown): Palette | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const source = value as Record<string, unknown>;
  const palette = {} as Palette;
  for (const key of PALETTE_FIELDS) {
    const color = source[key];
    if (typeof color !== "string" || !/^#[\da-f]{6}$/i.test(color)) return;
    palette[key] = color.toLowerCase();
  }
  return palette;
}

export function paletteProperties(palette: Palette): Record<string, string> {
  const properties: Record<string, string> = {};
  const map = (
    color: string,
    hex: string[],
    hsl: string[] = [],
    rgb: string[] = [],
  ) => {
    for (const key of hex) properties[key] = color;
    for (const key of hsl) properties[key] = toHsl(color);
    for (const key of rgb) properties[key] = channels(color).join(" ");
  };
  map(palette.background, ["--st-bg", "--st-sunken"], ["--background"]);
  map(
    palette.surface,
    ["--st-panel", "--st-modal", "--st-controls"],
    ["--card", "--popover", "--secondary", "--muted"],
    ["--st-controls-rgb"],
  );
  map(
    palette.border,
    ["--st-panel-border", "--st-controls-border", "--st-divider"],
    ["--border", "--input"],
  );
  map(
    palette.text,
    ["--st-fg"],
    [
      "--foreground",
      "--card-foreground",
      "--popover-foreground",
      "--secondary-foreground",
      "--destructive-foreground",
    ],
    ["--st-fg-rgb"],
  );
  map(palette.textDim, ["--st-text-dim"], ["--muted-foreground"]);
  map(
    palette.accent,
    ["--st-accent"],
    ["--primary", "--accent", "--ring"],
    ["--st-accent-rgb"],
  );
  map(
    palette.accentText,
    ["--st-accent-text"],
    ["--primary-foreground", "--accent-foreground"],
  );
  map(palette.danger, [], ["--destructive"], ["--st-danger-rgb"]);
  map(palette.warning, [], ["--warning"], ["--st-warning-rgb"]);
  // Native controls and monochrome icons should match a light custom background.
  const [r, g, b] = channels(palette.background);
  properties["--st-color-scheme"] =
    (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "light" : "dark";
  return properties;
}

function channels(color: string): [number, number, number] {
  return [1, 3, 5].map((start) =>
    Number.parseInt(color.slice(start, start + 2), 16),
  ) as [number, number, number];
}

function toHsl(color: string): string {
  const [r, g, b] = channels(color).map((channel) => channel / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return `${((hue * 60 + 360) % 360).toFixed(3)} ${(saturation * 100).toFixed(3)}% ${(lightness * 100).toFixed(3)}%`;
}
