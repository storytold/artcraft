// The lightbox: the full-screen viewer the app opens when a user clicks a generated file in the gallery or a task list.
// It shows the file (image, video, audio or 3D), its prompt, creator and info, tags, and the action buttons (download, edit, delete...).
// Imports: the dialog shell (Modal) and small UI pieces come from sibling libraries in this repo.
import { Modal } from "@storyteller/ui-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button } from "@storyteller/ui-button";
// dayjs formats the created-at date shown in the info section.
import dayjs from "dayjs";
// Icons from lucide-react, used in the buttons and info rows below.
import { ArrowDownToLineIcon, BoxIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, GlobeIcon, ImageIcon, InfoIcon, LinkIcon, LogOutIcon, MusicIcon, PauseIcon, PencilIcon, PlayIcon, RotateCwIcon, SearchIcon, Trash2Icon, UserIcon, VideoIcon, WandSparklesIcon } from "lucide-react";
// DynamicIcon renders an icon component passed in as a prop (used for the Copy / Copied! swap).
import { DynamicIcon } from "@storyteller/icons";
// MediaFileDelete is the Rust (Tauri) command that deletes a file on the server.
import { MediaFileDelete } from "@storyteller/tauri-api";
// A spinner shown while the media loads.
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
// The 3D viewer used when the file is a 3D model.
import { Viewer3D } from "@storyteller/ui-viewer-3d";
// The waveform player used when the file is audio.
import { WaveformAudioPlayer } from "@storyteller/ui-audio-player";
// React hooks: state, effects, memoised values, stable callbacks and refs.
import {
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
// Sends an analytics event (for example when a file is deleted).
import { gtagEvent } from "@storyteller/google-analytics";
// The API classes that fetch the media file record and its prompt.
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
// Types only: the prompt record and the creator's user info.
import type { Prompts, UserInfo } from "@storyteller/api";
// Draws the creator's avatar.
import { Gravatar } from "@storyteller/ui-gravatar";
// Shows small pop-up messages (success / error).
import { toast } from "@storyteller/ui-toaster";
// Merges CSS class names, dropping conflicting Tailwind classes.
import { twMerge } from "tailwind-merge";
// The confirmation dialog helper (used by Delete) and its open/closed flag.
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
// Lookups that turn a model id / provider into a display name and icon for the info section.
import {
  getCreatorIconPathForModelId,
  getModelDisplayName,
  getProviderDisplayName,
  getProviderIconByName,
} from "@storyteller/model-list";
// Embla is the carousel library used when a batch of images is shown.
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
// Types only: Embla's option object.
import {
  addCorsParam,
  getContextImageThumbnail,
  THUMBNAIL_SIZES,
  PLACEHOLDER_IMAGES,
  formatAspectRatio,
  formatDuration,
  formatResolution,
} from "@storyteller/common";
// The Tags box in the details panel (see tags/TagsSection.tsx).
import { TagsSection } from "./tags/TagsSection";

// Props of the lightbox. Callers (the gallery, the task queue) pass the file to show and the handlers for each button; any handler left out hides its button.
interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseGallery: () => void;
  imageUrl?: string | null;
  imageUrls?: string[];
  actionUrls?: string[];
  mediaTokens?: string[];
  imageAlt?: string;
  onImageError?: () => void;
  title?: string;
  createdAt?: string;
  additionalInfo?: ReactNode;
  downloadUrl?: string;
  mediaId?: string;
  onDownloadClicked?: (url: string, mediaClass?: string, model?: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined,
  ) => Promise<void>;
  mediaClass?: string;
  onPromptCopy?: (prompt: string) => void;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
  onTurnIntoVideoClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onRemoveBackgroundClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onMake3DObjectClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onMake3DWorldClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onRecreateClicked?: (data: {
    promptData: Prompts;
    mediaClass: string | undefined;
  }) => void;
  batchImageToken?: string;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onNavigateToMedia?: (mediaToken: string) => void;
  initialIndex?: number;
}

