import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

const FALLBACK_MESSAGE = "Failed to start image generation. Please try again.";

/** Keep failed canvas submissions visible and allow a subsequent retry. */
export function useGenerationSubmission() {
  const inFlight = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const runGeneration = useCallback(async (submit: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsGenerating(true);
    try {
      await submit();
    } catch (error) {
      console.error("Canvas generation failed", error);
      toast.error(generationErrorMessage(error));
    } finally {
      inFlight.current = false;
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, runGeneration };
}

function generationErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const details = error as { error_message?: unknown; message?: unknown };
    for (const message of [details.error_message, details.message]) {
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return FALLBACK_MESSAGE;
}
