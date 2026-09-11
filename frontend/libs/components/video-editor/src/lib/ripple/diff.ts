import type { SceneTracks, TimelineElement, TimelineTrack } from "../timeline/types";
import type { RippleAdjustment } from "./apply";

// Diffs two SceneTracks snapshots and emits RippleAdjustments for the
// "vacated" intervals — the gaps that need to close. An element that
// shrank, was deleted, or moved to a different track leaves a vacated
// interval; an element that was extended, added, or moved INTO this
// track produces a "joined" interval that cancels out any overlapping
// vacated interval.
//
// Operates on intervals (not elements) so partial trims compose cleanly:
// trimming an element's right edge by 1s produces a 1s vacated interval
// that ripples without affecting the unchanged left portion.

interface Interval {
  startTime: number;
  endTime: number;
}

interface ElementSpan extends Interval {
  id: string;
}

export function computeRippleAdjustments({
  beforeTracks,
  afterTracks,
}: {
  beforeTracks: SceneTracks;
  afterTracks: SceneTracks;
}): RippleAdjustment[] {
  const beforeTrackList = [
    ...beforeTracks.overlay,
    beforeTracks.main,
    ...beforeTracks.audio,
  ];
  const afterTrackList = [
    ...afterTracks.overlay,
    afterTracks.main,
    ...afterTracks.audio,
  ];
  const afterTracksById = new Map(afterTrackList.map((track) => [track.id, track]));
  const allAfterElementIds = new Set(
    afterTrackList.flatMap((track) => track.elements.map((element) => element.id)),
  );

  return beforeTrackList.flatMap((beforeTrack): RippleAdjustment[] =>
    computeTrackRippleAdjustments({
      trackId: beforeTrack.id,
      beforeElements: beforeTrack.elements,
      afterElements: afterTracksById.get(beforeTrack.id)?.elements ?? [],
      allAfterElementIds,
    }),
  );
}

function computeTrackRippleAdjustments({
  trackId,
  beforeElements,
  afterElements,
  allAfterElementIds,
}: {
  trackId: string;
  beforeElements: TimelineElement[];
  afterElements: TimelineElement[];
  allAfterElementIds: Set<string>;
}): RippleAdjustment[] {
  const beforeElementsById = buildElementSpanMap({ elements: beforeElements });
  const afterElementsById = buildElementSpanMap({ elements: afterElements });
  const { vacatedIntervals, joinedIntervals } = collectTrackIntervals({
    beforeElementsById,
    afterElementsById,
    allAfterElementIds,
  });
  const freedIntervals = subtractIntervalSets({
    sourceIntervals: vacatedIntervals,
    overlappingIntervals: joinedIntervals,
  });

  return buildAdjustments({ trackId, intervals: freedIntervals });
}

function buildElementSpanMap({
  elements,
}: {
  elements: TimelineElement[];
}): Map<string, ElementSpan> {
  return new Map(
    elements.map((element) => [
      element.id,
      {
        id: element.id,
        startTime: element.startTime,
        endTime: element.startTime + element.duration,
      },
    ]),
  );
}

function collectTrackIntervals({
  beforeElementsById,
  afterElementsById,
  allAfterElementIds,
}: {
  beforeElementsById: Map<string, ElementSpan>;
  afterElementsById: Map<string, ElementSpan>;
  allAfterElementIds: Set<string>;
}): {
  vacatedIntervals: Interval[];
  joinedIntervals: Interval[];
} {
  const vacatedIntervals: Interval[] = [];
  const joinedIntervals: Interval[] = [];

  for (const beforeElement of beforeElementsById.values()) {
    const afterElement = afterElementsById.get(beforeElement.id);
    if (!afterElement) {
      const wasMovedToAnotherTrack = allAfterElementIds.has(beforeElement.id);
      if (!wasMovedToAnotherTrack) {
        pushInterval({
          intervals: vacatedIntervals,
          startTime: beforeElement.startTime,
          endTime: beforeElement.endTime,
        });
      }
      continue;
    }

    if (beforeElement.endTime > afterElement.endTime) {
      pushInterval({
        intervals: vacatedIntervals,
        startTime: afterElement.endTime,
        endTime: beforeElement.endTime,
      });
    }
  }

  for (const afterElement of afterElementsById.values()) {
    if (beforeElementsById.has(afterElement.id)) {
      continue;
    }

    pushInterval({
      intervals: joinedIntervals,
      startTime: afterElement.startTime,
      endTime: afterElement.endTime,
    });
  }

  return {
    vacatedIntervals: normalizeIntervals({ intervals: vacatedIntervals }),
    joinedIntervals: normalizeIntervals({ intervals: joinedIntervals }),
  };
}

