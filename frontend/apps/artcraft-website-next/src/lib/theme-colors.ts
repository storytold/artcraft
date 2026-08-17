// Resolves design tokens to concrete hex colors for WebGL scenes, which can't
// read CSS custom properties themselves. Tokens with alpha (the hairline
// colors) are flattened against a backdrop token so materials can stay opaque.

export type ThemeColors = {
  bg: string;
  bgSunken: string;
  ink: string;
  line: string;
  lineStrong: string;
  accent: string;
  accentInk: string;
};

export function deriveThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);

  const resolve = (token: string): [number, number, number, number] => {
    probe.style.color = "";
    probe.style.color = styles.getPropertyValue(token).trim();
    const parsed = getComputedStyle(probe).color.match(/[\d.]+/g) ?? [];
    const [r = 0, g = 0, b = 0, a = 1] = parsed.map(Number);
    return [r, g, b, a];
  };

  const toHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;

  const bg = resolve("--bg");
  const bgSunken = resolve("--bg-sunken");
  const flattenOver =
    (base: [number, number, number, number]) =>
    ([r, g, b, a]: [number, number, number, number]) =>
      toHex(
        r * a + base[0] * (1 - a),
        g * a + base[1] * (1 - a),
        b * a + base[2] * (1 - a),
      );
  const flat = flattenOver(bgSunken);

  const colors: ThemeColors = {
    bg: toHex(bg[0], bg[1], bg[2]),
    bgSunken: toHex(bgSunken[0], bgSunken[1], bgSunken[2]),
    ink: flat(resolve("--ink")),
    line: flat(resolve("--line")),
    lineStrong: flat(resolve("--line-strong")),
    accent: flat(resolve("--accent")),
    accentInk: flat(resolve("--accent-ink")),
  };

  probe.remove();
  return colors;
}

// Re-derives colors whenever the theme flips (explicit toggle or system
// preference change). Returns an unsubscribe function.
export function watchThemeColors(
  onChange: (colors: ThemeColors) => void,
): () => void {
  const derive = () => onChange(deriveThemeColors());
  derive();

  const observer = new MutationObserver(derive);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", derive);
  return () => {
    observer.disconnect();
    mq.removeEventListener("change", derive);
  };
}