// The lightbox component. It stays mounted while closed (callers flip isOpen), so state here must be reset by effects, not by unmounting.
export function LightboxModal({
  isOpen,
  onClose,
  onCloseGallery,
  imageUrl,
  imageUrls,
  actionUrls,
  mediaTokens,
  imageAlt = "",
  onImageError,
  title,
  createdAt,
  additionalInfo,
  downloadUrl, // cdn url of the image
  mediaId, // media id of the image
  onDownloadClicked,
  onAddToSceneClicked,
  mediaClass,
  onEditClicked,
  onTurnIntoVideoClicked,
  onRemoveBackgroundClicked,
  onMake3DObjectClicked,
  onMake3DWorldClicked,
  onRecreateClicked,
  batchImageToken,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToMedia,
  initialIndex,
}: LightboxModalProps) {
  // NB(bt,2025-06-14): We add ?cors=1 to the image url to prevent caching "sec-fetch-mode: no-cors" from
  // the <image> tag request from being cached. If we then drag it into the canvas after it's been cached,
  // it won't be able to load in cors mode and will show blank in the canvas and 3D engine. This is a really
  // stupid hack around this behavior.

  // State for the reference-image preview, the media-loading flag and the prompt record fetched from the API.
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState<boolean>(false);
  const [promptData, setPromptData] = useState<Prompts | null>(null);
  // Values read out of the prompt record; each is null until the record has loaded.
  const prompt = promptData?.maybe_positive_prompt ?? null;
  const generationProvider = promptData?.maybe_generation_provider ?? null;
  const modelType = promptData?.maybe_model_type ?? null;
  const contextImages = promptData?.maybe_context_images ?? null;
  const aspectRatio = promptData?.maybe_aspect_ratio ?? null;
  const resolution = promptData?.maybe_resolution ?? null;
  const durationSeconds = promptData?.maybe_duration_seconds ?? null;
  const generateAudio = promptData?.maybe_generate_audio ?? null;
  // Natural size of the shown media, used for the info section.
  const [mediaWidth, setMediaWidth] = useState<number | null>(null);
  const [mediaHeight, setMediaHeight] = useState<number | null>(null);
  // Prompt loading flags and the expand / clamp state of the prompt text ("See all" / "Hide").
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [hasPromptToken, setHasPromptToken] = useState<boolean>(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState<boolean>(false);
  const promptRef = useRef<HTMLDivElement>(null);
  const [isPromptClamped, setIsPromptClamped] = useState<boolean>(false);
  // Copy-button feedback: promptCopied turns the label to "Copied!" for 1.5 s; the ref holds the timer so a second click can restart it.
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  const promptCopiedTimeoutRef = useRef<number | null>(null);
  // The other images of the same batch (urls and media tokens), shown in the carousel, and the file's creator.
  const [batchImages, setBatchImages] = useState<string[] | null>(null);
  const [batchTokens, setBatchTokens] = useState<string[] | null>(null);
  const [creator, setCreator] = useState<UserInfo | null>(null);
  // Share-link feedback state and its timer, same pattern as the Copy button.
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const shareCopiedTimeoutRef = useRef<number | null>(null);
  // Which reference-audio clip is playing (by media token) and the browser Audio object playing it.
  const [playingAudioToken, setPlayingAudioToken] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Stops any playing reference clip and clears the playing flag.
  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setPlayingAudioToken(null);
  }, []);

  // Plays or pauses a reference-audio clip: clicking the playing clip stops it, clicking another stops the old one and starts the new one.
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
        // A rejected play() (bad URL, autoplay policy) must not leave the
        // button stuck on "pause" or surface as an unhandled rejection.
        audio.play().catch(() => {
          if (audioPlayerRef.current === audio) {
            audioPlayerRef.current = null;
            setPlayingAudioToken(null);
          }
        });
        setPlayingAudioToken(token);
      }
    },
    [playingAudioToken, stopAudio],
  );

  // Stable API instances
  // Stable API instances
  const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
  const promptsApi = useMemo(() => new PromptsApi(), []);

  // Reset the per-open UI state each time the lightbox opens; stop audio when it closes.
  useEffect(() => {
    if (isOpen) {
      setRefPreviewUrl(null);
      setSelectedIndex(0);
      setMediaLoaded(false);
      setMediaWidth(null);
      setMediaHeight(null);
      setShareCopied(false);
      setIsPromptExpanded(false);
      stopAudio();
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
        shareCopiedTimeoutRef.current = null;
      }
    } else {
      // Closing the lightbox must silence a reference-audio clip that is
      // still playing; otherwise it keeps going with no UI to stop it.
      stopAudio();
    }
  }, [isOpen]);

  // Moving to another media (arrow keys, prev/next buttons, "View as media") keeps the lightbox open,
  // so the isOpen effect above never runs. The reference-audio rows disappear with the old prompt data,
  // so a clip that is still playing would have no pause button left; the reference preview and the
  // expanded prompt belong to the old media too. Reset all three whenever mediaId changes.
  useEffect(() => {
    stopAudio();
    setRefPreviewUrl(null);
    setIsPromptExpanded(false);
  }, [mediaId]);

  // Same for unmount while a clip is playing.
  useEffect(() => {
    return () => {
      audioPlayerRef.current?.pause();
      audioPlayerRef.current = null;
    };
  }, []);

  // Clear the Share-copied timer if the lightbox unmounts.
  useEffect(() => {
    return () => {
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
        shareCopiedTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch prompt when mediaId changes — debounced to avoid API spam during
  // rapid next/prev navigation, with cancellation for stale responses.
  useEffect(() => {
    // No file selected: clear everything that came from the server and stop.
    if (!mediaId) {
      setPromptData(null);
      setHasPromptToken(false);
      setPromptLoading(false);
      setCreator(null);
      return;
    }

    // Immediately show skeletons & clear stale data
    // A new file: show loading skeletons and drop the previous file's prompt and creator right away.
    setPromptLoading(true);
    setPromptData(null);
    setCreator(null);

    // Set by the cleanup below when mediaId changes again, so a slow answer for an old file is ignored.
    let cancelled = false;

    // Wait 180 ms before asking the server, so holding an arrow key does not fire a request per file.
    const timer = setTimeout(async () => {
      try {
        // Step 1: fetch the media file record (gives the creator and the prompt token).
        const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
          mediaFileToken: mediaId,
        });
        if (cancelled) return;

        // Remember who created the file (shown in the info section and used by the Tags box).
        if (mediaResponse.success && mediaResponse.data) {
          setCreator(mediaResponse.data.maybe_creator_user || null);
        }

        // Step 2: if the file has a prompt, fetch the prompt record with its token.
        if (mediaResponse.success && mediaResponse.data?.maybe_prompt_token) {
          setHasPromptToken(true);
          const promptResponse = await promptsApi.GetPromptsByToken({
            token: mediaResponse.data.maybe_prompt_token,
          });
          if (cancelled) return;

          if (promptResponse.success && promptResponse.data) {
            setPromptData(promptResponse.data);
          } else {
            setPromptData(null);
          }
        } else {
          setHasPromptToken(false);
          setPromptData(null);
        }
      // Any failure leaves the prompt panel empty rather than showing stale data.
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching prompt:", error);
        setHasPromptToken(false);
        setPromptData(null);
      // Stop the skeletons, unless a newer request has taken over.
      } finally {
        if (!cancelled) setPromptLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mediaId, mediaFilesApi, promptsApi]);

  // Detect if prompt text is clamped (overflows the 4-line clamp)
  useEffect(() => {
    if (!promptRef.current || !prompt || promptLoading) {
      setIsPromptClamped(false);
      return;
    }
    // Use requestAnimationFrame to ensure DOM has painted
    const raf = requestAnimationFrame(() => {
      if (promptRef.current) {
        setIsPromptClamped(
          promptRef.current.scrollHeight > promptRef.current.clientHeight,
        );
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [prompt, promptLoading, isPromptExpanded]);

  // Fetch batch images — debounced + cancellable like fetchPrompt above.
  useEffect(() => {
    if (!batchImageToken) {
      setBatchImages(null);
      setBatchTokens(null);
      return;
    }

    // Clear stale batch data immediately
    setBatchImages(null);
    setBatchTokens(null);

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await mediaFilesApi.GetMediaFilesByBatchToken({
          batchToken: batchImageToken,
        });
        if (cancelled) return;

        if (response.success && response.data?.length) {
          // Keep only the files that have both a download url and a token.
          const items = response.data
            .map((file: any) => ({
              url: file.media_links?.cdn_url,
              token: file.token,
            }))
            .filter(
              (item): item is { url: string; token: string } =>
                Boolean(item.url) && Boolean(item.token),
            );

          if (items.length > 0) {
            const primaryToken = mediaId;
            const primaryUrl = imageUrl;

            // Put the file the lightbox was opened on first, matching by token and then by url.
            const sortedItems = [...items].sort((a, b) => {
              if (primaryToken === a.token) return -1;
              if (primaryToken === b.token) return 1;
              if (primaryUrl === a.url) return -1;
              if (primaryUrl === b.url) return 1;
              return 0;
            });

            // Store urls and tokens in the same order so index i of one matches index i of the other.
            setBatchImages(sortedItems.map((item) => item.url));
            setBatchTokens(sortedItems.map((item) => item.token));
          } else {
            setBatchImages(null);
            setBatchTokens(null);
          }
        } else {
          setBatchImages(null);
          setBatchTokens(null);
        }
      } catch (error: unknown) {
        if (cancelled) return;
        setBatchImages(null);
        setBatchTokens(null);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [batchImageToken, mediaId, imageUrl, mediaFilesApi]);

  // Which image urls the carousel shows: the fetched batch, else the urls the caller passed, else the single imageUrl.
  const effectiveImageUrls = useMemo(() => {
    if (batchImages && batchImages.length > 0) {
      return batchImages;
    }
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls;
    }
    return imageUrl ? [imageUrl] : [];
  }, [batchImages, imageUrls, imageUrl]);

  // Index of the image the carousel is showing; Share, Delete and Edit act on this one.
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Main carousel options; loop is off so the first and last images are real boundaries (arrow keys then move to the previous / next file).
  const carouselOptions: EmblaOptionsType = useMemo(
    () => ({ loop: false }),
    [],
  );
  // Two carousels: the main one shows the image, the thumbnail strip below it selects an image.
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(carouselOptions);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  // Clicking a thumbnail scrolls the main carousel to that image.
  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi],
  );

  // Delete button: ask for confirmation, then call the Rust delete command (see the failure handling inside).
  const onDeleteClicked = useCallback(
    (mediaToken: string) => {
      showActionReminder({
        reminderType: "default",
        title: "Delete this media?",
        message: (
          <p className="text-sm text-white/70">
            This will permanently remove the media from your library. This
            action cannot be undone.
          </p>
        ),
        primaryActionText: "Delete",
        secondaryActionText: "Cancel",
        primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
        onPrimaryAction: async () => {
          // True only if the Rust delete command came back without an error; decides whether the viewer closes below.
          let deleted = false;
          try {
            // Calls the Rust delete command; it rejects (offline, signed out, server error) and sends no "File deleted." event.
            await MediaFileDelete(mediaToken);
            deleted = true;
          } catch (error) {
            // Nothing else reports this failure, so say so here (the gallery, bulk delete and characters deletes all do).
            console.error("Failed to delete media:", error);
            toast.error("Failed to delete media");
          } finally {
            // Close the confirmation either way so it can't be left on screen.
            isActionReminderOpen.value = false;
          }
          // Close the viewer only when the media is really gone; after a failure it stays open so the item can be retried.
          if (deleted) {
            onClose();
          }
        },
      });
    },
    [onClose],
  );

  // When the main carousel settles on a slide, remember its index and keep the thumbnail strip in step.
  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    const index = emblaMainApi.selectedScrollSnap();
    setSelectedIndex(index);
    emblaThumbsApi.scrollTo(index);
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  // Re-initialize Embla when slides change so it picks up the new DOM children
  useEffect(() => {
    emblaMainApi?.reInit();
    emblaThumbsApi?.reInit();
  }, [effectiveImageUrls, emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    // When the file changes, jump (no animation) to the slide the caller asked for, or the first one.
    const idx = initialIndex ?? 0;
    setSelectedIndex(idx);
    emblaMainApi?.scrollTo(idx, true);
    emblaThumbsApi?.scrollTo(idx, true);
  }, [batchImageToken, imageUrl, emblaMainApi, emblaThumbsApi]);

  // The url of the shown image, and the url that action buttons use (caller's action url, else the shown image, else the download url).
  const selectedImageUrl = effectiveImageUrls[selectedIndex] ?? null;
  const actionUrl =
    actionUrls?.[selectedIndex] ?? selectedImageUrl ?? downloadUrl ?? undefined;

  // Media token of the shown image: from the fetched batch, else the caller's list, else the main mediaId.
  const selectedMediaToken = useMemo(() => {
    const tokenFromBatch = batchTokens?.[selectedIndex];
    const tokenFromProps = mediaTokens?.[selectedIndex];
    return tokenFromBatch ?? tokenFromProps ?? mediaId;
  }, [batchTokens, mediaTokens, selectedIndex, mediaId]);

  useEffect(() => {
    // Preload the shown image so the loading spinner can be hidden when it is ready (or has failed, so the spinner never sticks).
    if (!selectedImageUrl) {
      setMediaLoaded(false);
      setMediaWidth(null);
      setMediaHeight(null);
      return;
    }

    setMediaLoaded(false);
    setMediaWidth(null);
    setMediaHeight(null);
    const img = new Image();
    img.src = addCorsParam(selectedImageUrl) || selectedImageUrl;

    const handleLoad = () => setMediaLoaded(true);
    const handleError = () => setMediaLoaded(true);

    if (img.complete) {
      setMediaLoaded(true);
    } else {
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);
    }

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [selectedImageUrl]);

  // Media class to use: the caller's, or "image" when a batch of images was fetched.
  const derivedMediaClass = useMemo(
    () =>
      mediaClass ??
      (batchImages && batchImages.length > 0 ? "image" : mediaClass),
    [mediaClass, batchImages],
  );

  // Keyboard navigation:
  //   Left / Right  →  carousel slide; at boundary, moves to prev/next bundle
  //   Up / Down     →  previous / next bundle
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (
          emblaMainApi &&
          effectiveImageUrls.length > 1 &&
          emblaMainApi.canScrollPrev()
        ) {
          emblaMainApi.scrollPrev(true);
        } else {
          onNavigatePrev?.();
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (
          emblaMainApi &&
          effectiveImageUrls.length > 1 &&
          emblaMainApi.canScrollNext()
        ) {
          emblaMainApi.scrollNext(true);
        } else {
          onNavigateNext?.();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onNavigatePrev?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onNavigateNext?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    emblaMainApi,
    effectiveImageUrls.length,
    onNavigatePrev,
    onNavigateNext,
  ]);

  return (
    <>
      {/* The dialog shell: draggable and resizable, with no dimming backdrop, and it lets the page behind stay clickable. */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="rounded-none border-white/15 bg-ui-modal h-[760px] w-[1200px] max-w-screen min-w-[1000px] min-h-[600px] p-4"
        draggable
        allowBackgroundInteraction={true}
        showClose={true}
        closeOnOutsideClick={false}
        resizable={true}
        backdropClassName="pointer-events-none hidden"
        expandable={true}
      >
        {/* Invisible drag handle strip at the very top for moving */}
        <Modal.DragHandle>
          <div className="absolute left-0 top-0 z-20 h-12 w-full cursor-move" />
        </Modal.DragHandle>

        {/* content grid */}
        {/* Two columns: the media on the left (takes the free width), the details panel on the right (fixed 280 px). */}
        <div className="flex h-full gap-4">
          {/* image panel - flexible width */}
          <div className="group/nav relative flex h-full flex-1 items-center justify-center overflow-hidden bg-black">
            {/* Left column: show whichever viewer matches the media class: a message, the 3D viewer, a video, an audio player, or the image carousel. */}
            {!selectedImageUrl ? (
              <div className="flex h-full w-full items-center justify-center bg-black">
                <span className="text-base-fg/60">Image not available</span>
              </div>
            ) : mediaClass === "dimensional" ||
              mediaClass === "mesh" ||
              mediaClass === "splat" ? (
              <div className="h-full w-full">
                <Viewer3D
                  key={selectedImageUrl}
                  modelUrl={selectedImageUrl}
                  isActive={true}
                  showGrid={true}
                  className="h-full w-full"
                />
              </div>
            ) : mediaClass === "video" ? (
              <video
                key={selectedImageUrl}
                controls
                loop={true}
                autoPlay={true}
                playsInline
                className="h-full w-full object-contain"
                // Give WebKit a dedicated compositing layer for paused frames,
                // independent of the modal's transform/opacity animation.
                style={{ transform: "translateZ(0)" }}
                onLoadedData={(e) => {
                  setMediaLoaded(true);
                  const el = e.currentTarget;
                  setMediaWidth(el.videoWidth);
                  setMediaHeight(el.videoHeight);
                }}
              >
                <source src={selectedImageUrl as string} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : mediaClass === "audio" ? (
              <div className="flex h-full w-full items-center justify-center px-4 sm:px-8">
                <div className="w-full max-w-xl border border-white/15 bg-ui-controls px-4 py-10 sm:px-6">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-white/15 bg-white/10">
                    <MusicIcon
                      
                      className="text-2xl text-white/70" />
                  </div>
                  <WaveformAudioPlayer
                    key={selectedImageUrl as string}
                    src={selectedImageUrl as string}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col justify-center">
                <div
                  className="embla relative w-full flex-1 overflow-hidden"
                  ref={emblaMainRef}
                >
                  <div className="embla__container flex h-full">
                    {effectiveImageUrls.map((url, idx) => (
                      <div
                        className="embla__slide flex-[0_0_100%]"
                        key={`${url}-${idx}`}
                      >
                        <div className="relative flex h-full items-center justify-center overflow-hidden bg-black">
                          <img
                            data-lightbox-modal="true"
                            src={addCorsParam(url) || url}
                            alt={`${imageAlt || "Generated image"} ${idx + 1}`}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              onImageError?.();
                              if (idx === selectedIndex) {
                                setMediaLoaded(true);
                                e.currentTarget.src =
                                  PLACEHOLDER_IMAGES.DEFAULT;
                                e.currentTarget.style.opacity = "0.3";
                                // Set the `data-brokenurl` property for debugging the broken images:
                                (
                                  e.currentTarget as HTMLImageElement
                                ).dataset.brokenurl = url || "";
                              }
                            }}
                            onLoad={(e) => {
                              if (idx === selectedIndex) {
                                setMediaLoaded(true);
                                const img = e.currentTarget;
                                setMediaWidth(img.naturalWidth);
                                setMediaHeight(img.naturalHeight);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {effectiveImageUrls.length > 1 && (
                  <div className="mt-3 px-2 pb-2">
                    <div
                      className="embla-thumbs overflow-hidden"
                      ref={emblaThumbsRef}
                    >
                      <div className="embla-thumbs__container flex justify-center gap-2">
                        {effectiveImageUrls.map((url, idx) => {
                          const isSelected = idx === selectedIndex;
                          return (
                            <button
                              key={`${url}-thumb-${idx}`}
                              type="button"
                              onClick={() => onThumbClick(idx)}
                              className={twMerge(
                                "embla-thumbs__slide relative h-16 w-16 flex-[0_0_4rem] overflow-hidden border transition-all",
                                isSelected
                                  ? "border-white opacity-100"
                                  : "border-transparent opacity-60 hover:border-white/40 hover:opacity-100",
                              )}
                            >
                              <img
                                src={addCorsParam(url) || url}
                                alt={`Thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover bg-black/20"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading overlay: covers the image / video until it has loaded or failed (3D and audio show their own loading). */}
            {!mediaLoaded &&
              selectedImageUrl &&
              mediaClass !== "dimensional" &&
              mediaClass !== "mesh" &&
              mediaClass !== "splat" &&
              mediaClass !== "audio" && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <LoadingSpinner className="h-12 w-12 text-base-fg" />
                </div>
              )}

            {/* Gallery navigation arrows – only visible on hover */}
            {/* Previous / Next file buttons; each shows only when the caller supplied the handler, and they appear on hover. */}
            {onNavigatePrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigatePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center bg-black/50 text-white/70 opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover/nav:opacity-100 focus:outline-none"
                aria-label="Previous item"
              >
                <ChevronLeftIcon  className="text-lg" />
              </button>
            )}
            {onNavigateNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center bg-black/50 text-white/70 opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover/nav:opacity-100 focus:outline-none"
                aria-label="Next item"
              >
                <ChevronRightIcon  className="text-lg" />
              </button>
            )}
          </div>

          {/* info + actions - fixed width */}
          <div className="flex h-full w-[280px] shrink-0 flex-col">
            <div className="flex-1 overflow-y-auto space-y-5 text-base-fg min-h-0 pb-2">
              {/* Author header: the creator's avatar and name once loaded, a pulsing skeleton while loading, nothing otherwise. */}
              {creator ? (
                <div className="sticky top-0 z-10 flex items-center gap-3 bg-ui-modal pb-3 pr-20 border-b border-white/10">
                  {creator.core_info ? (
                    <Gravatar
                      size={36}
                      username={creator.username}
                      email_hash={creator.email_gravatar_hash}
                      avatarIndex={creator.core_info.default_avatar.image_index}
                      backgroundIndex={
                        creator.core_info.default_avatar.color_index
                      }
                      className="rounded-none border-white/15"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center bg-white/10 text-white/50 border border-white/15">
                      <UserIcon />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-base-fg text-sm font-semibold leading-none truncate">
                      {creator.display_name}
                    </span>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
                      Author
                    </span>
                  </div>
                </div>
              ) : promptLoading ? (
                <div className="sticky top-0 z-10 flex items-center gap-3 bg-ui-modal pb-3 pr-20 border-b border-white/10 animate-pulse">
                  <div className="h-9 w-9 shrink-0 bg-white/10" />
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="h-3.5 w-24 bg-white/10" />
                    <div className="h-3 w-12 bg-white/10" />
                  </div>
                </div>
              ) : null}
              {/* Prompt section, shown for files made from a prompt (or while we are still finding out). */}
              {(hasPromptToken || promptLoading) && (
                <>
                  {/* Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
                        <PencilIcon />
                        <span>Prompt</span>
                      </div>
                      {/* Copy button: copies the prompt text to the clipboard and flashes "Copied!" (see the failure handling in the click handler). */}
                      {!promptLoading && prompt && (
                        <button
                          className="flex items-center gap-1.5 text-xs text-base-fg/60 hover:text-base-fg transition-colors"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!prompt) return;
                            // Only report success when the clipboard write worked, as the Share button does.
                            try {
                              await navigator.clipboard.writeText(prompt);
                            } catch {
                              toast.error("Unable to copy prompt");
                              return;
                            }
                            toast.success("Prompt copied");
                            setPromptCopied(true);
                            if (promptCopiedTimeoutRef.current) {
                              window.clearTimeout(
                                promptCopiedTimeoutRef.current,
                              );
                            }
                            promptCopiedTimeoutRef.current = window.setTimeout(
                              () => {
                                setPromptCopied(false);
                                promptCopiedTimeoutRef.current = null;
                              },
                              1500,
                            );
                          }}
                        >
                          <DynamicIcon
                            icon={promptCopied ? CheckIcon : CopyIcon}
                            className="h-3 w-3"
                          />
                          <span>{promptCopied ? "Copied!" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                    <div
                      className="text-sm text-base-fg/90 break-words px-4 py-3 bg-black/20 leading-relaxed border border-white/10"
                    >
                      {/* Prompt text: skeleton while loading, else the text clamped to four lines (or fully shown when expanded), else "No prompt". */}
                      {promptLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 w-full bg-white/10" />
                          <div className="h-3 w-4/5 bg-white/10" />
                          <div className="h-3 w-3/5 bg-white/10" />
                        </div>
                      ) : (
                        <div
                          ref={promptRef}
                          className={twMerge(
                            !isPromptExpanded && "line-clamp-4",
                          )}
                        >
                          {prompt || (
                            <span className="text-sm text-base-fg">
                              No prompt
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!promptLoading &&
                      prompt &&
                      (isPromptClamped || isPromptExpanded) && (
                        <button
                          className="flex w-full items-center justify-center gap-1 text-xs text-base-fg/70 hover:text-base-fg transition-colors py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPromptExpanded((prev) => !prev);
                          }}
                        >
                          <span>{isPromptExpanded ? "Hide" : "See all"}</span>
                          <svg
                            className={twMerge(
                              "h-3 w-3 transition-transform duration-200",
                              isPromptExpanded && "rotate-180",
                            )}
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2.5 4.5L6 8L9.5 4.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                  </div>

                  {promptLoading ? (
                    /* Skeleton placeholders while fetching metadata */
                    <>
                      {/* Reference Images skeleton */}
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3.5 w-28 bg-white/10" />
                        <div className="flex gap-1.5">
                          <div className="h-12 w-12 bg-white/10" />
                          <div className="h-12 w-12 bg-white/10" />
                          <div className="h-12 w-12 bg-white/10" />
                        </div>
                      </div>
                      {/* Information skeleton */}
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3.5 w-24 bg-white/10" />
                        <div className="flex flex-col bg-black/20 border border-white/10 overflow-hidden">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-2.5 px-3 border-b border-white/10 last:border-0"
                            >
                              <div className="h-3.5 w-16 bg-white/10" />
                              <div className="h-3.5 w-24 bg-white/10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {contextImages && contextImages.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
                            <ImageIcon />
                            <span>Reference Media</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 w-fit">
                            {contextImages.map((contextImage, index) => {
                              const isAudio = contextImage.semantic === "audioref";
                              const isVideoRef = contextImage.semantic === "vid_ref";
                              const { thumbnail, fullSize } =
                                getContextImageThumbnail(contextImage, {
                                  size: THUMBNAIL_SIZES.SMALL,
                                });
                              const isPlayingThis = playingAudioToken === contextImage.media_token;

                              return (
                                <Tooltip
                                  key={contextImage.media_token}
                                  position="top"
                                  interactive
                                  strategy="fixed"
                                  delay={150}
                                  zIndex={50}
                                  className="p-1"
                                  content={
                                    <div className="flex flex-col gap-1.5 min-w-[100px]">
                                      {!isAudio && !isVideoRef && (
                                        <button
                                          className="text-xs text-left text-base-fg/80 hover:text-base-fg transition-colors py-1 px-1 rounded-[3px] hover:bg-white/5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRefPreviewUrl(fullSize);
                                          }}
                                        >
                                          <SearchIcon
                                            
                                            className="mr-1.5" />
                                          Preview image
                                        </button>
                                      )}
                                      {onNavigateToMedia && (
                                        <button
                                          className="text-xs text-left text-base-fg/80 hover:text-base-fg transition-colors py-1 px-1 rounded-[3px] hover:bg-white/5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigateToMedia(
                                              contextImage.media_token,
                                            );
                                          }}
                                        >
                                          <LogOutIcon
                                            
                                            className="mr-1.5" />
                                          View as media
                                        </button>
                                      )}
                                    </div>
                                  }
                                >
                                  <div
                                    className="relative aspect-square w-12 overflow-hidden border border-white/15 bg-white/5 transition-colors hover:border-white/40 group cursor-pointer"
                                    onClick={() => {
                                      if (isAudio) {
                                        handleAudioToggle(contextImage.media_token, contextImage.media_links.cdn_url);
                                      } else if (!isVideoRef) {
                                        setRefPreviewUrl(fullSize);
                                      }
                                    }}
                                  >
                                    {isAudio ? (
                                      <div className="h-full w-full flex items-center justify-center bg-white/5">
                                        <DynamicIcon
                                          icon={isPlayingThis ? PauseIcon : PlayIcon}
                                          className="text-base-fg/70 text-lg"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <img
                                          src={thumbnail}
                                          alt={`Reference ${index + 1}`}
                                          className="h-full w-full object-cover"
                                        />
                                        {isVideoRef && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <VideoIcon
                                              
                                              className="text-white/80 text-sm drop-shadow-lg" />
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <InfoSection
                        modelType={modelType}
                        generationProvider={generationProvider}
                        aspectRatio={aspectRatio}
                        resolution={resolution}
                        durationSeconds={durationSeconds}
                        generateAudio={generateAudio}
                        mediaWidth={mediaWidth}
                        mediaHeight={mediaHeight}
                        createdAt={createdAt}
                      />
                    </>
                  )}
                </>
              )}

              {!hasPromptToken && !promptLoading && (
                <InfoSection
                  modelType={null}
                  generationProvider={null}
                  aspectRatio={null}
                  resolution={null}
                  durationSeconds={null}
                  generateAudio={null}
                  mediaWidth={mediaWidth}
                  mediaHeight={mediaHeight}
                  createdAt={createdAt}
                />
              )}

              <TagsSection mediaToken={mediaId} creator={creator} />

              {additionalInfo}
            </div>

            {/* buttons with spacing */}
            {actionUrl && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                {onRecreateClicked &&
                  hasPromptToken &&
                  promptData &&
                  (derivedMediaClass === "image" ||
                    derivedMediaClass === "video") && (
                    <Button
                      className="w-full col-span-2 py-1.5 text-[13px]"
                      variant="primary"
                      icon={RotateCwIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        gtagEvent("recreate_clicked");
                        onRecreateClicked({
                          promptData,
                          mediaClass: derivedMediaClass,
                        });
                      }}
                    >
                      Recreate
                    </Button>
                  )}

                {onEditClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full py-1.5 text-[13px]"
                      variant="primary"
                      icon={PencilIcon}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("edit_image_clicked");
                        await onEditClicked(actionUrl, selectedMediaToken);
                      }}
                    >
                      Edit Image
                    </Button>
                  )}

                {onTurnIntoVideoClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full py-1.5 text-[13px]"
                      variant="primary"
                      icon={VideoIcon}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("turn_into_video_clicked");
                        await onTurnIntoVideoClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                      }}
                    >
                      Make Video
                    </Button>
                  )}

                {onRemoveBackgroundClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full py-1.5 text-[13px]"
                      variant="secondary"
                      icon={WandSparklesIcon}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("remove_background_clicked");
                        await onRemoveBackgroundClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                        onClose();
                        onCloseGallery();
                      }}
                    >
                      Remove BG
                    </Button>
                  )}

                {onMake3DObjectClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full py-1.5 text-[13px]"
                      variant="secondary"
                      icon={BoxIcon}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("image_to_3d_clicked");
                        await onMake3DObjectClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                        onClose();
                        onCloseGallery();
                      }}
                    >
                      Make 3D
                    </Button>
                  )}

                {onMake3DWorldClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full py-1.5 text-[13px]"
                      variant="secondary"
                      icon={GlobeIcon}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("image_to_3d_world_clicked");
                        await onMake3DWorldClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                        onClose();
                        onCloseGallery();
                      }}
                    >
                      Make 3D World
                    </Button>
                  )}

                {onDownloadClicked && actionUrl && (
                  <Button
                    className={
                      derivedMediaClass === "image"
                        ? "w-full py-1.5 text-[13px]"
                        : "w-full col-span-2 py-1.5 text-[13px]"
                    }
                    variant="secondary"
                    icon={ArrowDownToLineIcon}
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("download_clicked");
                      await onDownloadClicked(actionUrl, mediaClass, modelType ?? undefined);
                    }}
                  >
                    Download
                  </Button>
                )}

                {onAddToSceneClicked && actionUrl && (
                  <Button
                    className="w-full py-1.5 text-[13px]"
                    variant="secondary"
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("add_to_scene_clicked");
                      await onAddToSceneClicked(actionUrl, selectedMediaToken);
                      onClose();
                      onCloseGallery();
                    }}
                  >
                    Add to Scene
                  </Button>
                )}

                {selectedMediaToken && (
                  <Button
                    className="w-full py-1.5 text-[13px]"
                    variant="secondary"
                    icon={shareCopied ? CheckIcon : LinkIcon}
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("share_link_copied");
                      const shareUrl = `https://getartcraft.com/media/${selectedMediaToken}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Share link copied");
                        setShareCopied(true);
                        if (shareCopiedTimeoutRef.current) {
                          window.clearTimeout(shareCopiedTimeoutRef.current);
                        }
                        shareCopiedTimeoutRef.current = window.setTimeout(
                          () => {
                            setShareCopied(false);
                            shareCopiedTimeoutRef.current = null;
                          },
                          1500,
                        );
                      } catch (err) {
                        toast.error("Unable to copy link");
                      }
                    }}
                  >
                    {shareCopied ? "Link Copied!" : "Share"}
                  </Button>
                )}

                {selectedMediaToken && onDeleteClicked && (
                  <Button
                    icon={Trash2Icon}
                    className="w-full border border-red-500/20 bg-red-500/10 py-1.5 text-[13px] text-red-500 hover:bg-red-500/20"
                    variant="destructive"
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("delete_media_clicked");
                      await onDeleteClicked(selectedMediaToken);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {refPreviewUrl && (
        <Modal
          isOpen={true}
          onClose={() => setRefPreviewUrl(null)}
          className="rounded-none border-white/15 bg-ui-modal w-auto h-auto max-w-[75vw] max-h-[75vh] p-4"
          draggable
          allowBackgroundInteraction={true}
          showClose={true}
          closeOnOutsideClick={true}
          resizable={false}
          backdropClassName=""
          expandable={false}
        >
          <Modal.DragHandle>
            <div className="absolute left-0 top-0 z-20 h-12 w-full cursor-move" />
          </Modal.DragHandle>
          <div className="relative flex items-center justify-center overflow-hidden bg-black">
            <img
              src={addCorsParam(refPreviewUrl) || refPreviewUrl}
              alt="Reference preview"
              className="max-w-[72vw] max-h-[70vh] object-contain"
            />
          </div>
        </Modal>
      )}
    </>
  );
}

interface InfoSectionProps {
  modelType: string | null;
  generationProvider: string | null;
  aspectRatio: string | null;
  resolution: string | null;
  durationSeconds: number | null;
  generateAudio: boolean | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  createdAt?: string;
}

function InfoSection({
  modelType,
  generationProvider,
  aspectRatio,
  resolution,
  durationSeconds,
  generateAudio,
  mediaWidth,
  mediaHeight,
  createdAt,
}: InfoSectionProps) {
  const hasAnyInfo =
    !!modelType ||
    !!generationProvider ||
    !!aspectRatio ||
    !!resolution ||
    durationSeconds != null ||
    generateAudio != null ||
    (!!mediaWidth && !!mediaHeight) ||
    !!createdAt;

  if (!hasAnyInfo) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
        <InfoIcon />
        <span>Information</span>
      </div>
      <div className="flex flex-col bg-black/20 border border-white/10 overflow-hidden">
        {modelType && (
          <InfoRow
            label="Model"
            value={
              <>
                <img
                  src={getCreatorIconPathForModelId(modelType)}
                  alt="Model creator logo"
                  className="h-4 w-4 invert"
                />
                <span>{getModelDisplayName(modelType)}</span>
              </>
            }
          />
        )}
        {generationProvider && (
          <InfoRow
            label="Provider"
            value={
              <>
                {getProviderIconByName(generationProvider, "h-4 w-4 invert")}
                <span>{getProviderDisplayName(generationProvider)}</span>
              </>
            }
          />
        )}
        {aspectRatio && (
          <InfoRow
            label="Aspect Ratio"
            value={formatAspectRatio(aspectRatio)}
          />
        )}
        {resolution && (
          <InfoRow label="Resolution" value={formatResolution(resolution)} />
        )}
        {durationSeconds != null && (
          <InfoRow label="Duration" value={formatDuration(durationSeconds)} />
        )}
        {generateAudio != null && (
          <InfoRow label="Audio" value={generateAudio ? "On" : "Off"} />
        )}
        {mediaWidth && mediaHeight && (
          <InfoRow label="Size" value={`${mediaWidth} × ${mediaHeight}`} />
        )}
        {createdAt && (
          <InfoRow
            label="Created"
            value={dayjs(createdAt).format("MMM D, YYYY h:mm:ss A")}
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-2.5 border-b border-white/10 last:border-0">
      <span className="shrink-0 pt-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
        {label}
      </span>
      <span className="min-w-0 text-right text-sm text-base-fg font-medium flex items-center justify-end gap-2">
        {value}
      </span>
    </div>
  );
}

export default LightboxModal;
