/**
 * UI state for the timeline
 * For core logic, use EditorCore instead.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimelineStore {
  snappingEnabled: boolean;
  toggleSnapping: () => void;
  rippleEditingEnabled: boolean;
  toggleRippleEditing: () => void;
  expandedElementIds: Set<string>;
  toggleElementExpanded: (elementId: string) => void;
}

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set) => ({
      snappingEnabled: true,

      toggleSnapping: () => {
        set((state) => ({ snappingEnabled: !state.snappingEnabled }));
      },

      rippleEditingEnabled: false,

      toggleRippleEditing: () => {
        set((state) => ({
          rippleEditingEnabled: !state.rippleEditingEnabled,
        }));
      },

      expandedElementIds: new Set<string>(),

      toggleElementExpanded: (elementId) => {
        set((state) => {
          const next = new Set(state.expandedElementIds);
          if (next.has(elementId)) {
            next.delete(elementId);
          } else {
            next.add(elementId);
          }
          return { expandedElementIds: next };
        });
      },
    }),
    {
      name: "timeline-store",
      partialize: (state) => ({
        snappingEnabled: state.snappingEnabled,
        rippleEditingEnabled: state.rippleEditingEnabled,
      }),
    },
  ),
);
