/**
 * The duration capabilities shared by video-model listings and desktop models.
 *
 * A model may advertise either a continuous inclusive range or a set of
 * discrete values. A complete, valid range is authoritative when both forms
 * are present; otherwise the valid discrete values are used.
 */
export interface VideoDurationCapabilities {
  durationOptions?: readonly number[];
  minDuration?: number;
  maxDuration?: number;
  maxDurationWithImageReferences?: number;
  defaultDuration?: number;
}

/** Concrete media currently attached to a video request. */
export interface VideoDurationMediaInputs {
  /** Starting-frame and omni-reference images share this collection. */
  imageCount?: number;
  hasEndFrameImage?: boolean;
  /** These are accepted to make their non-effect on the image cap explicit. */
  videoCount?: number;
  audioCount?: number;
}

/**
 * Consumer state used to derive both the committed estimate duration and the
 * duration that an immediate Generate action must send.
 */
export interface VideoDurationProjectionInputs
  extends VideoDurationMediaInputs {
  storedDuration: number | null | undefined;
  /** A visible selection newer than the store value captured by this render. */
  pendingDuration?: number | null;
  /** True only when the request will use omni-reference request fields. */
  effectiveReferenceMode?: boolean;
}

export interface VideoDurationProjection {
  mediaInputs: VideoDurationMediaInputs;
  /** Duration derived from committed store state, used by cost estimation. */
  estimateDuration: number | null;
  /** Duration derived from the visible pending value, used by Generate. */
  requestDuration: number | null;
}

export type VideoDurationConstraint =
  | { kind: "range"; min: number; max: number }
  | { kind: "options"; options: readonly number[] };

export const isValidVideoDuration = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

/**
 * Return unique, ascending, supported duration options. Invalid API values do
 * not become selectable values in the desktop UI or generation requests.
 */
export const normalizeVideoDurationOptions = (
  options: readonly number[] | null | undefined,
): number[] | undefined => {
  const normalized = [
    ...new Set((options ?? []).filter(isValidVideoDuration)),
  ].sort((a, b) => a - b);
  return normalized.length > 0 ? normalized : undefined;
};

/** Whether a model advertises a duration contract that requests must honor. */
export const hasVideoDurationConfiguration = (
  capabilities: VideoDurationCapabilities,
): boolean =>
  normalizeVideoDurationOptions(capabilities.durationOptions) !== undefined ||
  isValidVideoDuration(capabilities.minDuration) ||
  isValidVideoDuration(capabilities.maxDuration) ||
  isValidVideoDuration(capabilities.maxDurationWithImageReferences) ||
  isValidVideoDuration(capabilities.defaultDuration);

const hasConcreteImageInput = (inputs: VideoDurationMediaInputs): boolean =>
  (Number.isSafeInteger(inputs.imageCount) && (inputs.imageCount ?? 0) > 0) ||
  inputs.hasEndFrameImage === true;

/**
 * Resolve the effective constraint for the attached media. The image-specific
 * maximum applies only when an image is actually attached—not merely because
 * a reference input mode is selected. Video and audio references never apply
 * that cap.
 */
export const getVideoDurationConstraint = (
  capabilities: VideoDurationCapabilities,
  inputs: VideoDurationMediaInputs = {},
): VideoDurationConstraint | null => {
  const validRange =
    isValidVideoDuration(capabilities.minDuration) &&
    isValidVideoDuration(capabilities.maxDuration) &&
    capabilities.minDuration <= capabilities.maxDuration;
  const imageMaximum =
    hasConcreteImageInput(inputs) &&
    isValidVideoDuration(capabilities.maxDurationWithImageReferences)
      ? capabilities.maxDurationWithImageReferences
      : undefined;

  if (validRange) {
    const max =
      imageMaximum === undefined
        ? capabilities.maxDuration!
        : Math.min(capabilities.maxDuration!, imageMaximum);

    // A contradictory listing must not make the client send a duration above
    // the image cap merely to satisfy the general minimum.
    return max >= capabilities.minDuration!
      ? { kind: "range", min: capabilities.minDuration!, max }
      : null;
  }

  const options = normalizeVideoDurationOptions(
    capabilities.durationOptions,
  )?.filter((option) => imageMaximum === undefined || option <= imageMaximum);

  return options?.length ? { kind: "options", options } : null;
};

const nearestOption = (options: readonly number[], requested: number): number =>
  options.reduce((best, option) => {
    const bestDistance = Math.abs(best - requested);
    const optionDistance = Math.abs(option - requested);
    return optionDistance < bestDistance ||
      (optionDistance === bestDistance && option > best)
      ? option
      : best;
  }, options[0]!);

/**
 * Return the duration that the control, request, and estimator must use.
 * Continuous values are clamped; discrete values snap to the nearest option,
 * with an exact tie resolved toward the longer duration.
 */
export const resolveVideoDuration = (
  capabilities: VideoDurationCapabilities,
  requested: number | null | undefined,
  inputs: VideoDurationMediaInputs = {},
): number | null => {
  const constraint = getVideoDurationConstraint(capabilities, inputs);
  if (!constraint) return null;

  const candidate = isValidVideoDuration(requested)
    ? requested
    : isValidVideoDuration(capabilities.defaultDuration)
      ? capabilities.defaultDuration
      : constraint.kind === "range"
        ? constraint.min
        : constraint.options[0]!;

  return constraint.kind === "range"
    ? Math.min(Math.max(candidate, constraint.min), constraint.max)
    : nearestOption(constraint.options, candidate);
};

/**
 * Project UI state onto the exact media shape and durations used by request
 * and estimate consumers. An end-frame image only exists in the request shape
 * outside effective reference mode; start/reference images share imageCount.
 */
export const projectVideoDuration = (
  capabilities: VideoDurationCapabilities,
  inputs: VideoDurationProjectionInputs,
): VideoDurationProjection => {
  const mediaInputs: VideoDurationMediaInputs = {
    imageCount: inputs.imageCount,
    hasEndFrameImage:
      inputs.effectiveReferenceMode === true ? false : inputs.hasEndFrameImage,
    videoCount: inputs.videoCount,
    audioCount: inputs.audioCount,
  };

  return {
    mediaInputs,
    estimateDuration: resolveVideoDuration(
      capabilities,
      inputs.storedDuration,
      mediaInputs,
    ),
    requestDuration: resolveVideoDuration(
      capabilities,
      inputs.pendingDuration ?? inputs.storedDuration,
      mediaInputs,
    ),
  };
};
