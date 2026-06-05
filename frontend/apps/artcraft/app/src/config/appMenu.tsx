import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCube,
  faFilm,
  faImage,
  faDroplet,
  faPhotoFilm,
  faGlobe,
  faPencil,
  faWandMagicSparkles,
  faPenNib,
  faCrosshairs,
  faSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { useMemo } from "react";
import {
  useExperimentalStore,
  useStoryboardPageEnabled,
} from "@storyteller/ui-settings-modal";
import { useTabStore, TabId } from "~/pages/Stores/TabState";

export type AppId =
  | "IMAGE"
  | "VIDEO"
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
  | "VIDEO_EDITOR";

export interface AppDescriptor {
  id: AppId;
  label: string;
  icon: IconDefinition;
  imageSrc?: string;
  description?: string;
  large?: boolean;
}

export const APP_DESCRIPTORS: AppDescriptor[] = [
  {
    id: "IMAGE",
    label: "Text to Image",
    icon: faImage,
  },
  {
    id: "VIDEO",
    label: "Generate Video",
    icon: faFilm,
  },
  {
    id: "2D",
    label: "Image Editor",
    icon: faPenNib,
    imageSrc: "/resources/gifs/2D_CANVAS_DEMO.gif",
    description: "Easy edits. Great for graphic design.",
    large: true,
  },
  {
    id: "3D",
    label: "3D Stage",
    icon: faCube,
    imageSrc: "/resources/gifs/3D_CANVAS_DEMO.gif",
    description: "Precision control. Great for AI film.",
    large: true,
  },
];

export interface FullAppItem {
  id: string;
  label: string;
  description: string;
  icon: IconDefinition;
  category: "generate" | "edit";
  badge?: "NEW" | "BEST" | "SOON" | "BETA";
  action?: AppId;
  color?: string;
}

export const ALL_APPS: FullAppItem[] = [
  {
    id: "text-to-image",
    label: "Text to Image",
    description: "Generate AI images",
    icon: faImage,
    category: "generate",
    action: "IMAGE",
    color: "bg-blue-600/40",
  },
  {
    id: "image-to-video",
    label: "Generate Video",
    description: "Create video from images",
    icon: faFilm,
    category: "generate",
    action: "VIDEO",
    color: "bg-amber-500/40",
  },
  {
    id: "image-to-3d-object",
    label: "Image to 3D Object",
    description: "Convert references into textured assets",
    icon: faCube,
    category: "generate",
    action: "IMAGE_TO_3D_OBJECT",
    color: "bg-emerald-500/40",
  },
  {
    id: "image-to-3d-world",
    label: "Image to 3D World",
    description: "Turn mood boards into explorable worlds",
    icon: faGlobe,
    category: "generate",
    action: "IMAGE_TO_3D_WORLD",
    color: "bg-blue-500/40",
  },
  {
    id: "edit-image",
    label: "Edit Image",
    description: "Change with inpainting",
    icon: faPencil,
    category: "edit",
    action: "2D",
    color: "bg-purple-600/40",
  },
  {
    id: "video-frame-extractor",
    label: "Video Frame Extractor",
    description: "Extract frames from video",
    icon: faPhotoFilm,
    category: "edit",
    action: "VIDEO_FRAME_EXTRACTOR",
    color: "bg-rose-600/40",
  },
  {
    id: "video-watermark-removal",
    label: "Video Watermark Remover",
    description: "Remove watermarks from videos",
    icon: faDroplet,
    category: "edit",
    badge: "SOON",
    color: "bg-cyan-500/40",
  },
  {
    id: "image-watermark-removal",
    label: "Image Watermark Remover",
    description: "Remove watermarks from images",
    icon: faDroplet,
    category: "edit",
    badge: "SOON",
    color: "bg-indigo-600/40",
  },
  {
    id: "remove-background",
    label: "Remove Background",
    description: "Remove backgrounds from images",
    icon: faWandMagicSparkles,
    category: "edit",
    action: "REMOVE_BACKGROUND",
    color: "bg-violet-500/40",
  },
  {
    id: "angles",
    label: "Angles",
    description: "Generate new camera angles from a single photo",
    icon: faCrosshairs,
    category: "generate",
    action: "ANGLES",
    color: "bg-lime-500/40",
    badge: "NEW",
  },

  {
    id: "storyboard",
    label: "Storyboard",
    description: "Plan your shots with a visual storyboard",
    icon: faPhotoFilm,
    category: "generate",
    action: "STORYBOARD",
    color: "bg-fuchsia-600/40",
    badge: "NEW",
  },
  {
    id: "background-change",
    label: "Background Change",
    description: "Swap the backdrop of a video using a reference image",
    icon: faSparkles,
    category: "edit",
    action: "BACKGROUND_CHANGE",
    color: "bg-orange-500/40",
    badge: "NEW",
  },
  {
    id: "video-editor",
    label: "Video Editor",
    description: "Edit and assemble videos on a timeline",
    icon: faFilm,
    category: "edit",
    action: "VIDEO_EDITOR",
    color: "bg-teal-500/40",
    badge: "BETA",
  },
  {
    id: "2d-canvas",
    label: "Image Editor",
    description: "Easy edits. Great for graphic design.",
    icon: faPenNib,
    category: "generate",
    action: "2D",
    color: "bg-sky-500/40",
  },
  {
    id: "3d-editor",
    label: "3D Stage",
    description: "Precision control. Great for AI film.",
    icon: faCube,
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
      return "bg-teal-600 text-white";
    case "BEST":
      return "bg-primary text-white";
    case "SOON":
      return "bg-gray-600 text-white";
    case "BETA":
      return "bg-amber-500 text-white";
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
