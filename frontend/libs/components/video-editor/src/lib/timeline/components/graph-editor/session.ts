import {
  getCurveHandlesForNormalizedCubicBezier,
  getEditableScalarChannels,
  getNormalizedCubicBezierForScalarSegment,
  getScalarKeyframeContext,
  updateScalarKeyframeCurve,
} from "../../../animation";
import { getChannelsFromData } from "../../../animation/channel-data";
import { isScalarChannel } from "../../../animation/interpolation";
import type {
  AnimationPath,
  ElementAnimations,
  NormalizedCubicBezier,
  ScalarCurveKeyframePatch,
  ScalarGraphKeyframeContext,
  SelectedKeyframeRef,
} from "../../../animation/types";
import type { SceneTracks, TimelineElement } from "../../types";

const GRAPH_LINEAR_CURVE: NormalizedCubicBezier = [0, 0, 1, 1];
const FLAT_VALUE_EPSILON = 1e-6;
const LINEAR_CURVE_EPSILON = 1e-6;

export type GraphEditorUnavailableReason =
  | "no-keyframe-selected"
  | "multiple-keyframes-selected"
  | "selected-keyframes-span-multiple-elements"
  | "selected-keyframes-are-not-adjacent"
  | "selected-properties-have-no-shared-component"
  | "selected-element-missing"
  | "selected-element-has-no-animations"
  | "selected-keyframe-has-no-scalar-channel"
  | "selected-keyframe-missing-on-channel"
  | "selected-keyframe-has-no-next-segment"
  | "selected-segment-is-hold"
  | "selected-segment-is-flat";

export interface GraphEditorComponentOption {
  key: string;
  label: string;
}

interface GraphEditorPropertyOption {
  key: string;
  label: string;
  context: ScalarGraphKeyframeContext;
  allContexts: ScalarGraphKeyframeContext[];
}

export interface GraphEditorResolvedSegment {
  propertyPath: SelectedKeyframeRef["propertyPath"];
  keyframeId: string;
  context: ScalarGraphKeyframeContext;
  allContexts: ScalarGraphKeyframeContext[];
  cubicBezier: NormalizedCubicBezier;
  referenceSpanValue: number;
}

interface GraphEditorBaseSelectionState {
  componentOptions: GraphEditorComponentOption[];
  activeComponentKey: string | null;
  message: string;
}

export interface GraphEditorUnavailableState
  extends GraphEditorBaseSelectionState {
  status: "unavailable";
  reason: GraphEditorUnavailableReason;
}

export interface GraphEditorReadyState extends GraphEditorBaseSelectionState {
  status: "ready";
  trackId: string;
  elementId: string;
  element: TimelineElement;
  segments: GraphEditorResolvedSegment[];
  cubicBezier: NormalizedCubicBezier;
}

export type GraphEditorSelectionState =
  | GraphEditorUnavailableState
  | GraphEditorReadyState;

export interface GraphEditorCurvePatch {
  keyframeId: string;
  patch: ScalarCurveKeyframePatch;
}

function createUnavailableState({
  reason,
  message,
  componentOptions = [],
  activeComponentKey = null,
}: {
  reason: GraphEditorUnavailableReason;
  message: string;
  componentOptions?: GraphEditorComponentOption[];
  activeComponentKey?: string | null;
}): GraphEditorUnavailableState {
  return {
    status: "unavailable",
    reason,
    message,
    componentOptions,
    activeComponentKey,
  };
}

function findElementByKeyframe({
  tracks,
  keyframe,
}: {
  tracks: SceneTracks;
  keyframe: SelectedKeyframeRef;
}): { element: TimelineElement; trackId: string; elementId: string } | null {
  for (const track of [...tracks.overlay, tracks.main, ...tracks.audio]) {
    if (track.id !== keyframe.trackId) {
      continue;
    }

    const element = track.elements.find(
      (trackElement) => trackElement.id === keyframe.elementId,
    );
    if (!element) {
      return null;
    }

    return {
      element,
      trackId: track.id,
      elementId: element.id,
    };
  }

  return null;
}

