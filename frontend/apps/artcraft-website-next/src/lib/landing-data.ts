import { mediaUrl } from "./links";

// Product feature roster, ported from the shipping landing page. Copy is the
// approved marketing copy — edit deliberately, not casually.
export type Feature = {
  index: string;
  label: string;
  title: string;
  description: string;
  video: string;
};

export const FEATURES: Feature[] = [
  {
    index: "01",
    label: "Worlds",
    title: "Image to Location",
    description:
      "Place virtual actors into physical environments. Establish single-location consistency and film multiple shots in a room without things disappearing.",
    video: mediaUrl("/videos/features/WorldLabs_Demo_2.webm"),
  },
  {
    index: "02",
    label: "3D Compositing",
    title: "Build scenes with depth",
    description:
      "Use images, backdrops, foreground elements, and props in scenes with real depth. A couple of images blends naturally into a finished composition.",
    video: mediaUrl("/videos/features/Panel.webm"),
  },
  {
    index: "03",
    label: "2D Compositing",
    title: "Precise layered control",
    description:
      "Combine images, background removal, layers, and simple drawing tools to compose a scene exactly the way you imagined it.",
    video: mediaUrl("/videos/features/Editor.webm"),
  },
  {
    index: "04",
    label: "3D Mesh",
    title: "Image to 3D Mesh",
    description:
      "Turning images into 3D helps position elements exactingly. Block complex scenes with intentional geometry instead of fighting prompts.",
    video: mediaUrl("/videos/features/Make_3D.webm"),
  },
  {
    index: "05",
    label: "Mixed Assets",
    title: "Mix every kind of asset",
    description:
      "Combine image cutouts, worlds, and 3D meshes in one canvas to lay out scenes with precision and intention.",
    video: mediaUrl("/videos/features/Mixed.webm"),
  },
  {
    index: "06",
    label: "Posing",
    title: "Character Posing",
    description:
      'Dynamically pose your characters to nail the precise character, scene, and camera blocking before calling "action".',
    video: mediaUrl("/videos/features/Character-Pose.webm"),
  },
  {
    index: "07",
    label: "Cutouts",
    title: "Background Removal",
    description:
      "Instantly remove backgrounds from images to create assets for your scenes. Clean, precise, and ready for compositing.",
    video: mediaUrl("/videos/features/Background.webm"),
  },
];

export const HERO_VIDEO_URL =
  "https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/website-commercial-2026.05.mp4";

export const MADE_WITH_YOUTUBE_IDS = [
  "HDdsKJl92H4",
  "oqoCWdOwr2U",
  "H4NFXGMuwpY",
];

export const TICKER_ITEMS = [
  "Seedance 2.0",
  "Nano Banana 2",
  "Image to Location",
  "3D Compositing",
  "Character Posing",
  "Image to 3D Mesh",
  "Background Removal",
  "2D Compositing",
  "Mixed Assets",
];
