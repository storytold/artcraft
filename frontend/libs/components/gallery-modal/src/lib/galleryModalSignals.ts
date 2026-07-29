import { signal } from "@preact/signals-react";

// Gallery Modal Signals
export const galleryModalVisibleDuringDrag = signal(true);
export const galleryReopenAfterDragSignal = signal(false);
export const galleryModalVisibleViewMode = signal(false);
// True while an item is being dragged out of the gallery. The modal stays open
// but goes translucent and pointer-transparent so the drag can pass "under" it
// onto the canvas; it refocuses (or closes, per the reopen-after-adding setting)
// on drop.
export const galleryModalDraggingUnder = signal(false);

// When true, the gallery hides the moment a drag starts (instead of only once
// the cursor leaves the modal bounds). Set by hosts where the primary drop
// target is a full-screen canvas directly behind the modal — e.g. the 3D editor
// page — so the user can immediately drop an asset into the scene. Elsewhere
// (Library, Draw, Moodboard) it stays false so sidebar folders remain targetable.
export const galleryDragHidesImmediately = signal(false);

// Lightbox Modal Signals
export const galleryModalLightboxMediaId = signal<string | null>(null);
export const galleryModalLightboxVisible = signal(false);
export const galleryModalLightboxImage = signal<any>(null);
// Custom nav callbacks – set by pages that manage their own item list (e.g.
// TextToImage). Null when opened from the gallery browse, in which case the
// gallery's own computed handlers are used instead.
export const galleryModalLightboxNavPrev = signal<(() => void) | null>(null);
export const galleryModalLightboxNavNext = signal<(() => void) | null>(null);
