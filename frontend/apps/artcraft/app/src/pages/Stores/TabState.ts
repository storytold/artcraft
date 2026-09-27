import { create } from "zustand";

export type TabId =
  | "2D"
  | "3D"
  | "VIDEO"
  | "EDIT"
  | "IMAGE"
  | "AUDIO"
  | "APPS"
  | "VIDEO_FRAME_EXTRACTOR"
  | "VIDEO_WATERMARK_REMOVAL"
  | "IMAGE_WATERMARK_REMOVAL"
  | "IMAGE_TO_3D_OBJECT"
  | "IMAGE_TO_3D_WORLD"
  | "REMOVE_BACKGROUND"
  | "ANGLES"
  | "STORYBOARD"
  | "BACKGROUND_CHANGE"
  | "VIDEO_EDITOR"
  | "MOODBOARD";

const DEFAULT_TAB: TabId = "APPS";

interface TabState {
  // Current active tab
  activeTabId: TabId;
  // Tab data stored as stringified JSON
  tabData: {
    [K in TabId]?: string;
  };
  // Actions
  setActiveTab: (tabId: TabId) => Promise<boolean>;
  updateTabData: (tabId: TabId, data: unknown) => void;
  getTabData: <T>(tabId: TabId) => T | null;
  clearTabData: (tabId: TabId) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  activeTabId: DEFAULT_TAB,
  tabData: {},

  setActiveTab: async (newTabId) => {
    // Don't do anything if we're already on this tab
    if (get().activeTabId === newTabId) return true;

    // The drawing store outlives its React page. Keep its live image objects,
    // selection, and undo history when switching tabs. Export/import is for
    // files; round-tripping here reread every image and rebuilt the scene.
    set({ activeTabId: newTabId });
    return true;
  },

  updateTabData: (tabId, data) => {
    set((state) => ({
      tabData: {
        ...state.tabData,
        [tabId]: JSON.stringify(data),
      },
    }));
  },

  getTabData: <T>(tabId: TabId): T | null => {
    const state = get();
    const data = state.tabData[tabId];
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error parsing tab data for ${tabId}:`, e);
      return null;
    }
  },

  clearTabData: (tabId) => {
    set((state) => {
      const newTabData = { ...state.tabData };
      delete newTabData[tabId];
      return { tabData: newTabData };
    });
  },
}));
