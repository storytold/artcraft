import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird, faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import {
  PromptBoxVFX,
  TruchetPattern,
  VFXResultCard,
  useVFXStore,
} from "@storyteller/ui-vfx";
import Seo from "../../components/seo";
import { useAuthCheck } from "../../components/generation-gallery";
import { toast } from "../../components/toast/toast";
import { uploadImage } from "../../components/prompt-box/upload-image";
import { uploadVideo } from "../../components/prompt-box/upload-media";
import {
  enqueueBackgroundChangeGeneration,
  startBackgroundChangePolling,
} from "./generate-background-change-api";

export default function CreateVFX() {
  const { user, authChecked } = useAuthCheck();

  const history = useVFXStore((s) => s.history);
  const startResult = useVFXStore((s) => s.startResult);
  const attachJobToken = useVFXStore((s) => s.attachJobToken);
  const completeResult = useVFXStore((s) => s.completeResult);
  const failResult = useVFXStore((s) => s.failResult);
  const dismissResult = useVFXStore((s) => s.dismissResult);
  const source = useVFXStore((s) => s.source);
  const reference = useVFXStore((s) => s.reference);
  const prompt = useVFXStore((s) => s.prompt);

  const promptBoxRef = useRef<HTMLDivElement>(null);
  const [promptBoxHeight, setPromptBoxHeight] = useState(96);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollersRef = useRef(new Map<string, () => void>());

  useEffect(() => {
    const el = promptBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptBoxHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const pollers = pollersRef.current;
    return () => {
      pollers.forEach((cancel) => cancel());
      pollers.clear();
    };
  }, []);


  const handleSubmit = useCallback(async () => {
    if (!source || !reference || isSubmitting) return;
    setIsSubmitting(true);
    const id = startResult();
    const enqueueResult = await enqueueBackgroundChangeGeneration({
      sourceVideoMediaToken: source.mediaToken,
      referenceImageMediaToken: reference.mediaToken,
      prompt: prompt.trim() || null,
    });
    setIsSubmitting(false);

    if (!enqueueResult.success) {
      const message = enqueueResult.backendUnavailable
        ? "Background change backend coming soon. Your inputs are saved."
        : enqueueResult.error;
      failResult(id, message);
      if (enqueueResult.backendUnavailable) {
        toast.success(message);
      } else {
        toast.error(message);
      }
      return;
    }

    attachJobToken(id, enqueueResult.jobToken);
    const cancel = startBackgroundChangePolling(
      enqueueResult.jobToken,
      (output) => {
        completeResult(id, output.cdn_url);
        pollersRef.current.delete(id);
      },
      (reason) => {
        failResult(id, reason);
        pollersRef.current.delete(id);
      },
    );
    pollersRef.current.set(id, cancel);
  }, [
    source,
    reference,
    prompt,
    isSubmitting,
    startResult,
    attachJobToken,
    completeResult,
    failResult,
  ]);

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
          title="Background Change - ArtCraft"
          description="Swap the backdrop of a video using a reference image."
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-teal-400/10 opacity-40 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <FontAwesomeIcon
            icon={faSparkles}
            className="mb-6 text-5xl text-white/20"
          />
          <h1 className="mb-3 text-4xl font-bold">Background Change</h1>
          <p className="mb-8 max-w-md text-center text-lg text-white/60">
            Sign in to swap the backdrop of a video using a reference image.
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
    <div className="relative flex h-screen w-full flex-col bg-[#101014] text-white">
      <Seo
        title="Background Change - ArtCraft"
        description="Swap the backdrop of a video using a reference image."
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 25%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 25%, transparent 85%)",
        }}
      >
        <TruchetPattern
          intensity={0.7}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="pt-[60px] sm:pt-[78px]" />

      {history.length === 0 ? (
        <div
          className="relative z-10 flex flex-1 items-center justify-center px-3 sm:px-6"
          style={{ paddingBottom: Math.max(promptBoxHeight + 32, 240) }}
        >
          <EmptyState
            title="No background changes yet"
            subtitle="Upload a source video and a reference image, then optionally add a prompt."
          />
        </div>
      ) : (
        <div
          className="relative z-10 flex-1 overflow-y-auto"
          style={{ paddingBottom: Math.max(promptBoxHeight + 32, 240) }}
        >
          <div className="flex flex-col items-center gap-10 px-3 pt-6 sm:px-6">
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
                className="w-[min(960px,calc(100vw-32px))]"
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
        <div className="pointer-events-auto w-[min(620px,calc(100vw-32px))]">
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
