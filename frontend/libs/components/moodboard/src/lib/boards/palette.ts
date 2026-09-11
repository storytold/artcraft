// Client-side color extraction. Downscales the image to a small sample and
// buckets colors (4 bits/channel) to find a representative palette + dominant
// color, with near-duplicate suppression. Returns [] on a cross-origin tainted
// canvas (getImageData throws) — callers degrade gracefully.

const SAMPLE = 40;
const MIN_DISTANCE = 48;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const extractPalette = (url: string, count = 5): Promise<string[]> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        resolve(quantize(img, count));
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = url;
  });

const quantize = (img: HTMLImageElement, count: number): string[] => {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

  const buckets = new Map<number, Rgb & { n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(key);
    if (e) {
      e.r += r;
      e.g += g;
      e.b += b;
      e.n += 1;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.n - a.n);
  const chosen: Rgb[] = [];
  for (const e of sorted) {
    const c: Rgb = {
      r: Math.round(e.r / e.n),
      g: Math.round(e.g / e.n),
      b: Math.round(e.b / e.n),
    };
    if (chosen.every((o) => distance(o, c) > MIN_DISTANCE)) chosen.push(c);
    if (chosen.length >= count) break;
  }
  return chosen.map((c) => toHex(c));
};

const distance = (a: Rgb, b: Rgb): number =>
  Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

const toHex = ({ r, g, b }: Rgb): string => {
  const h = (r << 16) | (g << 8) | b;
  return `#${h.toString(16).padStart(6, "0").toUpperCase()}`;
};
