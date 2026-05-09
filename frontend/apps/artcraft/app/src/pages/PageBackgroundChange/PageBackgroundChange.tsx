import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { toast } from "@storyteller/ui-toaster";
import { UploadImageMedia, UploadVideoMedia } from "@storyteller/api";
import {
  PromptBoxVFX,
  SubTabStrip,
  TruchetPattern,
  VFXResultCard,
  VFXShowcaseView,
  newIdempotencyToken,
  submitVFXJob,
  useVFXStore,
  VFX_NOT_AVAILABLE_ERROR,
  VFX_SHOWCASE,
} from "@storyteller/ui-vfx";

export const PageBackgroundChange = () => {
  const subTab = useVFXStore((s) => s.subTab);
  const setSubTab = useVFXStore((s) => s.setSubTab);
  const history = useVFXStore((s) => s.history);
  const startResult = useVFXStore((s) => s.startResult);
  const failResult = useVFXStore((s) => s.failResult);
  const dismissResult = useVFXStore((s) => s.dismissResult);
  const loadFromShowcase = useVFXStore((s) => s.loadFromShowcase);
  const selectedShowcaseId = useVFXStore((s) => s.selectedShowcaseId);
  const source = useVFXStore((s) => s.source);
  const mask = useVFXStore((s) => s.mask);
  const reference = useVFXStore((s) => s.reference);
  const prompt = useVFXStore((s) => s.prompt);
  const resolution = useVFXStore((s) => s.resolution);

  const promptBoxRef = useRef<HTMLDivElement>(null);
  const [promptBoxHeight, setPromptBoxHeight] = useState(96);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const el = promptBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptBoxHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!source || !reference || isSubmitting) return;
    setIsSubmitting(true);
    const id = startResult();
    const trimmed = prompt.trim();
    const result = await submitVFXJob({
      source_video_media_token: source.mediaToken,
      reference_image_media_token: reference.mediaToken,
      prompt: trimmed.length > 0 ? trimmed : null,
      uuid_idempotency_token: newIdempotencyToken(),
    });
    setIsSubmitting(false);

    if (!result.success) {
      const isExpected = result.error_code_str === VFX_NOT_AVAILABLE_ERROR;
      const message = isExpected
        ? "Background change backend coming soon. Your inputs are saved."
        : result.error_message || "Failed to submit background change job.";
      failResult(id, message);
      if (isExpected) toast(message);
      else toast.error(message);
    }
  }, [source, reference, prompt, isSubmitting, startResult, failResult]);

  const handleTryShowcase = useCallback(() => {
    const entry = VFX_SHOWCASE.find((e) => e.id === selectedShowcaseId);
    if (!entry) return;
    loadFromShowcase({
      prompt: entry.prompt,
      resolution: entry.resolution,
      source: {
        id: entry.source.mediaToken,
        url: entry.source.url,
        mediaToken: entry.source.mediaToken,
      },
      mask: entry.mask
        ? {
            id: entry.mask.mediaToken,
            url: entry.mask.url,
            mediaToken: entry.mask.mediaToken,
          }
        : undefined,
      reference: entry.reference
        ? {
            id: entry.reference.mediaToken,
            url: entry.reference.url,
            mediaToken: entry.reference.mediaToken,
          }
        : undefined,
    });
    toast("Loaded showcase. Edit and Generate.");
  }, [selectedShowcaseId, loadFromShowcase]);

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col bg-ui-background">
      <SubTabStrip activeTab={subTab} onChange={setSubTab} />

      {subTab === "showcase" ? (
        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{ paddingBottom: Math.max(promptBoxHeight + 36, 240) }}
        >
          <VFXShowcaseView onTryThis={handleTryShowcase} />
        </div>
      ) : history.length === 0 ? (
        <div
          className="relative flex flex-1 items-center justify-center px-6"
          style={{ paddingBottom: Math.max(promptBoxHeight + 36, 240) }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 45%, black 30%, transparent 85%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 45%, black 30%, transparent 85%)",
            }}
          >
            <TruchetPattern
              intensity={0.8}
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="relative z-10">
            <EmptyState
              title="No background changes yet"
              subtitle="Upload a source video and a reference image, then optionally add a prompt."
            />
          </div>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: Math.max(promptBoxHeight + 36, 240) }}
        >
          <div className="flex flex-col gap-10 px-6 pt-6">
            {history.map((r) => (
              <VFXResultCard
                key={r.id}
                data={{
                  prompt: r.prompt,
                  resolution: r.resolution,
                  source: r.source,
                  mask: r.mask,
                  reference: r.reference,
                  outputUrl: r.outputUrl,
                  status: r.status,
                  failureReason: r.failureReason,
                }}
                onDismiss={() => dismissResult(r.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        aria-hidden
        className="via-ui-background/85 pointer-events-none fixed bottom-0 left-0 right-0 z-20 h-72 bg-gradient-to-t from-ui-background to-transparent"
      />

      <div
        ref={promptBoxRef}
        className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2"
      >
        <div className="pointer-events-auto">
          <PromptBoxVFX
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            uploadVideo={UploadVideoMedia}
            uploadImage={UploadImageMedia}
            onError={(msg) => toast.error(msg)}
          />
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

const EmptyState = ({ title, subtitle }: EmptyStateProps) => (
  <div className="flex max-w-md flex-col items-center gap-4 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-fg/5 ring-1 ring-base-fg/10">
      <FontAwesomeIcon icon={faSparkles} className="text-2xl" />
    </div>
    <h3 className="text-2xl font-bold text-base-fg">{title}</h3>
    <p className="max-w-xs text-sm text-base-fg/60">{subtitle}</p>
  </div>
);

export default PageBackgroundChange;
