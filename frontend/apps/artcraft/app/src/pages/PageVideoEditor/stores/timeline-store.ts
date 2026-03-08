import { create } from "zustand";

interface TimelineUIStore {
  snappingEnabled: boolean;
  toggleSnapping: () => void;
}

export const useTimelineUIStore = create<TimelineUIStore>()((set) => ({
  snappingEnabled: true,
  toggleSnapping: () => set((s) => ({ snappingEnabled: !s.snappingEnabled })),
}));
