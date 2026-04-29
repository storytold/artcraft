import { useState } from "react";
import dayjs from "dayjs";
import {
  galleryModalLightboxMediaId,
  galleryModalLightboxVisible,
  galleryModalLightboxImage,
} from "@storyteller/ui-gallery-modal";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";

interface Props {
  job: {
    token: string;
    maybe_title: string;
    updated_at: string;
    public_bucket_path: string;
    maybe_style_name?: string;
    maybe_media_links_thumbnail?: string;
    maybe_result?: {
      entity_token?: string;
      media_links?: {
        cdn_url?: string;
      };
    };
  };
}

export function CompletedCard({ job }: Props) {
  const [loadError, setLoadError] = useState(false);
  // Info: Gallery modal will handle displaying full media. Compute thumbnail only.

  // NB: Try to use the thumbnail instead of the link to the full asset.
  // Passing around full asset URLs and putting them into image tags is causing CORS errors if those assets are not images.
  const thumbnailUrl = job?.maybe_media_links_thumbnail;

  if (!job) return null;

  return (
    <>
      <div
        className="flex w-full items-center justify-between rounded-lg p-2 text-start transition-all duration-150 hover:cursor-pointer hover:bg-white/10"
        onClick={() => {
          galleryModalLightboxMediaId.value =
            job.maybe_result?.entity_token || null;
          galleryModalLightboxImage.value = {
            id: job.maybe_result?.entity_token || job.token,
            label: job.maybe_title || "Image",
            thumbnail: thumbnailUrl,
            fullImage: job.maybe_result?.media_links?.cdn_url || thumbnailUrl,
            createdAt: job.updated_at,
            mediaClass: undefined,
          } as GalleryItem;
          galleryModalLightboxVisible.value = true;
        }}
      >
        <div className="flex gap-4">
          <div className="flex aspect-square h-14 w-14 justify-center overflow-hidden rounded-lg border border-[#A9A9A9]/50 bg-black/60">
            <img
              src={
                loadError
                  ? "/resources/images/movie-placeholder.png"
                  : thumbnailUrl
              }
              className="h-full w-full object-cover"
              alt={job.maybe_title ?? "unknown"}
              //crossOrigin="anonymous"
              onError={() => setLoadError(true)}
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="font-medium">{job.maybe_title || "Untitled"}</div>
            <div className="text-sm text-white/60">
              {dayjs(job.updated_at).format("MMM D, YYYY HH:mm:ss")}
            </div>
          </div>
        </div>
        {/* <a
          href={downloadLink}
          download
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center text-lg text-white/60 transition-all hover:text-white"
        >
          <FontAwesomeIcon icon={faDownToLine} />
        </a> */}
      </div>

      {/* LightboxModal removed – now using top level GalleryModal */}
    </>
  );
}
