import { signal } from "@preact/signals-react";

// Gallery Modal Signals
export const galleryModalVisibleDuringDrag = signal(true);
export const galleryReopenAfterDragSignal = signal(false);
export const galleryModalVisibleViewMode = signal(false);

// Lightbox Modal Signals
export const galleryModalLightboxMediaId = signal<string | null>(null);
export const galleryModalLightboxVisible = signal(false);
export const galleryModalLightboxImage = signal<any>(null);
// Custom nav callbacks – set by pages that manage their own item list (e.g.
// TextToImage). Null when opened from the gallery browse, in which case the
// gallery's own computed handlers are used instead.
export const galleryModalLightboxNavPrev = signal<(() => void) | null>(null);
export const galleryModalLightboxNavNext = signal<(() => void) | null>(null);
