/**
 * Film-inspired color recipes for the 2D editor.
 * These are original approximations, not official Fujifilm profiles/LUTs.
 * The original image is never mutated.
 */
export type FilmPreset = "none" | "chrome" | "negative" | "vivid" | "cinema" | "mono" | "warm";

export const FILM_PRESETS: ReadonlyArray<{ id: FilmPreset; label: string }> = [
  { id: "none", label: "Original" },
  { id: "chrome", label: "Classic Chrome inspired" },
  { id: "negative", label: "Classic Negative inspired" },
  { id: "vivid", label: "Vivid Landscape" },
  { id: "cinema", label: "Cinema Soft" },
  { id: "mono", label: "Fine Monochrome" },
  { id: "warm", label: "Nostalgic Warm" },
];

type Recipe = {
  contrast: number;
  saturation: number;
  red: number;
  green: number;
  blue: number;
  fade: number;
};

const RECIPES: Record<Exclude<FilmPreset, "none">, Recipe> = {
  chrome: { contrast: 1.09, saturation: 0.74, red: 1.03, green: 0.99, blue: 0.92, fade: 8 },
  negative: { contrast: 1.2, saturation: 0.9, red: 1.04, green: 1.04, blue: 1.09, fade: 4 },
  vivid: { contrast: 1.15, saturation: 1.3, red: 1.01, green: 1.08, blue: 1.07, fade: 0 },
  cinema: { contrast: 0.86, saturation: 0.75, red: 1.03, green: 1.02, blue: 0.98, fade: 10 },
  mono: { contrast: 1.13, saturation: 0, red: 1, green: 1, blue: 1, fade: 2 },
  warm: { contrast: 1.04, saturation: 0.92, red: 1.09, green: 1.02, blue: 0.89, fade: 9 },
};

const clamp = (value: number): number => Math.max(0, Math.min(255, value));

export function applyFilmSimulation(
  data: ImageData,
  preset: FilmPreset,
  strength: number,
): ImageData {
  if (preset === "none" || strength <= 0) return data;
  const recipe = RECIPES[preset];
  const amount = Math.max(0, Math.min(1, strength / 100));
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const luminosity = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const color = [r, g, b];
    const multipliers = [recipe.red, recipe.green, recipe.blue];
    for (let j = 0; j < 3; j++) {
      const saturated = luminosity + (color[j] - luminosity) * recipe.saturation;
      const contrasted = (saturated - 127.5) * recipe.contrast + 127.5;
      const graded = contrasted * multipliers[j] * (1 - recipe.fade / 255) + recipe.fade;
      pixels[i + j] = clamp(color[j] + (graded - color[j]) * amount);
    }
    // Alpha remains unchanged.
  }
  return data;
}

/** Creates a fresh canvas; never changes the source image. */
export function renderFilmImage(
  source: HTMLImageElement,
  preset: FilmPreset,
  strength: number,
): HTMLCanvasElement {
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