function findKeyframeTime({
  animations,
  propertyPath,
  keyframeId,
}: {
  animations: ElementAnimations;
  propertyPath: AnimationPath;
  keyframeId: string;
}): number | null {
  const data = animations[propertyPath];
  for (const channel of getChannelsFromData({ data })) {
    if (!channel || !isScalarChannel(channel)) continue;
    const key = channel.keys.find((k) => k.id === keyframeId);
    if (key !== undefined) return key.time;
  }

  return null;
}

function groupSelectedKeyframesByProperty({
  selectedKeyframes,
}: {
  selectedKeyframes: SelectedKeyframeRef[];
}) {
  const groups = new Map<
    string,
    {
      trackId: string;
      elementId: string;
      propertyPath: SelectedKeyframeRef["propertyPath"];
      keyframes: SelectedKeyframeRef[];
    }
  >();

  for (const keyframe of selectedKeyframes) {
    const groupKey = `${keyframe.trackId}:${keyframe.elementId}:${keyframe.propertyPath}`;
    const existingGroup = groups.get(groupKey);
    if (existingGroup) {
      existingGroup.keyframes.push(keyframe);
      continue;
    }

    groups.set(groupKey, {
      trackId: keyframe.trackId,
      elementId: keyframe.elementId,
      propertyPath: keyframe.propertyPath,
      keyframes: [keyframe],
    });
  }

  return [...groups.values()];
}

function getComponentLabel({ componentKey }: { componentKey: string }): string {
  switch (componentKey) {
    case "value":
      return "Value";
    default:
      return componentKey.toUpperCase();
  }
}

/**
 * Returns the absolute value span of the nearest non-flat adjacent segment,
 * used as the Y-axis scale when editing a flat segment in the graph editor.
 * Falls back to 1.0 if all surrounding segments are also flat.
 */
function getReferenceSpanValue({
  context,
}: {
  context: ScalarGraphKeyframeContext;
}): number {
  const sorted = [...context.channel.keys].sort((a, b) => a.time - b.time);
  const leftIndex = sorted.findIndex((k) => k.id === context.keyframe.id);
  const rightIndex = context.nextKey
    ? sorted.findIndex((k) => k.id === context.nextKey?.id)
    : -1;

  for (let i = leftIndex - 1; i >= 0; i--) {
    const span = Math.abs(sorted[i + 1].value - sorted[i].value);
    if (span > FLAT_VALUE_EPSILON) return span;
  }

  if (rightIndex !== -1) {
    for (let i = rightIndex; i < sorted.length - 1; i++) {
      const span = Math.abs(sorted[i + 1].value - sorted[i].value);
      if (span > FLAT_VALUE_EPSILON) return span;
    }
  }

  return 1.0;
}

interface GraphEditorPropertySelection {
  propertyPath: SelectedKeyframeRef["propertyPath"];
  keyframeId: string;
  secondaryKeyframeId: string | null;
  options: GraphEditorPropertyOption[];
}

