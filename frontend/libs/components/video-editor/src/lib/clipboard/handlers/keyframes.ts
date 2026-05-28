import { getKeyframeById } from "../../animation";
import { getChannelEntriesFromData } from "../../animation/channel-data";
import { isScalarChannel } from "../../animation/interpolation";
import type { SelectedKeyframeRef } from "../../animation/types";
import type { TimelineElement } from "../../timeline/types";
import { PasteKeyframesCommand } from "../../commands/timeline";
import type {
  ClipboardHandler,
  KeyframeClipboardCurvePatch,
  KeyframeClipboardItem,
} from "../types";
import { roundMediaTime, subMediaTime, type MediaTime } from "../../wasm";

function resolveSingleSourceElement({
  selectedKeyframes,
}: {
  selectedKeyframes: SelectedKeyframeRef[];
}) {
  const firstKeyframe = selectedKeyframes[0];
  if (!firstKeyframe) {
    return null;
  }

  const sourceElement = {
    trackId: firstKeyframe.trackId,
    elementId: firstKeyframe.elementId,
  };
  const isSingleSource = selectedKeyframes.every(
    (keyframe) =>
      keyframe.trackId === sourceElement.trackId &&
      keyframe.elementId === sourceElement.elementId,
  );

  return isSingleSource ? sourceElement : null;
}

function getCurvePatches({
  element,
  propertyPath,
  keyframeId,
}: {
  element: TimelineElement;
  propertyPath: KeyframeClipboardItem["propertyPath"];
  keyframeId: string;
}): KeyframeClipboardCurvePatch[] {
  const data = element.animations?.[propertyPath];
  if (!data) {
    return [];
  }

  return getChannelEntriesFromData({ data }).flatMap(([componentKey, channel]) => {
    if (!channel || !isScalarChannel(channel)) {
      return [];
    }

    const keyframe = channel.keys.find(
      (candidate) => candidate.id === keyframeId,
    );
    if (!keyframe) {
      return [];
    }

    return [
      {
        componentKey,
        patch: {
          leftHandle: keyframe.leftHandle ?? null,
          rightHandle: keyframe.rightHandle ?? null,
          segmentToNext: keyframe.segmentToNext,
          tangentMode: keyframe.tangentMode,
        },
      },
    ];
  });
}

function buildClipboardItem({
  element,
  propertyPath,
  keyframeId,
}: {
  element: TimelineElement;
  propertyPath: KeyframeClipboardItem["propertyPath"];
  keyframeId: string;
}): (Omit<KeyframeClipboardItem, "timeOffset"> & { time: MediaTime }) | null {
  const keyframe = getKeyframeById({
    animations: element.animations,
    propertyPath,
    keyframeId,
  });
  if (!keyframe) {
    return null;
  }

  return {
    propertyPath,
    time: keyframe.time,
    value: keyframe.value,
    interpolation: keyframe.interpolation,
    curvePatches: getCurvePatches({
      element,
      propertyPath,
      keyframeId,
    }),
  };
}

export const KeyframesClipboardHandler = {
  type: "keyframes",

  canCopy({ selectedKeyframes }) {
    return selectedKeyframes.length > 0;
  },

  copy({ editor, selectedKeyframes }) {
    const sourceElement = resolveSingleSourceElement({ selectedKeyframes });
    if (!sourceElement) {
      return null;
    }

    const [result] = editor.timeline.getElementsWithTracks({
      elements: [sourceElement],
    });
    if (!result) {
      return null;
    }

    const rawItems = selectedKeyframes.flatMap((keyframeRef) => {
      const item = buildClipboardItem({
        element: result.element,
        propertyPath: keyframeRef.propertyPath,
        keyframeId: keyframeRef.keyframeId,
      });
      return item ? [item] : [];
    });
    if (rawItems.length === 0) {
      return null;
    }

    const minTime = Math.min(...rawItems.map((item) => item.time));
    const minTimeMedia = roundMediaTime({ time: minTime });
    const items = rawItems
      .map(({ time, ...item }) => ({
        ...item,
        timeOffset: subMediaTime({ a: time, b: minTimeMedia }),
      }))
      .sort(
        (left, right) =>
          left.timeOffset - right.timeOffset ||
          left.propertyPath.localeCompare(right.propertyPath),
      );

    return {
      type: "keyframes",
      sourceElement,
      items,
    };
  },

  paste({
    entry,
    context: { selectedElements, time },
  }) {
    const targetElement = selectedElements[0];
    if (!targetElement || entry.items.length === 0) {
      return null;
    }

    return new PasteKeyframesCommand({
      trackId: targetElement.trackId,
      elementId: targetElement.elementId,
      time,
      clipboardItems: entry.items,
    });
  },
} satisfies ClipboardHandler<"keyframes">;
