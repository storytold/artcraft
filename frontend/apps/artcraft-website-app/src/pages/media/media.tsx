import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { toast } from "../../components/toast/toast";
import { MediaFilesApi, PromptsApi, type UserInfo } from "@storyteller/api";
import { addCorsParam, PLACEHOLDER_IMAGES } from "@storyteller/common";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import Seo from "../../components/seo";
import { LightboxDetails } from "../../components/lightbox/LightboxDetails";
import {
  createPromptData,
  EMPTY_PROMPT,
  is3DModelUrl,
  isVideoUrl,
  type PromptData,
} from "../../components/lightbox/shared";
import { applyRecreateFromMediaToken } from "../../lib/recreate";

interface MediaData {
  url: string | null;
  token: string | null;
  createdAt: string | null;
  isVideo: boolean;
  is3D: boolean;
  isLoaded: boolean;
  width?: number;
  height?: number;
  creator: UserInfo | null;
}

const EMPTY_MEDIA: MediaData = {
  url: null,
  token: null,
  createdAt: null,
  isVideo: false,
  is3D: false,
  isLoaded: false,
  creator: null,
};

export default function MediaPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mediaIdParam = routeId || searchParams.get("media") || undefined;

  const [media, setMedia] = useState<MediaData>(EMPTY_MEDIA);
  const [mediaRecordLoading, setMediaRecordLoading] = useState(true);
  const [promptData, setPromptData] = useState<PromptData>(EMPTY_PROMPT);

  const loadMedia = useCallback(async (id: string) => {
    setMediaRecordLoading(true);

    const mediaFilesApi = new MediaFilesApi();
    try {
      const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
        mediaFileToken: id,
      });

      if (mediaResponse.success && mediaResponse.data) {
        const file = mediaResponse.data;
        const url = file.media_links?.cdn_url || null;

        setMedia((prev) => {
          const isSameUrl = prev.url === url;
          return {
            url,
            token: file.token || id,
            createdAt: file.created_at || null,
            isVideo: url ? isVideoUrl(url) : false,
            is3D: url ? is3DModelUrl(url) : false,
            isLoaded: isSameUrl ? prev.isLoaded : false,
            width: isSameUrl ? prev.width : undefined,
            height: isSameUrl ? prev.height : undefined,
            creator: file.maybe_creator_user || null,
          };
        });

        if (file.maybe_prompt_token) {
          setPromptData((prev) => ({ ...prev, hasToken: true, loading: true }));

          try {
            const promptsApi = new PromptsApi();
            const promptResponse = await promptsApi.GetPromptsByToken({
              token: file.maybe_prompt_token,
            });

            const data = promptResponse.success ? promptResponse.data : null;
            setPromptData(createPromptData(data, true, false));
          } catch {
            setPromptData((prev) => ({ ...prev, loading: false }));
          }
        } else {
          setPromptData(EMPTY_PROMPT);
        }
      } else {
        setMedia(EMPTY_MEDIA);
        toast.error("Media not found");
      }
    } catch {
      setMedia(EMPTY_MEDIA);
      toast.error("Failed to load media");
    } finally {
      setMediaRecordLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mediaIdParam) {
      loadMedia(mediaIdParam);
    }
  }, [mediaIdParam, loadMedia]);

  const recreateMediaClass: "image" | "video" | null = media.isVideo
    ? "video"
    : media.is3D
      ? null
      : "image";

  const handleRecreate = useCallback(async () => {
    if (!media.token || !recreateMediaClass) return;
    await applyRecreateFromMediaToken(media.token, recreateMediaClass, navigate);
  }, [media.token, recreateMediaClass, navigate]);

  return (
    <div className="relative min-h-screen w-full p-4 pt-16 bg-dots flex items-start lg:items-center justify-center">
      <Seo
        title="Shared Media - ArtCraft"
        description="View shared media from ArtCraft."
      />
      <div className="mx-auto max-w-[1920px] w-full h-auto lg:h-[calc(100vh-100px)] min-h-[500px]">
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden rounded-xl border border-white/[2%]">
          {/* Media Preview Area */}
          <div className="relative flex-1 bg-black/20 backdrop-blur-lg flex items-center justify-center overflow-hidden min-h-[30vh] lg:min-h-0">
            {mediaRecordLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner className="h-12 w-12 text-white/60" />
              </div>
            ) : media.url ? (
              <div className="relative h-full w-full flex items-center justify-center">
                {media.is3D ? (
                  <Viewer3D
                    modelUrl={addCorsParam(media.url) || media.url}
                    isActive
                    className="h-full w-full"
                  />
                ) : media.isVideo ? (
                  <video
                    src={addCorsParam(media.url) || media.url}
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => console.error("Video failed to load")}
                    onLoadedData={(e) => {
                      const el = e.currentTarget;
                      setMedia((prev) => ({
                        ...prev,
                        isLoaded: true,
                        width: el.videoWidth,
                        height: el.videoHeight,
                      }));
                    }}
                  />
                ) : (
                  <>
                    <img
                      src={addCorsParam(media.url) || media.url}
                      alt="Generated image"
                      className="h-full w-full object-contain transition-opacity duration-300"
                      style={{ opacity: media.isLoaded ? 1 : 0 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          PLACEHOLDER_IMAGES.DEFAULT;
                        (e.currentTarget as HTMLImageElement).style.opacity =
                          "0.3";
                        (
                          e.currentTarget as HTMLImageElement
                        ).dataset.brokenurl = media.url || "";
                        setMedia((prev) => ({ ...prev, isLoaded: true }));
                      }}
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        setMedia((prev) => ({
                          ...prev,
                          isLoaded: true,
                          width: el.naturalWidth,
                          height: el.naturalHeight,
                        }));
                      }}
                    />
                    {!media.isLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner className="h-12 w-12 text-white/60" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-white/60">Media not available</span>
              </div>
            )}
          </div>

          <LightboxDetails
            promptData={
              mediaRecordLoading ? { ...EMPTY_PROMPT, loading: true } : promptData
            }
            mediaToken={media.token}
            mediaUrl={media.url}
            mediaWidth={media.width}
            mediaHeight={media.height}
            createdAt={media.createdAt}
            creator={media.creator}
            onRecreate={recreateMediaClass ? handleRecreate : undefined}
            showDownloadAppCta
          />
        </div>
      </div>
    </div>
  );
}