function resolvePropertySelection({
  element,
  propertyKeyframes,
}: {
  element: TimelineElement;
  propertyKeyframes: ReturnType<
    typeof groupSelectedKeyframesByProperty
  >[number];
}):
  | GraphEditorPropertySelection
  | {
      reason: GraphEditorUnavailableReason;
      message: string;
    } {
  if (propertyKeyframes.keyframes.length > 2) {
    return {
      reason: "multiple-keyframes-selected",
      message: "Select at most two adjacent keyframes per property.",
    };
  }

  if (!element.animations) {
    return {
      reason: "selected-element-has-no-animations",
      message: "The selected keyframe has no editable graph.",
    };
  }

  const scalarResult = getEditableScalarChannels({
    animations: element.animations,
    propertyPath: propertyKeyframes.propertyPath,
  });
  if (!scalarResult || scalarResult.channels.length === 0) {
    return {
      reason: "selected-keyframe-has-no-scalar-channel",
      message: "The selected keyframe has no editable graph channel.",
    };
  }

  const primaryKeyframe = propertyKeyframes.keyframes[0];
  let resolvedKeyframeId = primaryKeyframe.keyframeId;
  let secondaryKeyframeId =
    propertyKeyframes.keyframes.length === 2
      ? propertyKeyframes.keyframes[1].keyframeId
      : null;

  if (secondaryKeyframeId !== null) {
    const time1 = findKeyframeTime({
      animations: element.animations,
      propertyPath: propertyKeyframes.propertyPath,
      keyframeId: primaryKeyframe.keyframeId,
    });
    const time2 = findKeyframeTime({
      animations: element.animations,
      propertyPath: propertyKeyframes.propertyPath,
      keyframeId: secondaryKeyframeId,
    });
    if (time2 !== null && (time1 === null || time2 < time1)) {
      resolvedKeyframeId = secondaryKeyframeId;
      secondaryKeyframeId = primaryKeyframe.keyframeId;
    }
  }

  const { easingMode, channels: scalarChannels } = scalarResult;
  const contexts = scalarChannels.flatMap((channel) => {
    const context = getScalarKeyframeContext({
      animations: element.animations,
      propertyPath: propertyKeyframes.propertyPath,
      componentKey: channel.componentKey,
      keyframeId: resolvedKeyframeId,
    });
    if (!context) {
      return [];
    }

    return [
      {
        context,
        option: {
          key: channel.componentKey,
          label: getComponentLabel({ componentKey: channel.componentKey }),
        },
      },
    ];
  });

  if (contexts.length === 0) {
    return {
      reason: "selected-keyframe-missing-on-channel",
      message: "The selected keyframe is not editable as a graph segment.",
    };
  }

  // For shared-easing bindings (e.g. color), all components always use the same
  // curve. Collapse them to a single "value" option so the key is compatible with
  // single-component scalar bindings (e.g. opacity), enabling mixed selections.
  const options =
    easingMode === "shared"
      ? [
          {
            key: "value",
            label: "Curve",
            context: contexts[0].context,
            allContexts: contexts.map(({ context }) => context),
          },
        ]
      : contexts.map(({ context, option }) => ({
          key: option.key,
          label: option.label,
          context,
          allContexts: [context],
        }));

  return {
    propertyPath: propertyKeyframes.propertyPath,
    keyframeId: resolvedKeyframeId,
    secondaryKeyframeId,
    options,
  };
}

function isLinearCurve({
  cubicBezier,
}: {
  cubicBezier: NormalizedCubicBezier;
}): boolean {
  return (
    Math.abs(cubicBezier[0]) <= LINEAR_CURVE_EPSILON &&
    Math.abs(cubicBezier[1]) <= LINEAR_CURVE_EPSILON &&
    Math.abs(cubicBezier[2] - 1) <= LINEAR_CURVE_EPSILON &&
    Math.abs(cubicBezier[3] - 1) <= LINEAR_CURVE_EPSILON
  );
}

