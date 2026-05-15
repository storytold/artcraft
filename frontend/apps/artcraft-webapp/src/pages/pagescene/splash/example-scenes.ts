// Example-scene data for the edit-3D splash. Each card opens
// `/edit-3d/${sceneToken}?output=${outputToken}` so the editor mounts
// the scene and the demo-output overlay renders the AI-generated still
// next to it. Real per-scene tokens land later; for now every entry
// points at the same demo pair so the feature is exercised end-to-end.

export interface ExampleScene {
  id: string;
  title: string;
  description: string;
  // Tailwind gradient class fragment used by the card's thumbnail. Kept
  // as a class string (not a CSS color) so JIT picks it up at build time.
  accentClass: string;
  sceneToken: string;
  outputToken: string;
}

// TODO: swap each entry to its own scene/output tokens once they ship.
const PLACEHOLDER_SCENE_TOKEN = "m_tz8vm3vw3xsk5z5qvpq1y9cczdn2vp";
const PLACEHOLDER_OUTPUT_TOKEN = "m_90b2hbzdbpm98gqfx08x53wpwsa1ew";

export const EXAMPLE_SCENES: readonly ExampleScene[] = [
  {
    id: "cyberpunk-alley",
    title: "Cyberpunk Alley",
    description: "Neon-lit street, ground fog",
    accentClass: "from-fuchsia-500/30 to-cyan-400/20",
    sceneToken: PLACEHOLDER_SCENE_TOKEN,
    outputToken: PLACEHOLDER_OUTPUT_TOKEN,
  },
  {
    id: "mountain-vista",
    title: "Mountain Vista",
    description: "Golden-hour ridgeline",
    accentClass: "from-amber-400/30 to-rose-400/20",
    sceneToken: PLACEHOLDER_SCENE_TOKEN,
    outputToken: PLACEHOLDER_OUTPUT_TOKEN,
  },
  {
    id: "mecha-workshop",
    title: "Mecha Workshop",
    description: "Industrial bay with rigs",
    accentClass: "from-sky-400/25 to-indigo-500/25",
    sceneToken: PLACEHOLDER_SCENE_TOKEN,
    outputToken: PLACEHOLDER_OUTPUT_TOKEN,
  },
];
