/**
 * Original approximations of Fujifilm-inspired looks.
 * Not Fujifilm profiles, measured camera color science, or licensed LUTs.
 * 20 modes correspond to the current Fujifilm Film Simulation mode list.
 */
export const FILM_PRESETS = [
  { id: "none", label: "Original" },
  { id: "provia", label: "PROVIA / Standard" },
  { id: "velvia", label: "Velvia / Vivid" },
  { id: "astia", label: "ASTIA / Soft" },
  { id: "chrome", label: "Classic Chrome" },
  { id: "reala", label: "REALA ACE" },
  { id: "pro-neg-hi", label: "PRO Neg. Hi" },
  { id: "pro-neg-std", label: "PRO Neg. Std" },
  { id: "negative", label: "Classic Neg." },
  { id: "nostalgic", label: "Nostalgic Neg." },
  { id: "eterna", label: "ETERNA / Cinema" },
  { id: "bleach", label: "ETERNA Bleach Bypass" },
  { id: "acros", label: "ACROS" },
  { id: "acros-ye", label: "ACROS + Yellow" },
  { id: "acros-r", label: "ACROS + Red" },
  { id: "acros-g", label: "ACROS + Green" },
  { id: "monochrome", label: "Black & White" },
  { id: "monochrome-ye", label: "B&W + Yellow" },
  { id: "monochrome-r", label: "B&W + Red" },
  { id: "monochrome-g", label: "B&W + Green" },
  { id: "sepia", label: "Sepia" },
] as const;

export type FilmPreset = (typeof FILM_PRESETS)[number]["id"];
type Recipe = {
  contrast: number;
  saturation: number;
  red: number;
  green: number;
  blue: number;
  fade: number;
  /** Monochrome channel response to emulate colored lens filters. */
  monoWeights?: readonly [number, number, number];
  sepia?: boolean;
};

const BW: readonly [number, number, number] = [0.2126, 0.7152, 0.0722];
const YELLOW: readonly [number, number, number] = [0.32, 0.64, 0.04];
const RED: readonly [number, number, number] = [0.65, 0.32, 0.03];
const GREEN: readonly [number, number, number] = [0.12, 0.84, 0.04];
const color = (contrast: number, saturation: number, red = 1, green = 1, blue = 1, fade = 0): Recipe =>
  ({ contrast, saturation, red, green, blue, fade });
const bw = (contrast: number, monoWeights: readonly [number, number, number], fade = 0): Recipe =>
  ({ ...color(contrast, 0, 1, 1, 1, fade), monoWeights });

const RECIPES: Record<Exclude<FilmPreset, "none">, Recipe> = {
  provia: color(1.03, 1.04),
  velvia: color(1.15, 1.32, 1.02, 1.06, 1.08),
  astia: color(0.94, 1.08, 1.04, 1, 0.98, 3),
  chrome: color(1.09, 0.74, 1.03, 0.99, 0.92, 8),
  reala: color(1.07, 1.03, 1.02, 1.01, 0.98),
  "pro-neg-hi": color(1.15, 0.91, 1.02, 1, 0.98),
  "pro-neg-std": color(0.91, 0.84, 1.02, 1, 0.99, 6),
  negative: color(1.2, 0.9, 1.04, 1.04, 1.09, 4),
  nostalgic: color(1.01, 0.92, 1.09, 1.02, 0.89, 9),
  eterna: color(0.86, 0.75, 1.03, 1.02, 0.98, 10),
  bleach: color(1.3, 0.48, 0.99, 1.02, 1.08, 4),
  acros: bw(1.13, BW, 2),
  "acros-ye": bw(1.13, YELLOW, 2),
  "acros-r": bw(1.13, RED, 2),
  "acros-g": bw(1.13, GREEN, 2),
  monochrome: bw(1.02, BW),
  "monochrome-ye": bw(1.02, YELLOW),
  "monochrome-r": bw(1.02, RED),
  "monochrome-g": bw(1.02, GREEN),
  sepia: { ...bw(1.02, BW, 6), sepia: true },
};

const clamp = (value: number): number => Math.max(0, Math.min(255, value));

export function applyFilmSimulation(data: ImageData, preset: FilmPreset, strength: number): ImageData {
  if (preset === "none" || strength <= 0) return data;
  const recipe = RECIPES[preset];
  const amount = Math.max(0, Math.min(1, strength / 100));
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const luminance = recipe.monoWeights
      ? r * recipe.monoWeights[0] + g * recipe.monoWeights[1] + b * recipe.monoWeights[2]
      : r * BW[0] + g * BW[1] + b * BW[2];
    const channels = [r, g, b];
    const multipliers = [recipe.red, recipe.green, recipe.blue];
    for (let j = 0; j < 3; j++) {
      const base = recipe.monoWeights ? luminance : channels[j];
      const saturated = luminance + (base - luminance) * recipe.saturation;
      const contrasted = (saturated - 127.5) * recipe.contrast + 127.5;
      let graded = contrasted * multipliers[j] * (1 - recipe.fade / 255) + recipe.fade;
      if (recipe.sepia) graded = graded * [1.08, 0.95, 0.75][j] + [5, 0, 0][j];
      pixels[i + j] = clamp(channels[j] + (graded - channels[j]) * amount);
    }
    // Preserve existing alpha.
  }
  return data;
}

/** Process into an isolated canvas; original HTMLImageElement is never modified. */
export function renderFilmImage(source: HTMLImageElement, preset: FilmPreset, strength: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth || source.width;
  canvas.height = source.naturalHeight || source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas is unavailable");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (preset !== "none" && strength > 0) {
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    context.putImageData(applyFilmSimulation(image, preset, strength), 0, 0);
  }
  return canvas;
}
