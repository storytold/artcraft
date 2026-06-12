import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JobContextType } from "@storyteller/common";
import {
  PromptBoxVideo,
  PromptBoxErrorBoundary,
} from "@storyteller/ui-promptbox";
import {
  UploadImageMedia,
  UploadVideoMedia,
  UploadAudioMedia,
  FilterMediaClasses,
} from "@storyteller/api";
import BackgroundGallery from "./BackgroundGallery";
import {
  ClassyModelSelector,
  IMAGE_TO_VIDEO_PAGE_MODEL_LIST,
  ModelPage,
  useSelectedVideoModel,
  useSelectedProviderForModel,
} from "@storyteller/ui-model-selector";
import { VideoModel } from "@storyteller/model-list";
import { useImageToVideoStore } from "./ImageToVideoStore";
import {
  useVideoGenerationCompleteEvent,
  VideoGenerationCompleteEvent,
} from "@storyteller/tauri-events";
import {
  galleryModalLightboxImage,
  galleryModalLightboxMediaId,
  galleryModalLightboxVisible,
  galleryModalLightboxNavPrev,
  galleryModalLightboxNavNext,
} from "@storyteller/ui-gallery-modal";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import {
  CostCalculatorButton,
  useCostBreakdownModalStore,
} from "@storyteller/ui-pricing-modal";
import { GenerationProvider } from "@storyteller/api-enums";
import {
  useGalleryData,
  type GalleryItem,
} from "@storyteller/ui-generation-list";
import { useDesktopGenerationFeed } from "~/components/generation-feed/useDesktopGenerationFeed";
import { useDesktopUsername } from "~/components/generation-feed/useDesktopUsername";
import { DesktopCreatePageShell } from "~/components/generation-feed/DesktopCreatePageShell";
import { DesktopGenerationGallery } from "~/components/generation-feed/DesktopGenerationGallery";

const PAGE_ID: ModelPage = ModelPage.ImageToVideo;

const VIDEO_FILTER = [FilterMediaClasses.VIDEO];

interface ImageToVideoProps {
  imageMediaId?: string;
  imageUrl?: string;
}

