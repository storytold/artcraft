import type { NavigateFunction } from "react-router-dom";
import { MediaUploadApi, EIntermediateFile } from "@storyteller/api";
import type { RefImage } from "../../../components/prompt-box/types";
import { useCreateImageStore } from "../../create-image/create-image-store";
import { useCreateVideoStore } from "../../create-video/create-video-store";
import type { ExtractedFrame } from "./extract-frames";

export type UploadFrameResult =
  | { success: true; mediaToken: string }
  | { success: false; error: string };

// Upload a captured frame as a PNG. `intermediate: false` = a visible library
// save; `intermediate: true` = a hidden helper file backing a prompt reference.
export async function uploadFrame(
  frame: ExtractedFrame,
  { intermediate }: { intermediate: boolean },
): Promise<UploadFrameResult> {
  try {
    const response = await new MediaUploadApi().UploadImage({
      uuid: crypto.randomUUID(),
      blob: frame.blob,
      fileName: frameFileName(frame),
      maybe_title: `video-frame-${frame.timestamp}`,
      is_intermediate_system_file: intermediate
        ? EIntermediateFile.true
        : EIntermediateFile.false,
    });

    if (response.success && response.data) {
      return { success: true, mediaToken: response.data };
    }
    return {
      success: false,
      error: response.errorMessage || "Failed to upload frame",
    };
  } catch {
    return { success: false, error: "Failed to upload frame" };
  }
}

// Park the frame as a pending prompt reference and navigate to the create
// page, which merges it under the selected model's reference cap (same
// channel as the library's "Send to prompt").
export function sendFrameToCreate(
  frame: ExtractedFrame,
  mediaToken: string,
  destination: "image" | "video",
  navigate: NavigateFunction,
): void {
  const ref: RefImage = {
    id: crypto.randomUUID(),
    url: frame.objectUrl,
    file: new File([frame.blob], frameFileName(frame), { type: "image/png" }),
    mediaToken,
  };

  if (destination === "image") {
    useCreateImageStore.getState().setPendingRefImages([ref]);
    navigate("/create-image");
  } else {
    useCreateVideoStore.getState().setPendingRefImages([ref]);
    navigate("/create-video");
  }
}

export function downloadFrame(frame: ExtractedFrame): void {
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = frame.objectUrl;
  anchor.download = frameFileName(frame);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? seconds : 0;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimePrecise(seconds: number): string {
  const safe = Number.isFinite(seconds) ? seconds : 0;
  const millis = Math.floor((safe % 1) * 1000);
  return `${formatTime(safe)}.${millis.toString().padStart(3, "0")}`;
}

function frameFileName(frame: ExtractedFrame): string {
  // Colons aren't filename-safe; mm-ss.mmm keeps the timestamp readable.
  return `frame-${formatTimePrecise(frame.timestamp).replace(":", "-")}.png`;
}
