import { mediaTime, mediaTimeFromSeconds, TICKS_PER_SECOND } from "../wasm";

// Default duration for a freshly-created timeline element (text, shape,
// sticker). Media-backed elements (video, image, audio) override this
// with the source's natural duration via toElementDurationTicks below.
export const DEFAULT_NEW_ELEMENT_DURATION = mediaTime({
  ticks: 5 * TICKS_PER_SECOND,
});

export function toElementDurationTicks({
  seconds,
}: {
  seconds: number | null | undefined;
}) {
  if (seconds == null) {
    return DEFAULT_NEW_ELEMENT_DURATION;
  }

  return mediaTimeFromSeconds({ seconds });
}
