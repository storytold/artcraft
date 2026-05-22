import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@storyteller/ui-button";
import { toast } from "../toast/toast";
import { Gravatar } from "@storyteller/ui-gravatar";
import type { UserInfo } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faArrowRotateRight,
  faCheck,
  faCircleInfo,
  faCopy,
  faImage,
  faLink,
  faPause,
  faPencil,
  faPlay,
  faSpinnerThird,
  faTrashCan,
  faUser,
  faVideo,
  faWaveformLines,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import {
  getContextImageThumbnail,
  THUMBNAIL_SIZES,
} from "@storyteller/common";
import {
  getModelCreatorIcon,
  getModelDisplayName,
  getProviderDisplayName,
  getProviderIconByName,
} from "@storyteller/model-list";
import { downloadMediaFile } from "../../lib/download-media";
import {
  formatAspectRatio,
  formatDuration,
  formatResolution,
  SHARE_URL_BASE,
  type PromptData,
  useCopyFeedback,
} from "./shared";

// ── InfoRow (private to this file; other consumers do not need it) ─────────

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/60 font-medium">{label}</span>
      <span className="text-sm text-white font-medium flex items-center gap-2">
        {value}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export interface LightboxDetailsProps {
  promptData: PromptData;
  mediaToken?: string | null;
  mediaUrl?: string | null;
  mediaWidth?: number;
  mediaHeight?: number;
  createdAt?: string | null;
  creator?: UserInfo | null;
  onClose?: () => void;
  onRecreate?: () => void;
  onMakeVideo?: () => void;
  onDelete?: () => void;
  showDownloadAppCta?: boolean;
}

