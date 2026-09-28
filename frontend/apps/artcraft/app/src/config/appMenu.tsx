import { BoxIcon, CrosshairIcon, DropletIcon, FilmIcon, GlobeIcon, GroupIcon, ImageIcon, ImagesIcon, MusicIcon, PenToolIcon, PencilIcon, SparklesIcon, WandSparklesIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import {
  useExperimentalStore,
  useStoryboardPageEnabled,
} from "@storyteller/ui-settings-modal";
import { useTabStore, TabId } from "~/pages/Stores/TabState";

export type AppId =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "EDIT"
  | "2D"
  | "3D"
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

export interface AppDescriptor {
  id: AppId;
  label: string;
  icon: LucideIcon;
  imageSrc?: string;
  description?: string;
  large?: boolean;
}

export const APP_DESCRIPTORS: AppDescriptor[] = [
  {
    id: "IMAGE",
    label: "Create Image",
    icon: ImageIcon,
  },
  {
    id: "VIDEO",
    label: "Create Video",
    icon: FilmIcon,
  },
  {
    id: "AUDIO",
    label: "Create Audio",
    icon: MusicIcon,
  },
  {
    id: "2D",
    label: "Image Editor",
    icon: PenToolIcon,
    imageSrc: "/resources/gifs/2D_CANVAS_DEMO.webp",
    description: "Easy edits. Great for graphic design.",
    large: true,
  },
  {
    id: "3D",
    label: "3D Stage",
    icon: BoxIcon,
    imageSrc: "/resources/gifs/3D_CANVAS_DEMO.webp",
    description: "Precision control. Great for AI film.",
    large: true,
  },
];

export interface FullAppItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: "generate" | "edit";
  badge?: "NEW" | "BEST" | "SOON" | "BETA";
  action?: AppId;
  /** Legacy single-tone icon-square background (e.g. "bg-blue-600/40"). Still
   *  used as the fallback for the apps-page card styling. */
  color?: string;
}

// Per-app card palette for the Apps page (webapp-home-style cards). Derived
// from each app's Tailwind color family so the icon tile, its border, and the
// hover state all share a hue. Keyed by app id; falls back to a neutral tone
// when an id is missing.
interface AppCardPalette {
  /** Hover tint for the card, e.g. "from-blue-500/20 to-blue-500/0". Legacy. */
  accent: string;
  /** Icon tile background + border, e.g. "bg-blue-500/20 border-blue-400/40". */
  iconBg: string;
  /** Icon glyph color, e.g. "text-blue-300". */
  iconColor: string;
  /** Card hover border + background, e.g. "hover:border-blue-400/60 hover:bg-blue-500/10". */
  hoverStyle: string;
}

