import { useEffect, useMemo, useRef, useState } from "react";
import { JobContextType } from "@storyteller/common";
import { PromptBoxVideo } from "@storyteller/ui-promptbox";
import BackgroundGallery from "./BackgroundGallery";
import {
  ClassyModelSelector,
  IMAGE_TO_VIDEO_PAGE_MODEL_LIST,
  ModelPage,
  getSelectedVideoModel,
} from "@storyteller/ui-model-selector";
import { VideoModel } from "@storyteller/model-list";
import { animated, useSpring } from "@react-spring/web";
import { useImageToVideoStore } from "./ImageToVideoStore";
import {
  useImageToVideoGenerationCompleteEvent,
  ImageToVideoGenerationCompleteEvent,
} from "@storyteller/tauri-events";
// import { Badge } from "@storyteller/ui-badge";
import { twMerge } from "tailwind-merge";
import { uploadImage } from "../../components/reusable/UploadModalMedia/uploadImage";

const PAGE_ID: ModelPage = ModelPage.ImageToVideo;

interface ImageToVideoProps {
  imageMediaId?: string;
  imageUrl?: string;
}

const ImageToVideo = ({ imageMediaId, imageUrl }: ImageToVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const batches = useImageToVideoStore((s) => s.batches);
  const startBatch = useImageToVideoStore((s) => s.startBatch);
  const completeBatch = useImageToVideoStore((s) => s.completeBatch);
  // const resetBatches = useImageToVideoStore((s) => s.reset);
  const [imageRowVisible, setImageRowVisible] = useState(true);
  const promptContentRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState<number>(138);

  const selectedVideoModel: VideoModel | undefined =
    getSelectedVideoModel(PAGE_ID);

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  useImageToVideoGenerationCompleteEvent(
    async (event: ImageToVideoGenerationCompleteEvent) => {
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

  const hasAnyBatches = batches.length > 0;
  const showPromptAtBottom = useMemo(() => hasAnyBatches, [hasAnyBatches]);

  const [vh, setVh] = useState<number>(
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = promptContentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // TODO: Uncomment when backend supports history frontend id
  // const bottomMarginPx = 24;
  // const bottomOffsetPx = promptHeight + bottomMarginPx;
  const targetTop = showPromptAtBottom
    ? Math.floor(vh / 2) //change to Math.max(0, vh - bottomOffsetPx) when backend supports history frontend id
    : Math.floor(vh / 2);
  const promptAnim = useSpring({
    top: targetTop,
    config: { tension: 200, friction: 28, mass: 1.1 },
  });

  // const inverseBatch = batches.toReversed();

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full bg-ui-background"
    >
      <div className="relative h-full w-full p-16">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md pb-12">
          {/* TODO: Uncomment when backend supports history frontend id */}
          {/* {!showPromptAtBottom && ( */}
          <div
            className={twMerge(
              "relative z-20 mb-52 flex flex-col items-center justify-center text-center drop-shadow-xl",
              imageRowVisible && "mb-80",
            )}
          >
            <span className="text-base-fg text-7xl font-bold">
              Generate Video
            </span>
            <span className="text-base-fg pt-2 text-xl opacity-80">
              Choose an image, add a prompt, then generate
            </span>
          </div>
          {/* )} */}

          {/* TODO: Uncomment when backend supports history frontend id */}
          {/* {hasAnyBatches && (
            <div
              className="h-full w-full overflow-y-auto"
              style={{ paddingBottom: bottomOffsetPx + 24 }}
            >
              <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 pr-2">
                {inverseBatch.map((batch) => (
                  <div key={batch.id} className="flex items-start gap-4">
                    <div className="grid flex-1 grid-cols-1 gap-4">
                      {batch.status === "pending" && !batch.video ? (
                        <div className="aspect-video w-full animate-pulse rounded-lg bg-white/5" />
                      ) : batch.video ? (
                        <button
                          className="aspect-video w-full overflow-hidden rounded-lg"
                          onClick={() => {
                            // No-op for now (could open lightbox if desired)
                          }}
                        >
                          <video
                            className="h-full w-full object-cover"
                            src={batch.video.cdn_url}
                            controls
                          />
                        </button>
                      ) : null}
                    </div>
                    <div>
                      <div className="glass inline-block w-[320px] shrink-0 rounded-xl px-4 py-3 text-left text-sm text-white/90">
                        <div>{batch.prompt}</div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Badge
                          label={batch.modelLabel}
                          className="px-2 py-1 text-xs opacity-70"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}

          <animated.div
            className="fixed left-1/2 z-20 w-[730px] -translate-x-1/2"
            style={promptAnim}
          >
            {/* TODO: Uncomment when backend supports history frontend id */}
            {/* {showPromptAtBottom && batches.length > 0 && (
              <div
                className={`absolute ${imageRowVisible ? "-top-[108px]" : "-top-9"} flex w-full justify-end`}
              >
                <button
                  onClick={() => resetBatches()}
                  className="rounded-md bg-red/20 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-red/30"
                >
                  Clear session
                </button>
              </div>
            )} */}
            <div ref={promptContentRef}>
              <PromptBoxVideo
                useJobContext={() => jobContext}
                selectedModel={selectedVideoModel}
                imageMediaId={imageMediaId}
                url={imageUrl ?? undefined}
                onImageRowVisibilityChange={setImageRowVisible}
                uploadImage={uploadImage}
                onEnqueuePressed={async (prompt, subscriberId) => {
                  const modelLabel = selectedVideoModel?.fullName ?? "";
                  startBatch(prompt, modelLabel, subscriberId);
                }}
              />
            </div>
          </animated.div>

          {/* TODO: Uncomment when backend supports history frontend id */}
          {/* {!showPromptAtBottom && */}
          <BackgroundGallery />
          {/* } */}

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <ClassyModelSelector
              items={IMAGE_TO_VIDEO_PAGE_MODEL_LIST}
              page={PAGE_ID}
              panelTitle="Select Model"
              panelClassName="min-w-[280px]"
              buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
              showIconsInList
              triggerLabel="Model"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
