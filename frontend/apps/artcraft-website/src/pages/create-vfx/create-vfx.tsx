import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird, faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import {
  PromptBoxVFX,
  SubTabStrip,
  VFXResultCard,
  VFXShowcaseView,
  newIdempotencyToken,
  submitVFXJob,
  useVFXStore,
  VFX_NOT_AVAILABLE_ERROR,
  VFX_SHOWCASE,
} from "@storyteller/ui-vfx";
import Seo from "../../components/seo";
import { useAuthCheck } from "../../components/generation-gallery";
import { toast } from "../../components/toast/toast";
import { uploadImage } from "../../components/prompt-box/upload-image";
import { uploadVideo } from "../../components/prompt-box/upload-media";

export default function CreateVFX() {
  const { user, authChecked } = useAuthCheck();

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
    if (!source || !reference || !prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const id = startResult();
    const result = await submitVFXJob({
      source_video_media_token: source.mediaToken,
      mask_media_token: mask?.mediaToken ?? null,
      reference_image_media_token: reference.mediaToken,
      prompt: prompt.trim(),
      resolution,
      uuid_idempotency_token: newIdempotencyToken(),
    });
    setIsSubmitting(false);

    if (!result.success) {
      const isExpected = result.error_code_str === VFX_NOT_AVAILABLE_ERROR;
      const message = isExpected
        ? "VFX backend coming soon. Your inputs are saved."
        : result.error_message || "Failed to submit VFX job.";
      failResult(id, message);
      if (isExpected) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    }
  }, [
    source,
    reference,
    mask,
    prompt,
    resolution,
    isSubmitting,
    startResult,
    failResult,
  ]);

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
    toast.success("Loaded showcase. Edit and Generate.");
  }, [selectedShowcaseId, loadFromShowcase]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101014]">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-4xl text-primary/80"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#101014] text-white">
        <Seo
          title="VFX - ArtCraft"
          description="Relight, change location, and swap objects in green-screen video."
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-teal-400/10 opacity-40 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <FontAwesomeIcon
            icon={faSparkles}
            className="mb-6 text-5xl text-white/20"
          />
          <h1 className="mb-3 text-4xl font-bold">VFX</h1>
          <p className="mb-8 max-w-md text-center text-lg text-white/60">
            Sign in to relight, change location, and swap objects in green-screen video.
          </p>
          <div className="flex gap-3">
            <Link to="/login">
              <Button
                variant="primary"
                className="bg-white px-6 py-2.5 font-semibold text-black shadow-md hover:bg-white/90"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="primary"
                className="px-6 py-2.5 font-semibold shadow-md"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#101014] text-white">
      <Seo
        title="VFX - ArtCraft"
        description="Relight, change location, and swap objects in green-screen video."
      />

      <div className="pt-[60px] sm:pt-[78px]">
        <SubTabStrip activeTab={subTab} onChange={setSubTab} />
      </div>

      {subTab === "showcase" ? (
        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{ paddingBottom: promptBoxHeight + 32 }}
        >
          <VFXShowcaseView onTryThis={handleTryShowcase} />
        </div>
      ) : history.length === 0 ? (
        <div
          className="flex flex-1 items-center justify-center px-3 sm:px-6"
          style={{ paddingBottom: promptBoxHeight + 32 }}
        >
          <EmptyState
            title="No VFX generations yet"
            subtitle="Upload a green-screen source and a reference image, then describe your scene."
          />
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: promptBoxHeight + 32 }}
        >
          <div className="flex flex-col gap-10 px-3 pt-6 sm:px-6">
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
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 h-72 bg-gradient-to-t from-[#101014] via-[#101014]/85 to-transparent"
      />

      <div
        ref={promptBoxRef}
        className="animate-fade-in-up pointer-events-none fixed bottom-2 left-1/2 z-30 -translate-x-1/2 sm:bottom-3"
        style={{ animationDelay: "150ms" }}
      >
        <div className="pointer-events-auto w-[min(1232px,calc(100vw-48px))]">
          <PromptBoxVFX
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            uploadVideo={uploadVideo}
            uploadImage={uploadImage}
            onError={(msg) => toast.error(msg)}
          />
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

const EmptyState = ({ title, subtitle }: EmptyStateProps) => (
  <div className="flex max-w-md flex-col items-center gap-4 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
      <FontAwesomeIcon icon={faSparkles} className="h-9 w-9 text-white/40" />
    </div>
    <h3 className="text-2xl font-bold text-white">{title}</h3>
    <p className="text-sm text-white/60">{subtitle}</p>
  </div>
);
