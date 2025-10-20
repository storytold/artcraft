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
  options: ThumbnailOptions = {}
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
  options: MediaThumbnailOptions = {}
): string | null {
  if (!mediaLinks) return null;

  const { size = THUMBNAIL_SIZES.MEDIUM, addCors = false } = options;

  let thumbnailUrl: string | null = null;

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

export function getContextImageThumbnail(
  contextImage: {
    media_links: {
      maybe_thumbnail_template?: string | null;
      cdn_url: string;
    };
  },
  options: MediaThumbnailOptions = {}
): { thumbnail: string; fullSize: string } {
  const { size = THUMBNAIL_SIZES.SMALL } = options;
  const fullSizeWidth = THUMBNAIL_SIZES.LARGE;

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
