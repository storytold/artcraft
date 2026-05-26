import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCube, faImage, faVideo } from "@fortawesome/pro-solid-svg-icons";
import { toast } from "../toast/toast";
import { downloadMediaFile } from "../../lib/download-media";
import {
  getModelCreatorIconPath,
  getModelDisplayName,
} from "../../lib/omni-gen-hooks";
import {
  applyMakeVideoFromImage,
  applyRecreateFromMediaToken,
  type RecreateMediaClass,
} from "../../lib/recreate";
import { SHARE_URL_BASE } from "../lightbox/shared";
import type { GalleryItem } from "./useGalleryData";

// Shared quick-action logic + display metadata for a completed gallery item.
// Used by both the masonry GalleryCard and the list GalleryRow so the two
// views stay behaviorally identical (recreate / make-video / share / download).

export interface GalleryItemActions {
  isVideo: boolean;
  is3D: boolean;
  mediaIcon: IconDefinition;
  mediaLabel: string;
  modelDisplayName: string | null;
  modelIconPath: string | null;
  recreateMediaClass: RecreateMediaClass | null;
  canMakeVideo: boolean;
  isRecreating: boolean;
  isDownloading: boolean;
  shareCopied: boolean;
  handleRecreate: (e: React.MouseEvent) => void;
  handleMakeVideo: (e: React.MouseEvent) => void;
  handleShare: (e: React.MouseEvent) => void;
  handleDownload: (e: React.MouseEvent) => void;
}

export interface GalleryItemActionsOptions {
  enableMakeVideo?: boolean;
  // Overrides item.modelId for the displayed model name/icon. The list view
  // passes the model resolved from the prompt record, which is richer than the
  // media file's own field.
  modelId?: string;
}

export function useGalleryItemActions(
  item: GalleryItem,
  { enableMakeVideo = false, modelId }: GalleryItemActionsOptions = {},
): GalleryItemActions {
  const navigate = useNavigate();
  const [shareCopied, setShareCopied] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isVideo = item.mediaClass === "video";
  const is3D = item.mediaClass === "dimensional";
  const recreateMediaClass: RecreateMediaClass | null = isVideo
    ? "video"
    : is3D
      ? null
      : "image";
  const canMakeVideo = enableMakeVideo && !isVideo && !is3D;

  const mediaIcon = isVideo ? faVideo : is3D ? faCube : faImage;
  const mediaLabel = isVideo ? "Video" : is3D ? "3D" : "Image";

  const effectiveModelId = modelId ?? item.modelId;
  const modelDisplayName = effectiveModelId
    ? getModelDisplayName(effectiveModelId)
    : null;
  const modelIconPath = effectiveModelId
    ? getModelCreatorIconPath(effectiveModelId)
    : null;

  const handleRecreate = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!recreateMediaClass || isRecreating) return;
      setIsRecreating(true);
      try {
        await applyRecreateFromMediaToken(item.id, recreateMediaClass, navigate);
      } finally {
        setIsRecreating(false);
      }
    },
    [item.id, recreateMediaClass, navigate, isRecreating],
  );

  const handleMakeVideo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = item.fullImage || item.thumbnail;
      if (!url) return;
      applyMakeVideoFromImage(item.id, url, navigate);
    },
    [item.id, item.fullImage, item.thumbnail, navigate],
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(`${SHARE_URL_BASE}${item.id}`);
        toast.success("Share link copied");
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
      } catch {
        toast.error("Unable to copy link");
      }
    },
    [item.id],
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.fullImage || isDownloading) return;
      setIsDownloading(true);
      try {
        await downloadMediaFile({
          url: item.fullImage,
          filename: `artcraft-${item.id}`,
          mediaClass: item.mediaClass,
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [item.fullImage, item.id, item.mediaClass, isDownloading],
  );

  return {
    isVideo,
    is3D,
    mediaIcon,
    mediaLabel,
    modelDisplayName,
    modelIconPath,
    recreateMediaClass,
    canMakeVideo,
    isRecreating,
    isDownloading,
    shareCopied,
    handleRecreate,
    handleMakeVideo,
    handleShare,
    handleDownload,
  };
}
