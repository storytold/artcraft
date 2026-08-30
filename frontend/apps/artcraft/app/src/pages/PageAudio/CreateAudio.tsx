import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PromptBoxAudio, usePromptAudioStore } from "@storyteller/ui-promptbox";
import {
  UploadAudioMedia,
  UploadImageMedia,
  FilterMediaClasses,
} from "@storyteller/api";
import { useOmniGenAudioModels, useAudioCostEstimate } from "@storyteller/omni-gen";
import BackgroundGallery from "../PageImage/BackgroundGallery";
import {
  galleryModalLightboxImage,
  galleryModalLightboxMediaId,
  galleryModalLightboxVisible,
  galleryModalLightboxNavPrev,
  galleryModalLightboxNavNext,
} from "@storyteller/ui-gallery-modal";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import {
  useGalleryData,
  useGenerationJobs,
  useLastViewedGenerationStore,
  type GalleryItem,
} from "@storyteller/ui-generation-list";
import { useDesktopUsername } from "~/components/generation-feed/useDesktopUsername";
import { DesktopCreatePageShell } from "~/components/generation-feed/DesktopCreatePageShell";
import { DesktopGenerationGallery } from "~/components/generation-feed/DesktopGenerationGallery";

const AUDIO_FILTER = [FilterMediaClasses.AUDIO];

const CreateAudio = () => {
  const { models } = useOmniGenAudioModels();
  const promptContentRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState<number>(138);

  // Cost estimate inputs come from the shared audio prompt store (the
  // promptbox owns the settings; the page only observes them).
  const selectedModelId = usePromptAudioStore((s) => s.selectedModelId);
  const referenceAudios = usePromptAudioStore((s) => s.referenceAudios);
  const referenceImages = usePromptAudioStore((s) => s.referenceImages);
  const selectedModel = useMemo(
    () =>
      models.find((m) => m.model === selectedModelId) ??
      models.find((m) => m.model === "suno_music") ??
      models[0],
    [models, selectedModelId],
  );
  const audioCredits = useAudioCostEstimate({
    model: selectedModel?.model ?? "",
    audioReferenceCount: referenceAudios.length,
    hasImageReference: referenceImages.length > 0,
    sampleRateHz: selectedModel?.sample_rate_hz_options?.length
      ? (selectedModel.sample_rate_hz_default ?? undefined)
      : undefined,
  });

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

  // The merged generation feed. Audio enqueues over HTTP (no Tauri task
  // queue), so in-progress/failed come from the shared jobs poller and the
  // completed history from the library — exactly like the webapp.
  const username = useDesktopUsername();
  const feed = useGenerationJobs({ mediaType: "audio", enabled: !!username });
  const gallery = useGalleryData({
    username,
    filterMediaClasses: AUDIO_FILTER,
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
  const lastViewedId = useLastViewedGenerationStore((s) => s.id);

  const openInLightbox = useCallback((item: GalleryItem) => {
    useLastViewedGenerationStore.getState().setId(item.id);
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
      emptyStateTitle="Create Audio"
      emptyStateSubtitle="Describe a song, a sound, or a sample"
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
          lastViewedId={lastViewedId}
        />
      }
      promptBox={
        <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-2 sm:px-4">
          <div ref={promptContentRef}>
            <PromptBoxAudio
              models={models}
              uploadAudio={UploadAudioMedia}
              uploadImage={UploadImageMedia}
              credits={audioCredits}
              onEnqueuePressed={async () => {
                // Nudge the shared jobs poller so the pending cards appear
                // immediately (one per created job token).
                window.dispatchEvent(new Event("task-queue-update"));
                window.dispatchEvent(new Event("credits-change"));
              }}
            />
          </div>
        </div>
      }
      bottomRight={<HelpMenuButton />}
    />
  );
};

export default CreateAudio;