const ImageToVideo = ({ imageMediaId, imageUrl }: ImageToVideoProps) => {
  const startBatch = useImageToVideoStore((s) => s.startBatch);
  const completeBatch = useImageToVideoStore((s) => s.completeBatch);
  const promptContentRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState<number>(138);

  const selectedVideoModel: VideoModel | undefined =
    useSelectedVideoModel(PAGE_ID);

  const selectedProvider: GenerationProvider | undefined =
    useSelectedProviderForModel(PAGE_ID, selectedVideoModel?.id);

  const videoCredits = useCostBreakdownModalStore(
    (s) => s.estimatedCreditsByPage[PAGE_ID],
  );

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  // Keep the local batch store in sync (other listeners may rely on it); the
  // visible feed below is driven by the task queue + library instead.
  useVideoGenerationCompleteEvent(
    async (event: VideoGenerationCompleteEvent) => {
      if (!event.generated_video) return;
      completeBatch(
        {
          cdn_url: event.generated_video.cdn_url,
          media_token: event.generated_video.media_token,
        },
        event.maybe_frontend_subscriber_id,
      );
    },
  );

  // Track the promptbox height so the feed can pad past it.
  useEffect(() => {
    const el = promptContentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The merged generation feed: in-progress / failed from the Tauri task
  // queue, completed history from the library (like the webapp list view).
  const username = useDesktopUsername();
  const feed = useDesktopGenerationFeed({ mediaType: "video" });
  const gallery = useGalleryData({
    username,
    filterMediaClasses: VIDEO_FILTER,
    excludeUploads: true,
  });

  // Content only — while the gallery is still loading the shell keeps the
  // hero + background up as a splash and fades them out when items land.
  const hasContent =
    feed.inProgress.length > 0 ||
    feed.failed.length > 0 ||
    feed.newlyCompleted.length > 0 ||
    gallery.items.length > 0;

  const newlyCompletedTokens = useMemo(
    () => new Set(feed.newlyCompleted.map((item) => item.id)),
    [feed.newlyCompleted],
  );

  // Flat, time-sorted completed list driving lightbox prev/next navigation.
  const flatCompleted = useMemo(() => {
    const seen = new Set<string>();
    const merged: GalleryItem[] = [];
    for (const item of feed.newlyCompleted) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    for (const item of gallery.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return merged;
  }, [feed.newlyCompleted, gallery.items]);

  const flatCompletedRef = useRef(flatCompleted);
  flatCompletedRef.current = flatCompleted;

  // Open a completed row in the global lightbox (rendered by TopBar's
  // gallery modal); prev/next walk the merged feed order.
  const openInLightbox = useCallback((item: GalleryItem) => {
    const list = flatCompletedRef.current;
    const index = list.findIndex((i) => i.id === item.id);
    galleryModalLightboxNavPrev.value =
      index > 0 ? () => openInLightbox(list[index - 1]) : null;
    galleryModalLightboxNavNext.value =
      index >= 0 && index < list.length - 1
        ? () => openInLightbox(list[index + 1])
        : null;
    galleryModalLightboxMediaId.value = item.id;
    galleryModalLightboxImage.value = {
      id: item.id,
      label: item.label,
      thumbnail: item.thumbnail,
      fullImage: item.fullImage,
      createdAt: item.createdAt,
      mediaClass: item.mediaClass,
    };
    galleryModalLightboxVisible.value = true;
  }, []);

  return (
    <DesktopCreatePageShell
      hasContent={hasContent}
      emptyStateTitle="Create Video"
      emptyStateSubtitle="Choose an image, add a prompt, then generate"
      background={<BackgroundGallery />}
      bottomOffset={promptHeight + 40}
      listContent={
        <DesktopGenerationGallery
          inProgressJobs={feed.inProgress}
          failedJobs={feed.failed}
          onDismissFailed={feed.dismissFailed}
          newlyCompletedItems={feed.newlyCompleted}
          galleryItems={gallery.items}
          newlyCompletedTokens={newlyCompletedTokens}
          hasMore={gallery.hasMore}
          isLoading={gallery.isLoading}
          isInitialLoading={gallery.isInitialLoading}
          onLoadMore={gallery.loadMore}
          onGalleryItemClick={openInLightbox}
        />
      }
      promptBox={
        <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-2 sm:px-4">
          <div ref={promptContentRef}>
            <PromptBoxErrorBoundary>
              <PromptBoxVideo
                useJobContext={() => jobContext}
                selectedModel={selectedVideoModel}
                selectedProvider={selectedProvider}
                imageMediaId={imageMediaId}
                url={imageUrl ?? undefined}
                uploadImage={UploadImageMedia}
                uploadVideo={UploadVideoMedia}
                uploadAudio={UploadAudioMedia}
                credits={videoCredits}
                modelSelector={
                  <ClassyModelSelector
                    variant="embedded"
                    items={IMAGE_TO_VIDEO_PAGE_MODEL_LIST}
                    page={PAGE_ID}
                  />
                }
                onEnqueuePressed={async (prompt, subscriberIds) => {
                  const modelLabel = selectedVideoModel?.fullName ?? "";
                  for (const subscriberId of subscriberIds) {
                    startBatch(prompt, modelLabel, subscriberId);
                  }
                  // Nudge the feed (and the TopBar task queue) to refetch so
                  // the pending row appears immediately.
                  window.dispatchEvent(new Event("task-queue-update"));
                }}
              />
            </PromptBoxErrorBoundary>
          </div>
        </div>
      }
      bottomRight={
        <>
          <CostCalculatorButton modelPage={PAGE_ID} />
          <HelpMenuButton />
        </>
      }
    />
  );
};

export default ImageToVideo;
