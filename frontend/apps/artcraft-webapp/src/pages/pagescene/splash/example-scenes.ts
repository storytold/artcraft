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

// TODO: swap each remaining placeholder entry to its own real scene/output
// tokens once they ship. The card renders the output image as its preview
// and the prompt's first reference image on hover, so a "real" entry just
// needs valid tokens — no extra fields.
const PLACEHOLDER_SCENE_TOKEN = "m_tz8vm3vw3xsk5z5qvpq1y9cczdn2vp";
const PLACEHOLDER_OUTPUT_TOKEN = "m_90b2hbzdbpm98gqfx08x53wpwsa1ew";

export const EXAMPLE_SCENES: readonly ExampleScene[] = [
  {
    id: "lone-drifter",
    title: "Lone Drifter",
    description: "Sundown standoff, dust on the wind",
    accentClass: "from-orange-500/30 to-amber-700/20",
    sceneToken: "m_ywnjq1bdjw2163p456tczbg5p7ean8",
    outputToken: "m_9n2w5c4teefm21nhsceex3degeca9h",
  },
  {
    id: "black-sails",
    title: "Black Sails",
    description: "Galleon at dawn, salt on the bow",
    accentClass: "from-slate-700/30 to-teal-800/20",
    sceneToken: PLACEHOLDER_SCENE_TOKEN,
    outputToken: PLACEHOLDER_OUTPUT_TOKEN,
  },
  {
    id: "cold-brew-hero",
    title: "Cold Brew",
    description: "Studio bottle shot, soft rim light",
    accentClass: "from-amber-900/30 to-stone-700/20",
    sceneToken: "m_c8earcb2pnhb4n6pnbcfn01hg9vn9w",
    outputToken: "m_a5y9cvskk8xe2y4j3hjskrha86x65q",
  },
];