function resolveSegmentForOption({
  propertySelection,
  componentKey,
}: {
  propertySelection: GraphEditorPropertySelection;
  componentKey: string;
}):
  | {
      segment: GraphEditorResolvedSegment;
    }
  | {
      reason: GraphEditorUnavailableReason;
      message: string;
    } {
  const option = propertySelection.options.find(
    (propertyOption) => propertyOption.key === componentKey,
  );
  if (!option) {
    return {
      reason: "selected-properties-have-no-shared-component",
      message: "Selected properties do not share a graph-editable channel.",
    };
  }

  if (!option.context.nextKey) {
    return {
      reason: "selected-keyframe-has-no-next-segment",
      message: "Select a keyframe that has an outgoing segment.",
    };
  }

  if (
    propertySelection.secondaryKeyframeId !== null &&
    option.context.nextKey.id !== propertySelection.secondaryKeyframeId
  ) {
    return {
      reason: "selected-keyframes-are-not-adjacent",
      message: "Selected keyframes must be adjacent on each property.",
    };
  }

  if (option.context.keyframe.segmentToNext === "step") {
    return {
      reason: "selected-segment-is-hold",
      message: "Hold segments have a fixed value - easing has no effect here.",
    };
  }

  const referenceSpanValue = getReferenceSpanValue({ context: option.context });
  const cubicBezier =
    option.context.keyframe.segmentToNext === "linear"
      ? GRAPH_LINEAR_CURVE
      : getNormalizedCubicBezierForScalarSegment({
          leftKey: option.context.keyframe,
          rightKey: option.context.nextKey,
          referenceSpanValue,
        });
  if (!cubicBezier) {
    return {
      reason: "selected-segment-is-flat",
      message:
        "Cannot edit a segment where both keyframes are at the same time.",
    };
  }

  return {
    segment: {
      propertyPath: propertySelection.propertyPath,
      keyframeId: propertySelection.keyframeId,
      context: option.context,
      allContexts: option.allContexts,
      cubicBezier,
      referenceSpanValue,
    },
  };
}

export function resolveGraphEditorSelectionState({
  tracks,
  selectedKeyframes,
  preferredComponentKey,
}: {
  tracks: SceneTracks;
  selectedKeyframes: SelectedKeyframeRef[];
  preferredComponentKey?: string | null;
}): GraphEditorSelectionState {
  if (selectedKeyframes.length === 0) {
    return createUnavailableState({
      reason: "no-keyframe-selected",
      message: "Select a keyframe to edit its curve.",
    });
  }

  const propertyKeyframes = groupSelectedKeyframesByProperty({
    selectedKeyframes,
  });
  const primaryKeyframe = propertyKeyframes[0]?.keyframes[0];
  if (!primaryKeyframe) {
    return createUnavailableState({
      reason: "no-keyframe-selected",
      message: "Select a keyframe to edit its curve.",
    });
  }

  const selectedElement = findElementByKeyframe({
    tracks,
    keyframe: primaryKeyframe,
  });
  if (!selectedElement) {
    return createUnavailableState({
      reason: "selected-element-missing",
      message: "The selected keyframe could not be resolved.",
    });
  }

  const spansMultipleElements = propertyKeyframes.some(
    (propertySelection) =>
      propertySelection.trackId !== selectedElement.trackId ||
      propertySelection.elementId !== selectedElement.elementId,
  );
  if (spansMultipleElements) {
    return createUnavailableState({
      reason: "selected-keyframes-span-multiple-elements",
      message: "Selected keyframes must be on the same element.",
    });
  }

  const propertySelections = propertyKeyframes.map((propertySelection) =>
    resolvePropertySelection({
      element: selectedElement.element,
      propertyKeyframes: propertySelection,
    }),
  );
  const unavailablePropertySelection = propertySelections.find(
    (propertySelection) => "reason" in propertySelection,
  );
  if (
    unavailablePropertySelection &&
    "reason" in unavailablePropertySelection
  ) {
    return createUnavailableState({
      reason: unavailablePropertySelection.reason,
      message: unavailablePropertySelection.message,
    });
  }

  const resolvedPropertySelections = propertySelections.filter(
    (propertySelection): propertySelection is GraphEditorPropertySelection =>
      !("reason" in propertySelection),
  );
  const sharedComponentOptions =
    resolvedPropertySelections[0]?.options.filter((componentOption) =>
      resolvedPropertySelections.every((propertySelection) =>
        propertySelection.options.some(
          (option) => option.key === componentOption.key,
        ),
      ),
    ) ?? [];
  const componentOptions = sharedComponentOptions.map(({ key, label }) => ({
    key,
    label,
  }));
  if (componentOptions.length === 0) {
    return createUnavailableState({
      reason: "selected-properties-have-no-shared-component",
      message: "Selected properties do not share a graph-editable channel.",
    });
  }

  // Try each component option in preference order (preferred first, then the rest)
  // and stop at the first key where every property resolves to a valid segment.
  // This single pass both selects the active key and produces the segment list.
  const candidateKeys = [
    ...(preferredComponentKey &&
    componentOptions.some((option) => option.key === preferredComponentKey)
      ? [preferredComponentKey]
      : []),
    ...componentOptions
      .filter((option) => option.key !== preferredComponentKey)
      .map((option) => option.key),
  ];

  let activeComponentKey = componentOptions[0].key;
  let segmentResults: ReturnType<typeof resolveSegmentForOption>[] = [];

  for (const candidateKey of candidateKeys) {
    const results = resolvedPropertySelections.map((propertySelection) =>
      resolveSegmentForOption({
        propertySelection,
        componentKey: candidateKey,
      }),
    );
    activeComponentKey = candidateKey;
    segmentResults = results;
    if (results.every((result) => "segment" in result)) {
      break;
    }
  }

  const unavailableSegment = segmentResults.find(
    (result) => !("segment" in result),
  );
  if (unavailableSegment && !("segment" in unavailableSegment)) {
    return createUnavailableState({
      reason: unavailableSegment.reason,
      message: unavailableSegment.message,
      componentOptions,
      activeComponentKey,
    });
  }

  const segments = segmentResults.flatMap((result) =>
    "segment" in result ? [result.segment] : [],
  );
  const primarySegment = segments[0];
  if (!primarySegment) {
    return createUnavailableState({
      reason: "selected-keyframe-missing-on-channel",
      message: "The selected keyframe is not editable as a graph segment.",
      componentOptions,
      activeComponentKey,
    });
  }

  return {
    status: "ready",
    message:
      segments.length === 1
        ? "Edit graph"
        : `Edit graph for ${segments.length} properties`,
    componentOptions,
    activeComponentKey,
    trackId: selectedElement.trackId,
    elementId: selectedElement.elementId,
    element: selectedElement.element,
    segments,
    cubicBezier: primarySegment.cubicBezier,
  };
}

