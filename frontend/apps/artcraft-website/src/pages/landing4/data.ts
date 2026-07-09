// Content data for landing4. Feature copy mirrors landing3's FEATURES array so
// the two landings stay in sync on messaging while diverging on presentation.

export interface Feature {
  label: string;
  title: string;
  description: string;
  src: string;
}

export const FEATURES: ReadonlyArray<Feature> = [
  {
    label: "Worlds",
    title: "Image to Location",
    description:
      "Place virtual actors into physical environments. Establish single-location consistency and film multiple shots in a room without things disappearing.",
    src: "/videos/features/WorldLabs_Demo_2.webm",
  },
  {
    label: "3D Compositing",
    title: "Build scenes with depth",
    description:
      "Use images, backdrops, foreground elements, and props in scenes with real depth. A couple of images blends naturally into a finished composition.",
    src: "/videos/features/Panel.webm",
  },
  {
    label: "2D Compositing",
    title: "Precise layered control",
    description:
      "Combine images, background removal, layers, and simple drawing tools to compose a scene exactly the way you imagined it.",
    src: "/videos/features/Editor.webm",
  },
  {
    label: "3D Mesh",
    title: "Image to 3D Mesh",
    description:
      "Turning images into 3D helps position elements exactingly. Block complex scenes with intentional geometry instead of fighting prompts.",
    src: "/videos/features/Make_3D.webm",
  },
  {
    label: "Mixed Assets",
    title: "Mix every kind of asset",
    description:
      "Combine image cutouts, worlds, and 3D meshes in one canvas to lay out scenes with precision and intention.",
    src: "/videos/features/Mixed.webm",
  },
  {
    label: "Posing",
    title: "Character Posing",
    description:
      'Dynamically pose your characters to nail the precise character, scene, and camera blocking before calling "action".',
    src: "/videos/features/Pose_Second_Version.webm",
  },
  {
    label: "Cutouts",
    title: "Background Removal",
    description:
      "Instantly remove backgrounds from images to create assets for your scenes. Clean, precise, and ready for compositing.",
    src: "/videos/features/Background.webm",
  },
];

export const MANIFESTO_WORDS: ReadonlyArray<string> = [
  "ArtCraft",
  "brings",
  "control",
  "to",
  "AI",
  "image",
  "and",
  "video",
  "generation,",
  "giving",
  "artists",
  "like",
  "you",
  "full",
  "power",
  "over",
  "every",
  "shot.",
];

// Words rendered in flare once the manifesto scrub reaches them.
export const MANIFESTO_ACCENT_WORDS: ReadonlySet<string> = new Set([
  "control",
  "artists",
]);

export const TICKER_ITEMS: ReadonlyArray<string> = [
  "IMAGE",
  "VIDEO",
  "3D",
  "OPEN SOURCE",
  "EVERY MODEL",
  "NO PROMPTS REQUIRED",
  "MADE BY ARTISTS",
];

export interface Provider {
  name: string;
  src: string;
}

export const PROVIDERS: ReadonlyArray<Provider> = [
  { name: "OpenAI", src: "/images/services/openai.svg" },
  { name: "Google", src: "/images/services/google.svg" },
  { name: "Midjourney", src: "/images/services/midjourney.svg" },
  { name: "ByteDance", src: "/images/services/bytedance.svg" },
  { name: "Kling", src: "/images/services/kling.svg" },
  { name: "Black Forest", src: "/images/services/blackforestlabs.svg" },
  { name: "World Labs", src: "/images/services/worldlabs.svg" },
  { name: "Alibaba", src: "/images/services/alibaba.svg" },
  { name: "Tencent", src: "/images/services/tencent.svg" },
  { name: "Grok", src: "/images/services/grok.svg" },
  { name: "Recraft", src: "/images/services/recraft.svg" },
  { name: "Vidu", src: "/images/services/vidu.svg" },
  { name: "Suno", src: "/images/services/suno.svg" },
  { name: "Krea", src: "/images/services/krea.svg" },
  { name: "Higgsfield", src: "/images/services/higgsfield.svg" },
  { name: "Replicate", src: "/images/services/replicate.svg" },
  { name: "Fal", src: "/images/services/fal.svg" },
  { name: "OpenArt", src: "/images/services/openart.svg" },
  { name: "TensorArt", src: "/images/services/tensorart.svg" },
];

export interface MadeWithVideo {
  embedUrl: string;
  caption: string;
}

export const MADE_WITH_VIDEOS: ReadonlyArray<MadeWithVideo> = [
  {
    embedUrl: "https://www.youtube.com/embed/HDdsKJl92H4?si=0Hm4AweSRHq3qRt6",
    caption: "FILM_001 — COMMUNITY",
  },
  {
    embedUrl: "https://www.youtube.com/embed/oqoCWdOwr2U?si=ILMPk8hGHo9hP8RU",
    caption: "FILM_002 — COMMUNITY",
  },
  {
    embedUrl: "https://www.youtube.com/embed/H4NFXGMuwpY?si=wPuQl5cJOu1v8MJu",
    caption: "FILM_003 — COMMUNITY",
  },
];

export interface LedgerRow {
  text: string;
}

export const RENTAL_ROWS: ReadonlyArray<string> = [
  "Paying for access, not a product",
  "Your work lives on someone else's servers",
  "Monthly fees, forever",
  "Locked into one provider's models",
  "History disappears when they do",
];

export const OWNERSHIP_ROWS: ReadonlyArray<string> = [
  "Download it. It's yours, forever",
  "Open source, on your desktop",
  "Your files stay on your machine",
  "Every model in one canvas",
  "Bring your own API keys, or use ours",
];
