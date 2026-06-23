import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  IconDownload,
  IconPhoto,
  IconVideo,
  IconCube,
  IconExternalLink,
  IconPencil,
  IconInfoCircle,
  IconSettings,
  IconChevronDown,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { getIdenticonUrl } from "@/lib/identicon";
import type { MediaInfo, ExploreMediaFile, PromptInfo } from "@/api/MediaApi";
import { MediaApi, getMediaThumbnailUrl } from "@/api/MediaApi";

type MediaItem = MediaInfo | ExploreMediaFile;

export type MediaModalCreator = {
  username: string;
  display_name?: string;
  gravatar_hash?: string;
};

interface MediaDetailModalProps {
  item: MediaItem | null;
  /** Fallback/override creator when the item itself doesn't embed one (e.g. from ListUserMediaFiles). */
  creator?: MediaModalCreator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const classLabels: Record<string, string> = {
  image: "Image",
  video: "Video",
  dimensional: "3D",
};

const classIcons: Record<string, typeof IconPhoto> = {
  video: IconVideo,
  dimensional: IconCube,
};

function formatModelType(model: string): string {
  return model
    .replace(/_/g, " ")
    .replace(/(\d)p(\d)/g, "$1.$2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const aspectRatioLabels: Record<string, string> = {
  auto: "Auto",
  square: "1:1",
  wide_three_by_two: "3:2",
  wide_four_by_three: "4:3",
  wide_five_by_four: "5:4",
  wide_sixteen_by_nine: "16:9",
  wide_twenty_one_by_nine: "21:9",
  tall_two_by_three: "2:3",
  tall_three_by_four: "3:4",
  tall_four_by_five: "4:5",
  tall_nine_by_sixteen: "9:16",
  tall_nine_by_twenty_one: "9:21",
  wide: "Wide",
  tall: "Tall",
  auto_2k: "Auto 2K",
  auto_4k: "Auto 4K",
  square_hd: "Square HD",
};

function getFullMediaUrl(item: MediaItem): string | undefined {
  if ("media_links" in item && item.media_links?.cdn_url) {
    return item.media_links.cdn_url;
  }
  if ("public_bucket_url" in item && item.public_bucket_url) {
    return item.public_bucket_url as string;
  }
  return undefined;
}

function getEmbeddedCreator(item: MediaItem) {
  return "maybe_creator" in item
    ? (item as ExploreMediaFile).maybe_creator
    : undefined;
}

export function MediaDetailModal({
  item,
  creator: creatorOverride,
  open,
  onOpenChange,
}: MediaDetailModalProps) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [promptInfo, setPromptInfo] = useState<PromptInfo | null>(null);
  const [promptFailed, setPromptFailed] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [isPromptOverflowing, setIsPromptOverflowing] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setImgLoaded(false);
        setPromptInfo(null);
        setPromptFailed(false);
        setPromptExpanded(false);
        setAdditionalOpen(false);
        setCopied(false);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;
    const api = new MediaApi();
    api.GetMediaFile(item.token).then((res) => {
      if (cancelled) return;
      const promptToken = res.data?.maybe_prompt_token;
      if (!promptToken) {
        setPromptFailed(true);
        return;
      }
      api.GetPrompt(promptToken).then((promptRes) => {
        if (cancelled) return;
        if (promptRes.success && promptRes.data) {
          setPromptInfo(promptRes.data);
        } else {
          setPromptFailed(true);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, item?.token]);

  const promptText =
    promptInfo?.maybe_positive_prompt ||
    item?.maybe_text_transcript ||
    item?.maybe_title;

  useLayoutEffect(() => {
    if (promptExpanded) return;
    const el = promptRef.current;
    if (!el || !promptText) {
      setIsPromptOverflowing(false);
      return;
    }
    setIsPromptOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [promptText, promptExpanded, open]);

  if (!item) return null;

  const thumbnailUrl = getMediaThumbnailUrl(item, 1024);
  const fullUrl = getFullMediaUrl(item);
  const creator = getEmbeddedCreator(item) ?? creatorOverride;
  const FallbackIcon = classIcons[item.media_class] ?? IconPhoto;
  const title = item.maybe_title || item.maybe_text_transcript || "Untitled";
  const isVideo = item.media_class === "video";
  const videoPoster = isVideo
    ? item.media_links?.maybe_video_previews?.thumbnail_template?.replace(
        "{WIDTH}",
        "1024",
      ) ||
      item.media_links?.maybe_thumbnail_template?.replace("{WIDTH}", "1024") ||
      undefined
    : undefined;
  const externalUrl = `https://getartcraft.com/media/${item.token}`;

  const handleDownload = () => {
    const url = fullUrl || thumbnailUrl;
    if (url) window.open(url, "_blank");
  };

  const handleCreatorClick = () => {
    if (!creator) return;
    handleOpenChange(false);
    navigate(`/user/profile/${creator.username}`);
  };

  const modelDisplay = promptInfo?.maybe_model_type
    ? formatModelType(promptInfo.maybe_model_type)
    : null;

  const handleCopyPrompt = async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const generationMode = promptInfo?.maybe_generation_mode
    ? formatModelType(promptInfo.maybe_generation_mode)
    : null;

  const resolution = promptInfo?.maybe_resolution
    ? formatModelType(promptInfo.maybe_resolution)
    : null;

  const aspectRatio = promptInfo?.maybe_aspect_ratio
    ? aspectRatioLabels[promptInfo.maybe_aspect_ratio] || formatModelType(promptInfo.maybe_aspect_ratio)
    : null;

  const createdDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-7xl p-0 gap-0 overflow-hidden"
        overlayClassName="bg-black/80"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="flex flex-col md:flex-row h-[75vh]">
          {/* Left: Media preview */}
          <div className="relative flex-1 min-h-[300px] md:min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
            {isVideo && fullUrl ? (
              <video
                src={fullUrl}
                controls
                autoPlay
                className="w-full h-full object-contain max-h-[85vh]"
                poster={videoPoster}
              />
            ) : thumbnailUrl ? (
              <>
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="size-8 opacity-40" />
                  </div>
                )}
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className={`w-full h-full object-contain max-h-[85vh] transition-opacity ${!imgLoaded ? "opacity-0" : "opacity-100"}`}
                  onLoad={() => setImgLoaded(true)}
                />
              </>
            ) : (
              <FallbackIcon className="size-24 opacity-20 text-white" />
            )}
          </div>

          {/* Right: Details panel */}
          <div className="w-full md:w-80 flex flex-col border-l border-border bg-background max-h-[85vh]">
            {/* Creator header - sticky top */}
            {creator && (
              <button
                type="button"
                onClick={handleCreatorClick}
                className="shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors text-left cursor-pointer"
              >
                <Avatar>
                  <AvatarImage
                    src={
                      creator.gravatar_hash
                        ? `https://gravatar.com/avatar/${creator.gravatar_hash}?s=64&d=404`
                        : undefined
                    }
                  />
                  <AvatarFallback className="p-0">
                    <img
                      src={getIdenticonUrl(creator.username)}
                      alt={creator.username}
                      className="h-full w-full"
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {creator.display_name || creator.username}
                  </div>
                  <div className="text-xs text-muted-foreground">Author</div>
                </div>
              </button>
            )}

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Prompt section */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <IconPencil className="size-3.5" />
                    Prompt
                  </div>
                  {promptText && (
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? (
                        <IconCheck className="size-3.5 text-green-500" />
                      ) : (
                        <IconCopy className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div
                    ref={promptRef}
                    className={`text-sm bg-muted/50 p-2.5 leading-relaxed ${promptText && (isPromptOverflowing || promptExpanded) ? "rounded-t-lg" : "rounded-lg"} ${!promptExpanded ? "max-h-18 overflow-hidden" : ""}`}
                  >
                    {promptText ||
                      (promptFailed ? "No prompt available" : "Loading...")}
                  </div>
                  {promptText && (isPromptOverflowing || promptExpanded) && (
                    <button
                      type="button"
                      onClick={() => setPromptExpanded((v) => !v)}
                      className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground mt-0 px-2.5 py-1.5 bg-muted/50 rounded-b-lg border-t border-border transition-colors cursor-pointer"
                    >
                      {promptExpanded ? "Collapse" : "See all"}
                      <IconChevronDown
                        className={`size-3.5 transition-transform ${promptExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Information section */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  <IconInfoCircle className="size-3.5" />
                  Information
                </div>
                <div className="bg-muted/50 rounded-lg divide-y divide-border">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">Feature</span>
                    <span className="text-sm font-medium">
                      {generationMode ||
                        (classLabels[item.media_class]
                          ? `Create ${classLabels[item.media_class]}`
                          : item.media_class)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">Model</span>
                    <span className="text-sm font-medium">
                      {modelDisplay ?? (
                        <span className="text-muted-foreground">
                          {promptFailed ? "Unknown" : "Loading..."}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">{item.media_type}</span>
                  </div>
                </div>
              </div>

              {/* Additional section */}
              <div className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => setAdditionalOpen((v) => !v)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <IconSettings className="size-3.5" />
                    Additional
                  </div>
                  <IconChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${additionalOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {additionalOpen && (
                  <div className="mt-3 bg-muted/50 rounded-lg divide-y divide-border">
                    {resolution && (
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">Resolution</span>
                        <span className="text-sm font-medium">{resolution}</span>
                      </div>
                    )}
                    {aspectRatio && (
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">Aspect Ratio</span>
                        <span className="text-sm font-medium">{aspectRatio}</span>
                      </div>
                    )}
                    {promptInfo?.maybe_generation_provider && (
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">Provider</span>
                        <span className="text-sm font-medium">
                          {formatModelType(promptInfo.maybe_generation_provider)}
                        </span>
                      </div>
                    )}
                    {createdDate && (
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm font-medium">{createdDate}</span>
                      </div>
                    )}
                    {!resolution && !aspectRatio && !promptInfo?.maybe_generation_provider && !createdDate && (
                      <div className="px-3 py-2.5 text-sm text-muted-foreground">No additional details</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions - sticky bottom */}
            <div className="shrink-0 px-4 py-3 border-t border-border">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <IconDownload className="size-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconExternalLink className="size-4" />
                    View on Artcraft
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
