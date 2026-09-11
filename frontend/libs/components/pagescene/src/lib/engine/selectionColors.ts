// Brand selection palette for the editor's 3D scene. Both the outline
// pulse in SelectionOutlinePass and the splat bbox wireframe in
// internalBbox source their colors from here so the visual language
// stays consistent across the two cues. Tweak one constant and both
// surfaces follow.

// Pale orange — the bright end of the outline pulse.
export const SELECTION_OUTLINE_COLOR = 0xffa554;

// Dark orange — the dim end of the outline pulse AND the static
// color used for the splat bbox wireframe (no animation there).
export const SELECTION_OUTLINE_ACCENT_COLOR = 0xe87d0d;
