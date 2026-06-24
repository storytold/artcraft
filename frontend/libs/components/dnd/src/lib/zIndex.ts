// Centralized z-index scale for drag-and-drop chrome. Replaces ad-hoc values
// like `z-[9999]` / `z-99999` that fought each other and the modal layer.
//
// Deliberately kept LOW enough that the catch-all upload overlay sits *below*
// app modals (so a modal stays interactive during a drag), while the drag ghost
// and drop ripple float above the overlay. App modals/dialogs should remain
// above `ghost`.
export const DND_Z = {
  /** Full-screen "drop to upload" catch-all backdrop. */
  overlay: 55,
  /** Per-target accept/reject ring drawn on a field. */
  highlight: 60,
  /** Drop-success ripple at the landing point. */
  ripple: 65,
  /** Floating drag preview that follows the cursor. */
  ghost: 70,
} as const;