function buildAdjustments({
  trackId,
  intervals,
}: {
  trackId: string;
  intervals: Interval[];
}): RippleAdjustment[] {
  return intervals.flatMap((interval): RippleAdjustment[] => {
    const shiftAmount = interval.endTime - interval.startTime;
    if (shiftAmount <= 0) {
      return [];
    }

    return [
      {
        trackId,
        afterTime: interval.endTime,
        shiftAmount,
      },
    ];
  });
}

function subtractIntervalSets({
  sourceIntervals,
  overlappingIntervals,
}: {
  sourceIntervals: Interval[];
  overlappingIntervals: Interval[];
}): Interval[] {
  const normalizedSourceIntervals = normalizeIntervals({
    intervals: sourceIntervals,
  });
  const normalizedOverlappingIntervals = normalizeIntervals({
    intervals: overlappingIntervals,
  });

  return normalizedSourceIntervals.flatMap((sourceInterval) =>
    subtractSingleInterval({
      sourceInterval,
      overlappingIntervals: normalizedOverlappingIntervals,
    }),
  );
}

function normalizeIntervals({
  intervals,
}: {
  intervals: Interval[];
}): Interval[] {
  const validIntervals: Interval[] = [];
  for (const interval of intervals) {
    pushInterval({
      intervals: validIntervals,
      startTime: interval.startTime,
      endTime: interval.endTime,
    });
  }

  const sortedIntervals = validIntervals.sort(
    (leftInterval, rightInterval) =>
      leftInterval.startTime - rightInterval.startTime,
  );

  if (sortedIntervals.length === 0) {
    return [];
  }

  const mergedIntervals: Interval[] = [{ ...sortedIntervals[0] }];
  for (const interval of sortedIntervals.slice(1)) {
    const previousInterval = mergedIntervals[mergedIntervals.length - 1];
    if (interval.startTime <= previousInterval.endTime) {
      previousInterval.endTime = Math.max(
        previousInterval.endTime,
        interval.endTime,
      );
      continue;
    }

    mergedIntervals.push({ ...interval });
  }

  return mergedIntervals;
}

function subtractSingleInterval({
  sourceInterval,
  overlappingIntervals,
}: {
  sourceInterval: Interval;
  overlappingIntervals: Interval[];
}): Interval[] {
  let remainingIntervals: Interval[] = [{ ...sourceInterval }];

  for (const overlappingInterval of overlappingIntervals) {
    remainingIntervals = remainingIntervals.flatMap((remainingInterval) => {
      if (
        overlappingInterval.endTime <= remainingInterval.startTime ||
        overlappingInterval.startTime >= remainingInterval.endTime
      ) {
        return [remainingInterval];
      }

      const nextIntervals: Interval[] = [];
      pushInterval({
        intervals: nextIntervals,
        startTime: remainingInterval.startTime,
        endTime: overlappingInterval.startTime,
      });
      pushInterval({
        intervals: nextIntervals,
        startTime: overlappingInterval.endTime,
        endTime: remainingInterval.endTime,
      });
      return nextIntervals;
    });

    if (remainingIntervals.length === 0) {
      return [];
    }
  }

  return remainingIntervals;
}

function pushInterval({
  intervals,
  startTime,
  endTime,
}: { intervals: Interval[]; startTime: number; endTime: number }): void {
  if (endTime <= startTime) {
    return;
  }

  intervals.push({ startTime, endTime });
}
