import { describe, expect, it } from "vitest";
import { applyFilmSimulation, FILM_PRESETS } from "./filmSimulation";

function pixel(r: number, g: number, b: number, a = 255): ImageData {
  return { width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, a]) } as ImageData;
}

describe("film simulation", () => {
  it("offers unique preset identifiers", () => {
    expect(new Set(FILM_PRESETS.map((p) => p.id)).size).toBe(FILM_PRESETS.length);
  });

  it("leaves the original appearance unchanged at zero intensity", () => {
    const input = pixel(100, 130, 160, 55);
    applyFilmSimulation(input, "chrome", 0);
    expect(Array.from(input.data)).toEqual([100, 130, 160, 55]);
  });

  it("preserves alpha while changing RGB with a film recipe", () => {
    const input = pixel(120, 180, 70, 95);
    applyFilmSimulation(input, "mono", 100);
    expect(input.data[3]).toBe(95);
    expect(Math.abs(input.data[0] - input.data[1])).toBeLessThanOrEqual(1);
    expect(Math.abs(input.data[1] - input.data[2])).toBeLessThanOrEqual(1);
  });

  it("clamps out-of-range strength to 0-100", () => {
    const low = pixel(120, 160, 200);
    applyFilmSimulation(low, "warm", -50);
    expect(Array.from(low.data)).toEqual([120, 160, 200]);
    const full = pixel(120, 160, 200);
    const high = pixel(120, 160, 200);
    applyFilmSimulation(full, "warm", 100);
    applyFilmSimulation(high, "warm", 300);
    expect(Array.from(high.data)).toEqual(Array.from(full.data));
  });
});