const APP_CARD_PALETTES: Record<string, AppCardPalette> = {
  "text-to-image": {
    accent: "from-blue-500/20 to-blue-500/0",
    iconBg: "bg-blue-500/20 border-blue-400/40",
    iconColor: "text-blue-300",
    hoverStyle: "hover:border-blue-400/60 hover:bg-blue-500/10",
  },
  "image-to-video": {
    accent: "from-purple-500/20 to-purple-500/0",
    iconBg: "bg-purple-500/20 border-purple-400/40",
    iconColor: "text-purple-300",
    hoverStyle: "hover:border-purple-400/60 hover:bg-purple-500/10",
  },
  "create-audio": {
    accent: "from-pink-500/20 to-pink-500/0",
    iconBg: "bg-pink-500/20 border-pink-400/40",
    iconColor: "text-pink-300",
    hoverStyle: "hover:border-pink-400/60 hover:bg-pink-500/10",
  },
  "image-to-3d-object": {
    accent: "from-cyan-500/20 to-cyan-500/0",
    iconBg: "bg-cyan-500/20 border-cyan-400/40",
    iconColor: "text-cyan-300",
    hoverStyle: "hover:border-cyan-400/60 hover:bg-cyan-500/10",
  },
  "image-to-3d-world": {
    accent: "from-teal-500/20 to-teal-500/0",
    iconBg: "bg-teal-500/20 border-teal-400/40",
    iconColor: "text-teal-300",
    hoverStyle: "hover:border-teal-400/60 hover:bg-teal-500/10",
  },
  "3d-editor": {
    accent: "from-amber-500/20 to-amber-500/0",
    iconBg: "bg-amber-500/20 border-amber-400/40",
    iconColor: "text-amber-300",
    hoverStyle: "hover:border-amber-400/60 hover:bg-amber-500/10",
  },
  "background-change": {
    accent: "from-emerald-500/20 to-emerald-500/0",
    iconBg: "bg-emerald-500/20 border-emerald-400/40",
    iconColor: "text-emerald-300",
    hoverStyle: "hover:border-emerald-400/60 hover:bg-emerald-500/10",
  },
  "video-editor": {
    accent: "from-rose-500/20 to-rose-500/0",
    iconBg: "bg-rose-500/20 border-rose-400/40",
    iconColor: "text-rose-300",
    hoverStyle: "hover:border-rose-400/60 hover:bg-rose-500/10",
  },
  moodboard: {
    accent: "from-indigo-500/20 to-indigo-500/0",
    iconBg: "bg-indigo-500/20 border-indigo-400/40",
    iconColor: "text-indigo-300",
    hoverStyle: "hover:border-indigo-400/60 hover:bg-indigo-500/10",
  },
  "video-frame-extractor": {
    accent: "from-orange-500/20 to-orange-500/0",
    iconBg: "bg-orange-500/20 border-orange-400/40",
    iconColor: "text-orange-300",
    hoverStyle: "hover:border-orange-400/60 hover:bg-orange-500/10",
  },
  "edit-image": {
    accent: "from-sky-500/20 to-sky-500/0",
    iconBg: "bg-sky-500/20 border-sky-400/40",
    iconColor: "text-sky-300",
    hoverStyle: "hover:border-sky-400/60 hover:bg-sky-500/10",
  },
  "2d-canvas": {
    accent: "from-sky-500/20 to-sky-500/0",
    iconBg: "bg-sky-500/20 border-sky-400/40",
    iconColor: "text-sky-300",
    hoverStyle: "hover:border-sky-400/60 hover:bg-sky-500/10",
  },
  "remove-background": {
    accent: "from-violet-500/20 to-violet-500/0",
    iconBg: "bg-violet-500/20 border-violet-400/40",
    iconColor: "text-violet-300",
    hoverStyle: "hover:border-violet-400/60 hover:bg-violet-500/10",
  },
  angles: {
    accent: "from-lime-500/20 to-lime-500/0",
    iconBg: "bg-lime-500/20 border-lime-400/40",
    iconColor: "text-lime-300",
    hoverStyle: "hover:border-lime-400/60 hover:bg-lime-500/10",
  },
  storyboard: {
    accent: "from-fuchsia-500/20 to-fuchsia-500/0",
    iconBg: "bg-fuchsia-500/20 border-fuchsia-400/40",
    iconColor: "text-fuchsia-300",
    hoverStyle: "hover:border-fuchsia-400/60 hover:bg-fuchsia-500/10",
  },
  "video-watermark-removal": {
    accent: "from-yellow-500/20 to-yellow-500/0",
    iconBg: "bg-yellow-500/20 border-yellow-400/40",
    iconColor: "text-yellow-300",
    hoverStyle: "hover:border-yellow-400/60 hover:bg-yellow-500/10",
  },
  "image-watermark-removal": {
    accent: "from-red-500/20 to-red-500/0",
    iconBg: "bg-red-500/20 border-red-400/40",
    iconColor: "text-red-300",
    hoverStyle: "hover:border-red-400/60 hover:bg-red-500/10",
  },
};

const FALLBACK_APP_CARD_PALETTE: AppCardPalette = {
  accent: "from-white/10 to-white/0",
  iconBg: "bg-ui-controls border-ui-controls-border",
  iconColor: "text-base-fg",
  hoverStyle: "hover:border-white/30 hover:bg-white/10",
};

export const getAppCardPalette = (id: string): AppCardPalette =>
  APP_CARD_PALETTES[id] ?? FALLBACK_APP_CARD_PALETTE;