export function buildGraphEditorCurvePatches({
  context,
  cubicBezier,
  referenceSpanValue,
}: {
  context: ScalarGraphKeyframeContext;
  cubicBezier: NormalizedCubicBezier;
  referenceSpanValue: number;
}): GraphEditorCurvePatch[] | null {
  if (!context.nextKey) {
    return null;
  }

  if (isLinearCurve({ cubicBezier })) {
    return [
      {
        keyframeId: context.keyframe.id,
        patch: {
          segmentToNext: "linear",
          rightHandle: null,
        },
      },
      {
        keyframeId: context.nextKey.id,
        patch: {
          leftHandle: null,
        },
      },
    ];
  }

  const handles = getCurveHandlesForNormalizedCubicBezier({
    leftKey: context.keyframe,
    rightKey: context.nextKey,
    cubicBezier,
    referenceSpanValue,
  });
  if (!handles) {
    return null;
  }

  return [
    {
      keyframeId: context.keyframe.id,
      patch: {
        segmentToNext: "bezier",
        rightHandle: handles.rightHandle,
      },
    },
    {
      keyframeId: context.nextKey.id,
      patch: {
        leftHandle: handles.leftHandle,
      },
    },
  ];
}

export function applyGraphEditorCurvePreview({
  animations,
  context,
  cubicBezier,
  referenceSpanValue,
}: {
  animations: ElementAnimations | undefined;
  context: ScalarGraphKeyframeContext;
  cubicBezier: NormalizedCubicBezier;
  referenceSpanValue: number;
}): ElementAnimations | undefined {
  const patches = buildGraphEditorCurvePatches({
    context,
    cubicBezier,
    referenceSpanValue,
  });
  if (!patches) {
    return animations;
  }

  return patches.reduce<ElementAnimations | undefined>(
    (nextAnimations, { keyframeId, patch }) =>
      updateScalarKeyframeCurve({
        animations: nextAnimations,
        propertyPath: context.propertyPath,
        componentKey: context.componentKey,
        keyframeId,
        patch,
      }),
    animations,
  );
}
