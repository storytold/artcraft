import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JobContextType } from "@storyteller/common";
import { PromptBoxImage } from "@storyteller/ui-promptbox";
import { UploadImageMedia, FilterMediaClasses } from "@storyteller/api";
import {
  useTextToImagePageModelList,
  ModelPage,
  ClassyModelSelector,
  useSelectedImageModel,
  useSelectedProviderForModel,
  useClassyModelSelectorStore,
} from "@storyteller/ui-model-selector";
import { ImageModel } from "@storyteller/model-list";
import { useTextToImageStore } from "./TextToImageStore";
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
  localGenerationsToGalleryItems,
  useGalleryData,
  useLastViewedGenerationStore,
  type GalleryItem,
} from "@storyteller/ui-generation-list";
import { useLocalGenerations } from "@storyteller/tauri-api";
import { useDesktopGenerationFeed } from "~/components/generation-feed/useDesktopGenerationFeed";
import { useDesktopUsername } from "~/components/generation-feed/useDesktopUsername";
import { DesktopCreatePageShell } from "~/components/generation-feed/DesktopCreatePageShell";
import { DesktopGenerationGallery } from "~/components/generation-feed/DesktopGenerationGallery";
import { useSignals } from "@preact/signals-react/runtime";
import { authentication } from "~/signals";
import { AUTH_STATUS } from "~/enums";

const PAGE_ID: ModelPage = ModelPage.TextToImage;

const IMAGE_FILTER = [FilterMediaClasses.IMAGE];

interface TextToImageProps {
  imageMediaId?: string;
  imageUrl?: string;
}

/** Compose image generation and merged local/cloud history, with WaveSpeed selection for signed-out users. */
const TextToImage = ({ imageMediaId, imageUrl }: TextToImageProps) => {
  useSignals();
  const isSignedIn = authentication.status.value === AUTH_STATUS.LOGGED_IN;
  const textToImageModelList = useTextToImagePageModelList();
  const startBatch = useTextToImageStore((s) => s.startBatch);
  const promptContentRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState<number>(138);

  const selectedImageModel: ImageModel | undefined =
    useSelectedImageModel(PAGE_ID);

  const selectedProvider: GenerationProvider | undefined =
    useSelectedProviderForModel(PAGE_ID, selectedImageModel?.id);

  /** Select WaveSpeed on the current compatible model or the first compatible model in the page catalog. */
  const useWaveSpeed = () => {
    const model = selectedImageModel?.getProviders().includes(GenerationProvider.WaveSpeed)
      ? selectedImageModel
      : textToImageModelList.find((item) => item.model?.getProviders().includes(GenerationProvider.WaveSpeed))?.model;
    if (!model) return;
    const store = useClassyModelSelectorStore.getState();
    store.setSelectedModel(PAGE_ID, model);
    store.setSelectedProvider(PAGE_ID, model.id, GenerationProvider.WaveSpeed);
  };

  const imageCredits = useCostBreakdownModalStore(
    (s) => s.estimatedCreditsByPage[PAGE_ID],
  );

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

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
  const feed = useDesktopGenerationFeed({ mediaType: "image" });
  // Images made without an account live on this computer: shown with the library's.
  const localImages = useLocalGenerations();
  const localItems = useMemo(() => localGenerationsToGalleryItems(localImages), [localImages]);
  const gallery = useGalleryData({
    username,
    filterMediaClasses: IMAGE_FILTER,
    excludeUploads: true,
    localItems,
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
      emptyStateTitle="Create Image"
      emptyStateSubtitle="Add a prompt, then generate"
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
          enableMakeVideo
          selectable
          selectionBarBottomOffset={promptHeight + 32}
        />
      }
      promptBox={
        <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-2 sm:px-4">
          <div ref={promptContentRef}>
            {!isSignedIn && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded border border-ui-panel-border bg-ui-panel p-3 text-sm text-base-fg/70">
                <span className="min-w-0">Generate images with your WaveSpeed API key. Images stay on this computer.</span>
                {selectedProvider !== GenerationProvider.WaveSpeed && (
                  <button type="button" onClick={useWaveSpeed} className="min-h-9 shrink-0 cursor-pointer rounded px-3 py-2 text-primary hover:bg-ui-controls focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    Use WaveSpeed
                  </button>
                )}
              </div>
            )}
            <PromptBoxImage
              useJobContext={() => {
                return jobContext;
              }}
              uploadImage={UploadImageMedia}
              selectedModel={selectedImageModel}
              selectedProvider={selectedProvider}
              canUseReferenceImages={isSignedIn}
              imageMediaId={imageMediaId}
              url={imageUrl ?? undefined}
              credits={imageCredits}
              modelSelector={
                <ClassyModelSelector
                  variant="embedded"
                  items={textToImageModelList}
                  page={PAGE_ID}
                />
              }
              onEnqueuePressed={async (prompt, count, subscriberId) => {
                const modelLabel = selectedImageModel?.fullName ?? "";
                startBatch(
                  prompt,
                  count,
                  modelLabel,
                  subscriberId,
                  selectedImageModel?.creator,
                );
                // Nudge the feed (and the TopBar task queue) to refetch so the
                // pending row appears immediately.
                window.dispatchEvent(new Event("task-queue-update"));
              }}
            />
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

export default TextToImage;
