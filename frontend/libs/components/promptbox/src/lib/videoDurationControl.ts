import {
  projectVideoDuration,
  resolveVideoDuration,
  type VideoDurationCapabilities,
  type VideoDurationConstraint,
  type VideoDurationMediaInputs,
  type VideoDurationProjectionInputs,
} from "@storyteller/model-list";

/**
 * Convert the slider's coordinate into the duration value displayed, stored,
 * estimated, and eventually sent. Discrete controls use an option index so a
 * sparse list such as [5, 10] can never produce 6–9.
 */
export const resolveVideoDurationSliderSelection = (
  capabilities: VideoDurationCapabilities,
  constraint: VideoDurationConstraint,
  sliderValue: number,
  mediaInputs: VideoDurationMediaInputs,
): number | null => {
  const requestedDuration =
    constraint.kind === "range"
      ? sliderValue
      : constraint.options[Math.round(sliderValue)];

  return resolveVideoDuration(capabilities, requestedDuration, mediaInputs);
};

/**
 * Resolve the value visible at the instant Generate is pressed, persist that
 * exact value, and return it for request construction. Keeping this operation
 * at the consumer boundary prevents a render-lagged store value from being
 * sent when selection and Generate happen back-to-back.
 */
export const commitVideoDurationForRequest = (
  capabilities: VideoDurationCapabilities,
  inputs: VideoDurationProjectionInputs,
  commitDuration: (duration: number | null) => void,
): number | null => {
  const requestDuration = projectVideoDuration(
    capabilities,
    inputs,
  ).requestDuration;
  commitDuration(requestDuration);
  return requestDuration;
};
