// Default sticker render-canvas size when the source SVG/image hasn't
// reported its natural dimensions yet. Stays in sync with the
// `intrinsicWidth`/`intrinsicHeight` fields on StickerElement —
// once a sticker is loaded once, its real size is cached on the
// element and this fallback is only used during the first paint.
export const STICKER_INTRINSIC_SIZE_FALLBACK = 200;
