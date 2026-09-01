import { describe, expect, it, vi } from "vitest";
import {
  commitVideoDurationForRequest,
  resolveVideoDurationSliderSelection,
} from "./videoDurationControl.js";

const rangeModel = {
  minDuration: 4,
  maxDuration: 15,
  maxDurationWithImageReferences: 10,
  defaultDuration: 5,
};

describe("PromptBox video duration consumer", () => {
  it("commits and sends a continuous selection when Generate is immediate", () => {
    const commit = vi.fn();
    const selected = resolveVideoDurationSliderSelection(
      rangeModel,
      { kind: "range", min: 4, max: 15 },
      12,
      {},
    );

    const requestDuration = commitVideoDurationForRequest(
      rangeModel,
      { storedDuration: 5, pendingDuration: selected },
      commit,
    );

    expect(selected).toBe(12);
    expect(requestDuration).toBe(12);
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(requestDuration);
  });

  it("uses an option index and never emits a sparse intermediate value", () => {
    const model = { durationOptions: [5, 10] };
    const constraint = { kind: "options", options: [5, 10] } as const;
    const commit = vi.fn();
    const selected = resolveVideoDurationSliderSelection(
      model,
      constraint,
      1,
      {},
    );

    expect(
      commitVideoDurationForRequest(
        model,
        { storedDuration: 5, pendingDuration: selected },
        commit,
      ),
    ).toBe(10);
    expect(commit).toHaveBeenCalledWith(10);
  });

  it("uses the effective request media shape when Generate is pressed", () => {
    const commit = vi.fn();

    expect(
      commitVideoDurationForRequest(
        rangeModel,
        {
          storedDuration: 15,
          pendingDuration: 15,
          effectiveReferenceMode: false,
          hasEndFrameImage: true,
        },
        commit,
      ),
    ).toBe(10);

    expect(
      commitVideoDurationForRequest(
        rangeModel,
        {
          storedDuration: 15,
          pendingDuration: 15,
          effectiveReferenceMode: true,
          hasEndFrameImage: true,
          videoCount: 1,
          audioCount: 1,
        },
        commit,
      ),
    ).toBe(15);
  });
});
