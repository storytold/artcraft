import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PANEL_CONFIG } from "../panels/layout";

// Persisted per-user panel sizing for the editor's resizable split-panel
// layout. The `name: "panel-sizes"` key is shared across desktop + web
// hosts so a user's preferred sizes follow them between the two.
// Migration handles the v1 schema where the panel sizes were spread at
// the root of the persisted state rather than nested under `panels`.

export interface PanelSizes {
  tools: number;
  preview: number;
  properties: number;
  mainContent: number;
  timeline: number;
}

export type PanelId = keyof PanelSizes;

interface PanelState {
  panels: PanelSizes;
  setPanel: (args: { panel: PanelId; size: number }) => void;
  setPanels: (sizes: Partial<PanelSizes>) => void;
  resetPanels: () => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      ...PANEL_CONFIG,
      setPanel: ({ panel, size }) =>
        set((state) => ({
          panels: {
            ...state.panels,
            [panel]: size,
          },
        })),
      setPanels: (sizes) =>
        set((state) => ({
          panels: {
            ...state.panels,
            ...sizes,
          },
        })),
      resetPanels: () => set({ ...PANEL_CONFIG }),
    }),
    {
      name: "panel-sizes",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as
          | {
              panels?: Partial<PanelSizes> | null;
              toolsPanel?: number;
              previewPanel?: number;
              propertiesPanel?: number;
              mainContent?: number;
              timeline?: number;
              tools?: number;
              preview?: number;
              properties?: number;
            }
          | undefined
          | null;

        if (!state) return { panels: { ...PANEL_CONFIG.panels } };

        if (state.panels && typeof state.panels === "object") {
          return {
            panels: {
              ...PANEL_CONFIG.panels,
              ...state.panels,
            },
          };
        }

        return {
          panels: {
            tools: state.tools ?? state.toolsPanel ?? PANEL_CONFIG.panels.tools,
            preview:
              state.preview ??
              state.previewPanel ??
              PANEL_CONFIG.panels.preview,
            properties:
              state.properties ??
              state.propertiesPanel ??
              PANEL_CONFIG.panels.properties,
            mainContent: state.mainContent ?? PANEL_CONFIG.panels.mainContent,
            timeline: state.timeline ?? PANEL_CONFIG.panels.timeline,
          },
        };
      },
      partialize: (state) => ({
        panels: state.panels,
      }),
    },
  ),
);
