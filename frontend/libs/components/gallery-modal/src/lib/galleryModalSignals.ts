import { signal } from "@preact/signals-react";

// Gallery Modal Signals
export const galleryModalVisibleDuringDrag = signal(true);
export const galleryReopenAfterDragSignal = signal(false);
export const galleryModalVisibleViewMode = signal(false);

// Lightbox Modal Signals
export const galleryModalLightboxMediaId = signal<string | null>(null);
export const galleryModalLightboxVisible = signal(false);
export const galleryModalLightboxImage = signal<any>(null);
