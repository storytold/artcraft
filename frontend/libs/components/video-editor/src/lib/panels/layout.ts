// Default panel split percentages. The PanelStore uses these as the
// initial state and as the fallback when the persisted snapshot is
// missing or pre-v2.
//
// `tools / preview / properties` partition the editor's top half (the
// assets + preview + properties strip). `mainContent / timeline`
// partition the vertical split between the top half and the timeline.
export const PANEL_CONFIG = {
  panels: {
    tools: 25,
    preview: 50,
    properties: 25,
    mainContent: 50,
    timeline: 50,
  },
} as const;
