// CreateAudio: the "Audio" tab where the user writes a prompt to generate music or sound and sees past results.
// Rendered (lazy-loaded) by pages/MainApp.tsx. Uses the shared DesktopCreatePageShell layout and DesktopGenerationGallery feed
// from ~/components/generation-feed, the PromptBoxAudio input from @storyteller/ui-promptbox, and the Rust Tauri commands
// GenerateAudio / EstimateAudioCost (@storyteller/tauri-api). Finished items open in the global lightbox shown by the TopBar.

import { GenerateAudio, EstimateAudioCost } from "@storyteller/tauri-api";
import type { OmniGenAudioRequest } from "@storyteller/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PromptBoxAudio, usePromptAudioStore } from "@storyteller/ui-promptbox";
import {
  UploadAudioMedia,
  UploadImageMedia,
  FilterMediaClasses,
} from "@storyteller/api";
import { useOmniGenAudioModels, useAudioCostEstimate } from "@storyteller/omni-gen";
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

// Adapters passed to the shared prompt box: each calls a Rust Tauri command and returns just the response payload.
const generateAudio = async (request: OmniGenAudioRequest) => (await GenerateAudio(request)).payload;
const estimateAudio = async (request: OmniGenAudioRequest) => (await EstimateAudioCost(request)).payload;

// Gallery filter: audio files only. Defined outside the component so the same array object is reused on every render.
const AUDIO_FILTER = [FilterMediaClasses.AUDIO];

/**
 * The whole Audio page. Takes no props; it is the default export.
 */
const CreateAudio = () => {
  const { models } = useOmniGenAudioModels();
  // Ref to the DOM box around the prompt box. A ref, not state, because we need the element itself to measure it.
  const promptContentRef = useRef<HTMLDivElement>(null);
  // Measured prompt box height in pixels; 138 is the starting guess until the first measurement.
  const [promptHeight, setPromptHeight] = useState<number>(138);

  // Cost estimate inputs come from the shared audio prompt store (the
  // promptbox owns the settings; the page only observes them).
  const selectedModelId = usePromptAudioStore((s) => s.selectedModelId);
  const referenceAudios = usePromptAudioStore((s) => s.referenceAudios);
  const referenceImages = usePromptAudioStore((s) => s.referenceImages);
  // Model used for the price estimate: the one picked in the prompt box, else "suno_music", else the first available.
  const selectedModel = useMemo(
    () =>
      models.find((m) => m.model === selectedModelId) ??
      models.find((m) => m.model === "suno_music") ??
      models[0],
    [models, selectedModelId],
  );
  // Estimated credit cost for the current settings. A sample rate is sent only if the model offers sample-rate options.
  const audioCredits = useAudioCostEstimate({
    model: selectedModel?.model ?? "",
    audioReferenceCount: referenceAudios.length,
    hasImageReference: referenceImages.length > 0,
    sampleRateHz: selectedModel?.sample_rate_hz_options?.length
      ? (selectedModel.sample_rate_hz_default ?? undefined)
      : undefined,
  }, estimateAudio);

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

  // Tauri enqueues and persists audio jobs; the shared session poller and
  // library provide the same generation feed used by the webapp.
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

  // Ids of just-finished items, for quick "is this new?" lookups in the gallery.
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

  // Ref copy of the list so openInLightbox (memoized with no dependencies) always reads the latest list, not a stale one.
  const flatCompletedRef = useRef(flatCompleted);
  flatCompletedRef.current = flatCompleted;

  // Open a completed row in the global lightbox (rendered by TopBar's
  // gallery modal); prev/next walk the merged feed order.
  const lastViewedId = useLastViewedGenerationStore((s) => s.id);

  // The galleryModalLightbox* values are signals (set through .value), so assigning them updates the TopBar's lightbox.
  // The prev/next callbacks are null at the ends of the list.
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

  // bottomOffset adds 40 px of spacing to the prompt box height so the last feed row can scroll clear of the fixed prompt box.
  return (
    <DesktopCreatePageShell
      hasContent={hasContent}
      emptyStateTitle="Create Audio"
      emptyStateSubtitle="Describe a song, a sound, or a sample"
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
          // A failed history request shows "Try again" (which re-asks for the same page) instead of an endless spinner.
          loadFailed={gallery.loadFailed}
          onRetry={gallery.loadMore}
          onGalleryItemClick={openInLightbox}
          lastViewedId={lastViewedId}
        />
      }
      promptBox={
        <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-2 sm:px-4">
          <div ref={promptContentRef}>
            <PromptBoxAudio
              generateAudio={generateAudio}
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
