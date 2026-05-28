function svgCursor({
  svg,
  hotspotX,
  hotspotY,
}: {
  svg: string;
  hotspotX: number;
  hotspotY: number;
}): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspotX} ${hotspotY}, crosshair`;
}

/** Hotspot is at the nib tip, which is where anchor points land. */
export const PEN_CURSOR = svgCursor({
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M 1 1 L 5 2 L 13 10 L 10 13 L 2 5 Z" fill="white" stroke="#111" stroke-width="1" stroke-linejoin="round"/>
  <path d="M 1 1 L 5 2 L 2 5 Z" fill="#111"/>
</svg>`,
  hotspotX: 1,
  hotspotY: 1,
});
