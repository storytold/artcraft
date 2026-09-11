export const THUMBNAIL_SIZES = {
  SMALL: 128,
  MEDIUM: 250,
  LARGE: 512,
  EXTRA_LARGE: 1024,
} as const;

export type ThumbnailSize =
  (typeof THUMBNAIL_SIZES)[keyof typeof THUMBNAIL_SIZES];

interface ThumbnailOptions {
  width?: ThumbnailSize | number;
  addCors?: boolean;
}

export function getThumbnailUrl(
  urlTemplate: string | null | undefined,
  options: ThumbnailOptions = {},
): string | null {
  if (!urlTemplate) return null;

  const { width = THUMBNAIL_SIZES.MEDIUM, addCors = false } = options;

  let url = urlTemplate.replace("{WIDTH}", width.toString());

  if (addCors) {
    const corsUrl = addCorsParam(url);
    if (corsUrl) url = corsUrl;
  }

  return url;
}

export function addCorsParam(url: string | null | undefined): string | null {
  if (!url) return null;
  return `${url}?cors=1`;
}

interface MediaThumbnailOptions {
  size?: ThumbnailSize | number;
  addCors?: boolean;
}

export function getMediaThumbnail(
  mediaLinks:
    | {
        maybe_thumbnail_template?: string | null;
        cdn_url?: string | null;
        maybe_video_previews?: {
          animated?: string | null;
        } | null;
      }
    | null
    | undefined,
  mediaClass: string | undefined,
  options: MediaThumbnailOptions = {},
): string | null {
  if (!mediaLinks) return null;

  const { size = THUMBNAIL_SIZES.MEDIUM, addCors = false } = options;

  let thumbnailUrl: string | null = null;

  if (mediaClass === "audio") {
    // Audio has no image thumbnail; falling through to cdn_url would hand an
    // mp3 to an <img>. Callers render a placeholder/waveform instead.
    return null;
  }

  if (mediaClass === "video" && mediaLinks.maybe_video_previews?.animated) {
    thumbnailUrl = mediaLinks.maybe_video_previews.animated;
  } else if (mediaLinks.maybe_thumbnail_template) {
    thumbnailUrl = getThumbnailUrl(mediaLinks.maybe_thumbnail_template, {
      width: size,
    });
  } else if (mediaLinks.cdn_url) {
    thumbnailUrl = mediaLinks.cdn_url;
  }

  if (thumbnailUrl && addCors) {
    thumbnailUrl = addCorsParam(thumbnailUrl);
  }

  return thumbnailUrl;
}

// Still-frame thumbnail for a video (first frame), for hosts that let the
// user turn off animated previews. Falls back to the regular thumbnail
// template when the backend hasn't attached still previews.
export function getMediaStillThumbnail(
  mediaLinks:
    | {
        maybe_thumbnail_template?: string | null;
        maybe_video_previews?: {
          still?: string | null;
          still_thumbnail_template?: string | null;
        } | null;
      }
    | null
    | undefined,
  options: MediaThumbnailOptions = {},
): string | null {
  if (!mediaLinks) return null;

  const { size = THUMBNAIL_SIZES.MEDIUM } = options;
  const previews = mediaLinks.maybe_video_previews;

  if (previews?.still_thumbnail_template) {
    return getThumbnailUrl(previews.still_thumbnail_template, { width: size });
  }
  if (previews?.still) {
    return previews.still;
  }
  if (mediaLinks.maybe_thumbnail_template) {
    return getThumbnailUrl(mediaLinks.maybe_thumbnail_template, {
      width: size,
    });
  }
  return null;
}

export function getContextImageThumbnail(
  contextImage: {
    media_links: {
      maybe_thumbnail_template?: string | null;
      cdn_url: string;
      maybe_video_previews?: {
        still: string;
        still_thumbnail_template: string;
      } | null;
    };
  },
  options: MediaThumbnailOptions = {},
): { thumbnail: string; fullSize: string } {
  const { size = THUMBNAIL_SIZES.SMALL } = options;
  const fullSizeWidth = THUMBNAIL_SIZES.EXTRA_LARGE;

  // For video refs, prefer the still-frame preview over the raw video CDN URL.
  if (
    !contextImage.media_links.maybe_thumbnail_template &&
    contextImage.media_links.maybe_video_previews
  ) {
    const vp = contextImage.media_links.maybe_video_previews;
    const thumbnail = vp.still_thumbnail_template
      ? getThumbnailUrl(vp.still_thumbnail_template, { width: size }) || vp.still
      : vp.still;
    const fullSize = vp.still_thumbnail_template
      ? getThumbnailUrl(vp.still_thumbnail_template, { width: fullSizeWidth }) || vp.still
      : vp.still;
    return { thumbnail, fullSize };
  }

  const thumbnail = contextImage.media_links.maybe_thumbnail_template
    ? getThumbnailUrl(contextImage.media_links.maybe_thumbnail_template, {
        width: size,
      }) || contextImage.media_links.cdn_url
    : contextImage.media_links.cdn_url;

  const fullSize = contextImage.media_links.maybe_thumbnail_template
    ? getThumbnailUrl(contextImage.media_links.maybe_thumbnail_template, {
        width: fullSizeWidth,
      }) || contextImage.media_links.cdn_url
    : contextImage.media_links.cdn_url;

  return { thumbnail, fullSize };
}

export const PLACEHOLDER_IMAGES = {
  DEFAULT: "/resources/gifs/artcraft-logo-load.gif",
  VIDEO: "/resources/gifs/artcraft-logo-load.gif",
} as const;

export function getPlaceholderForMediaClass(mediaClass?: string): string {
  switch (mediaClass) {
    case "video":
      return PLACEHOLDER_IMAGES.VIDEO;
    default:
      return PLACEHOLDER_IMAGES.DEFAULT;
  }
}

// File extensions for actual 3D-model assets (meshes + gaussian splats).
export const MODEL_3D_EXTENSIONS = [".glb", ".gltf", ".fbx", ".spz", ".obj", ".ply"];

/** Whether a URL points at a real 3D-model asset (vs. e.g. a cover screenshot).
 *  Used to keep 3D-model cover images — which the backend can surface as
 *  "dimensional" media files whose asset is actually a .png — out of the 3D
 *  feeds and library. */
export function is3DModelUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return MODEL_3D_EXTENSIONS.some((ext) => lower.includes(ext));
}