export const ALL_APPS: FullAppItem[] = [
  {
    id: "text-to-image",
    label: "Create Image",
    description: "Generate AI images",
    icon: ImageIcon,
    category: "generate",
    action: "IMAGE",
    color: "bg-blue-600/40",
  },
  {
    id: "image-to-video",
    label: "Create Video",
    description: "Create video from images",
    icon: FilmIcon,
    category: "generate",
    action: "VIDEO",
    color: "bg-amber-500/40",
  },
  {
    id: "create-audio",
    label: "Create Audio",
    description: "Generate music and sound effects",
    icon: MusicIcon,
    category: "generate",
    action: "AUDIO",
    color: "bg-pink-500/40",
  },
  {
    id: "image-to-3d-object",
    label: "Image to 3D Object",
    description: "Convert references into textured assets",
    icon: BoxIcon,
    category: "generate",
    action: "IMAGE_TO_3D_OBJECT",
    color: "bg-emerald-500/40",
  },
  {
    id: "image-to-3d-world",
    label: "Image to 3D World",
    description: "Turn mood boards into explorable worlds",
    icon: GlobeIcon,
    category: "generate",
    action: "IMAGE_TO_3D_WORLD",
    color: "bg-blue-500/40",
  },
  {
    id: "edit-image",
    label: "Edit Image",
    description: "Change with inpainting",
    icon: PencilIcon,
    category: "edit",
    action: "2D",
    color: "bg-purple-600/40",
  },
  {
    id: "video-frame-extractor",
    label: "Video Frame Extractor",
    description: "Extract frames from video",
    icon: ImagesIcon,
    category: "edit",
    action: "VIDEO_FRAME_EXTRACTOR",
    color: "bg-rose-600/40",
  },
  {
    id: "video-watermark-removal",
    label: "Video Watermark Remover",
    description: "Remove watermarks from videos",
    icon: DropletIcon,
    category: "edit",
    badge: "SOON",
    color: "bg-cyan-500/40",
  },
  {
    id: "image-watermark-removal",
    label: "Image Watermark Remover",
    description: "Remove watermarks from images",
    icon: DropletIcon,
    category: "edit",
    badge: "SOON",
    color: "bg-indigo-600/40",
  },
  {
    id: "remove-background",
    label: "Remove Background",
    description: "Remove backgrounds from images",
    icon: WandSparklesIcon,
    category: "edit",
    action: "REMOVE_BACKGROUND",
    color: "bg-violet-500/40",
  },
  {
    id: "angles",
    label: "Angles",
    description: "Generate new camera angles from a single photo",
    icon: CrosshairIcon,
    category: "generate",
    action: "ANGLES",
    color: "bg-lime-500/40",
    badge: "NEW",
  },

  {
    id: "storyboard",
    label: "Storyboard",
    description: "Plan your shots with a visual storyboard",
    icon: ImagesIcon,
    category: "generate",
    action: "STORYBOARD",
    color: "bg-fuchsia-600/40",
    badge: "NEW",
  },
  {
    id: "moodboard",
    label: "Moodboard",
    description: "Collect references and steer generations from a board",
    icon: GroupIcon,
    category: "generate",
    action: "MOODBOARD",
    color: "bg-orange-500/40",
    badge: "BETA",
  },
  {
    id: "background-change",
    label: "Background Change",
    description: "Swap the backdrop of a video using a reference image",
    icon: SparklesIcon,
    category: "edit",
    action: "BACKGROUND_CHANGE",
    color: "bg-orange-500/40",
    badge: "NEW",
  },
  {
    id: "video-editor",
    label: "Video Editor",
    description: "Edit and assemble videos on a timeline",
    icon: FilmIcon,
    category: "edit",
    action: "VIDEO_EDITOR",
    color: "bg-teal-500/40",
    badge: "BETA",
  },
  {
    id: "2d-canvas",
    label: "Image Editor",
    description: "Easy edits. Great for graphic design.",
    icon: PenToolIcon,
    category: "edit",
    action: "2D",
    color: "bg-sky-500/40",
  },
  {
    id: "3d-editor",
    label: "3D Stage",
    description: "Precision control. Great for AI film.",
    icon: BoxIcon,
    category: "generate",
    action: "3D",
    color: "bg-emerald-600/40",
  },
];

export const GENERATE_APPS = ALL_APPS.filter(
  (app) => app.category === "generate",
);
export const EDIT_APPS = ALL_APPS.filter((app) => app.category === "edit");

export const useVisibleApps = (): FullAppItem[] => {
  const storyboardEnabled = useStoryboardPageEnabled();
  return useMemo(
    () =>
      ALL_APPS.filter((app) => {
        // Background Change is hidden in the desktop app for now.
        if (app.action === "BACKGROUND_CHANGE") return false;
        if (app.action === "STORYBOARD") return storyboardEnabled;
        return true;
      }),
    [storyboardEnabled],
  );
};

export const useGenerateApps = (): FullAppItem[] => {
  const visible = useVisibleApps();
  return useMemo(
    () => visible.filter((app) => app.category === "generate"),
    [visible],
  );
};

export const useEditApps = (): FullAppItem[] => {
  const visible = useVisibleApps();
  return useMemo(
    () => visible.filter((app) => app.category === "edit"),
    [visible],
  );
};

export const getBadgeStyles = (badge?: string) => {
  switch (badge) {
    case "NEW":
      return "border-purple-400/40 text-purple-300";
    case "BEST":
      return "border-primary/30 text-ui-accent-ink";
    case "SOON":
      return "border-white/20 text-base-fg/50";
    case "BETA":
      return "border-amber-400/40 text-amber-300";
    default:
      return "";
  }
};

export const goToApp = (action?: string) => {
  if (
    action &&
    [
      "IMAGE",
      "VIDEO",
      "AUDIO",
      "2D",
      "3D",
      "VIDEO_FRAME_EXTRACTOR",
      "VIDEO_WATERMARK_REMOVAL",
      "IMAGE_WATERMARK_REMOVAL",
      "IMAGE_TO_3D_OBJECT",
      "IMAGE_TO_3D_WORLD",
      "REMOVE_BACKGROUND",
      "ANGLES",
      "STORYBOARD",
      "BACKGROUND_CHANGE",
      "VIDEO_EDITOR",
      "MOODBOARD",
    ].includes(action)
  ) {
    if (action === "STORYBOARD") {
      const { enabled, storyboardPageEnabled } =
        useExperimentalStore.getState();
      if (!enabled || !storyboardPageEnabled) return;
    }
    useTabStore.getState().setActiveTab(action as TabId);
  }
};