export function LightboxDetails({
  promptData,
  mediaToken,
  mediaUrl,
  mediaWidth,
  mediaHeight,
  createdAt,
  creator,
  onClose,
  onRecreate,
  onMakeVideo,
  onDelete,
  showDownloadAppCta,
}: LightboxDetailsProps) {
  const promptCopy = useCopyFeedback();
  const shareCopy = useCopyFeedback();
  const [isDownloading, setIsDownloading] = useState(false);
  const [playingAudioToken, setPlayingAudioToken] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setPlayingAudioToken(null);
  }, []);

  const handleAudioToggle = useCallback(
    (token: string, url: string) => {
      if (playingAudioToken === token) {
        stopAudio();
      } else {
        stopAudio();
        const audio = new Audio(url);
        audio.volume = 0.7;
        audio.onended = () => {
          setPlayingAudioToken(null);
          audioPlayerRef.current = null;
        };
        audioPlayerRef.current = audio;
        audio.play();
        setPlayingAudioToken(token);
      }
    },
    [playingAudioToken, stopAudio],
  );

  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isPromptClamped, setIsPromptClamped] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPromptExpanded(false);
    setIsDownloading(false);
    stopAudio();
  }, [mediaToken]);

  useEffect(() => {
    if (!promptRef.current || !promptData.text || promptData.loading) {
      setIsPromptClamped(false);
      return;
    }
    const raf = requestAnimationFrame(() => {
      if (promptRef.current) {
        setIsPromptClamped(
          promptRef.current.scrollHeight > promptRef.current.clientHeight,
        );
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [promptData.text, promptData.loading, isPromptExpanded]);

  const handleCopyPrompt = async () => {
    if (!promptData.text) return;
    try {
      await navigator.clipboard.writeText(promptData.text);
      toast.success("Prompt copied");
      promptCopy.trigger();
    } catch {
      toast.error("Unable to copy prompt");
    }
  };

  const handleCopyShareLink = async () => {
    if (!mediaToken) return;
    const shareUrl = `${SHARE_URL_BASE}${mediaToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied");
      shareCopy.trigger();
    } catch {
      toast.error("Unable to copy link");
    }
  };

  const hasInfoSection =
    !!promptData.provider ||
    !!promptData.modelType ||
    !!promptData.aspectRatio ||
    !!promptData.resolution ||
    promptData.durationSeconds != null ||
    promptData.generateAudio != null ||
    (!!mediaWidth && !!mediaHeight) ||
    !!createdAt;

  return (
    <div className="relative flex w-full sm:w-[320px] shrink-0 flex-col bg-ui-panel rounded-b-xl sm:rounded-b-none sm:rounded-r-xl min-h-0 flex-1 sm:flex-none sm:h-full overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:bg-black/60 hover:text-white"
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
        {promptData.loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-white/10 rounded" />
              <div className="h-20 w-full bg-white/10 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-10 w-full bg-white/10 rounded-lg" />
              <div className="h-10 w-full bg-white/10 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {creator && (
              <div
                className={`sticky -top-4 z-10 -mx-4 -mt-4 mb-1 flex items-center gap-3 bg-ui-panel px-4 pt-4 pb-3 border-b border-white/5 ${onClose ? "pr-10" : ""}`}
              >
                {creator.core_info ? (
                  <Gravatar
                    size={36}
                    username={creator.username}
                    email_hash={creator.email_gravatar_hash}
                    avatarIndex={creator.core_info.default_avatar.image_index}
                    backgroundIndex={
                      creator.core_info.default_avatar.color_index
                    }
                    className="rounded-xl border-white/10"
                  />
                ) : (
                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-white/10 text-white/50 border border-white/5">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-white text-sm font-semibold leading-none">
                    {creator.display_name}
                  </span>
                  <span className="text-white/60 text-xs font-medium">
                    Author
                  </span>
                </div>
              </div>
            )}

            {promptData.hasToken && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                    <FontAwesomeIcon icon={faPencil} />
                    <span>Prompt</span>
                  </div>
                  {promptData.text && (
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={promptCopy.copied ? faCheck : faCopy}
                        className="h-3 w-3"
                      />
                      <span>{promptCopy.copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>

                <div className="text-sm text-white/90 break-words px-4 py-3 rounded-xl bg-black/20 leading-relaxed border border-white/5">
                  <div
                    ref={promptRef}
                    className={!isPromptExpanded ? "line-clamp-4" : ""}
                  >
                    {promptData.text || (
                      <span className="text-white/60">No prompt</span>
                    )}
                  </div>
                </div>

                {promptData.text && (isPromptClamped || isPromptExpanded) && (
                  <button
                    className="flex w-full items-center justify-center gap-1 text-xs text-white/70 hover:text-white transition-colors py-1"
                    onClick={() => setIsPromptExpanded((prev) => !prev)}
                  >
                    <span>{isPromptExpanded ? "Show less" : "Show more"}</span>
                  </button>
                )}
              </div>
            )}

            {promptData.contextImages && promptData.contextImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                  <FontAwesomeIcon icon={faImage} />
                  <span>Reference Media</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {promptData.contextImages.map((contextImage, index) => {
                    const isAudio = contextImage.semantic === "audioref";
                    const isVideoRef = contextImage.semantic === "vid_ref";
                    const { thumbnail } = getContextImageThumbnail(
                      contextImage,
                      { size: THUMBNAIL_SIZES.SMALL },
                    );
                    const isPlayingThis = playingAudioToken === contextImage.media_token;

                    if (isAudio) {
                      return (
                        <button
                          key={contextImage.media_token}
                          type="button"
                          onClick={() => handleAudioToggle(contextImage.media_token, contextImage.media_links.cdn_url)}
                          className="relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-white/40 transition-colors flex items-center justify-center bg-white/5"
                        >
                          <FontAwesomeIcon
                            icon={isPlayingThis ? faPause : faPlay}
                            className="text-white/70 text-lg"
                          />
                        </button>
                      );
                    }

                    return (
                      <a
                        key={contextImage.media_token}
                        href={`${SHARE_URL_BASE}${contextImage.media_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-white/40 transition-colors block"
                      >
                        <img
                          src={thumbnail}
                          alt={`Reference ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {isVideoRef && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FontAwesomeIcon
                              icon={faVideo}
                              className="text-white/80 text-sm drop-shadow-lg"
                            />
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {hasInfoSection && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                  <FontAwesomeIcon icon={faCircleInfo} />
                  <span>Information</span>
                </div>

                <div className="flex flex-col rounded-xl bg-black/20 border border-white/5 overflow-hidden">
                  {promptData.modelType && (
                    <InfoRow
                      label="Model"
                      value={
                        <>
                          {getModelCreatorIcon(promptData.modelType)}
                          <span>
                            {getModelDisplayName(promptData.modelType)}
                          </span>
                        </>
                      }
                    />
                  )}
                  {promptData.provider && (
                    <InfoRow
                      label="Provider"
                      value={
                        <>
                          {getProviderIconByName(
                            promptData.provider,
                            "h-4 w-4 invert",
                          )}
                          <span>
                            {getProviderDisplayName(promptData.provider)}
                          </span>
                        </>
                      }
                    />
                  )}
                  {promptData.aspectRatio && (
                    <InfoRow
                      label="Aspect Ratio"
                      value={formatAspectRatio(promptData.aspectRatio)}
                    />
                  )}
                  {promptData.resolution && (
                    <InfoRow
                      label="Resolution"
                      value={formatResolution(promptData.resolution)}
                    />
                  )}
                  {promptData.durationSeconds != null && (
                    <InfoRow
                      label="Duration"
                      value={formatDuration(promptData.durationSeconds)}
                    />
                  )}
                  {promptData.generateAudio != null && (
                    <InfoRow
                      label="Audio"
                      value={promptData.generateAudio ? "On" : "Off"}
                    />
                  )}
                  {mediaWidth && mediaHeight && (
                    <InfoRow
                      label="Size"
                      value={`${mediaWidth} × ${mediaHeight}`}
                    />
                  )}
                  {createdAt && (
                    <InfoRow
                      label="Created"
                      value={dayjs(createdAt).format("MMMM D, YYYY h:mm:ss A")}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 space-y-2 border-t border-white/5">
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="w-full border border-ui-panel-border bg-ui-controls/40 hover:bg-ui-controls/60 text-white"
            icon={shareCopy.copied ? faCheck : faLink}
            variant="secondary"
            onClick={handleCopyShareLink}
          >
            {shareCopy.copied ? "Copied" : "Share"}
          </Button>
          <button
            type="button"
            disabled={!mediaUrl || isDownloading}
            onClick={async () => {
              if (!mediaUrl || isDownloading) return;
              setIsDownloading(true);
              try {
                await downloadMediaFile({
                  url: mediaUrl,
                  filename: `artcraft-${mediaToken || "media"}`,
                });
              } finally {
                setIsDownloading(false);
              }
            }}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors border border-ui-panel-border ${
              mediaUrl
                ? "bg-ui-controls/40 hover:bg-ui-controls/60 text-white disabled:opacity-60"
                : "bg-ui-controls/20 text-white/60 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon
              icon={isDownloading ? faSpinnerThird : faArrowDownToLine}
              className={isDownloading ? "animate-spin" : ""}
            />
            {isDownloading ? "Downloading…" : "Download"}
          </button>
        </div>
        {onMakeVideo && (
          <Button
            icon={faVideo}
            className="w-full shadow-lg shadow-brand-primary/20"
            variant="primary"
            onClick={onMakeVideo}
          >
            Make Video
          </Button>
        )}
        {onRecreate && promptData.hasToken && (
          <Button
            icon={faArrowRotateRight}
            className="w-full border border-ui-panel-border bg-ui-controls/40 hover:bg-ui-controls/60 text-white"
            variant="secondary"
            onClick={onRecreate}
          >
            Recreate
          </Button>
        )}
        {onDelete && mediaToken && (
          <Button
            icon={faTrashCan}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
            variant="destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        )}
        {showDownloadAppCta && (
          <Button
            icon={faArrowDownToLine}
            className="w-full shadow-lg shadow-brand-primary/20"
            variant="primary"
            onClick={() => {
              window.location.href = "/download";
            }}
          >
            Download ArtCraft
          </Button>
        )}
      </div>
    </div>
  );
}

export default LightboxDetails;
