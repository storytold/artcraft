import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCube,
  faFilm,
  faPalette,
  faImage,
  faPenNib,
  faDroplet,
  faPhotoFilm,
  faGlobe,
} from "@fortawesome/pro-solid-svg-icons";
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
  | "IMAGE_TO_3D_WORLD";

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
    label: "Image to Video",
    icon: faFilm,
  },
  {
    id: "EDIT",
    label: "Edit Image",
    icon: faPenNib,
    imageSrc: "/resources/gifs/INPAINT_CANVAS_DEMO.gif",
    description: "Modify your image with AI",
    large: true,
  },
  {
    id: "2D",
    label: "2D Canvas",
    icon: faPalette,
    imageSrc: "/resources/gifs/2D_CANVAS_DEMO.gif",
    description: "Easy edits. Great for graphic design.",
    large: true,
  },
  {
    id: "3D",
    label: "3D Editor",
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
  badge?: "NEW" | "BEST" | "SOON";
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
    label: "Image to Video",
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
    // action: "IMAGE_TO_3D_OBJECT",
    color: "bg-emerald-500/40",
    badge: "SOON",
  },
  {
    id: "image-to-3d-world",
    label: "Image to 3D World",
    description: "Turn mood boards into explorable worlds",
    icon: faGlobe,
    category: "generate",
    // action: "IMAGE_TO_3D_WORLD",
    color: "bg-blue-500/40",
    badge: "SOON",
  },
  {
    id: "edit-image",
    label: "Edit Image",
    description: "Change with inpainting",
    icon: faPenNib,
    category: "edit",
    action: "EDIT",
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
    badge: "NEW",
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
    id: "2d-canvas",
    label: "2D Canvas",
    description: "Easy edits. Great for graphic design.",
    icon: faPalette,
    category: "generate",
    action: "2D",
    color: "bg-sky-500/40",
  },
  {
    id: "3d-editor",
    label: "3D Editor",
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

export const getBadgeStyles = (badge?: string) => {
  switch (badge) {
    case "NEW":
      return "bg-teal-600 text-white";
    case "BEST":
      return "bg-primary text-white";
    case "SOON":
      return "bg-gray-600 text-white";
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
      "EDIT",
      "2D",
      "3D",
      "VIDEO_FRAME_EXTRACTOR",
      "VIDEO_WATERMARK_REMOVAL",
      "IMAGE_WATERMARK_REMOVAL",
      "IMAGE_TO_3D_OBJECT",
      "IMAGE_TO_3D_WORLD",
    ].includes(action)
  ) {
    useTabStore.getState().setActiveTab(action as TabId);
  }
};
