import {
  getVideoDurationConstraint,
  hasVideoDurationConfiguration,
  normalizeVideoDurationOptions,
  projectVideoDuration,
  resolveVideoDuration,
  type VideoDurationCapabilities,
  type VideoDurationProjectionInputs,
} from "./VideoDuration.js";

const rangeModel: VideoDurationCapabilities = {
  minDuration: 4,
  maxDuration: 15,
  maxDurationWithImageReferences: 10,
  defaultDuration: 7,
};

const immediateGenerateCases: [
  string,
  VideoDurationCapabilities,
  number,
  number,
  number,
][] = [
  ["continuous range", rangeModel, 5, 12, 12],
  ["sparse options", { durationOptions: [5, 10] }, 5, 10, 10],
];

const cappedMediaCases: [
  string,
  Omit<VideoDurationProjectionInputs, "storedDuration" | "pendingDuration">,
][] = [
  [
    "starting-frame image",
    {
      imageCount: 1,
      hasEndFrameImage: false,
      effectiveReferenceMode: false,
    },
  ],
  [
    "omni-reference image",
    {
      imageCount: 1,
      hasEndFrameImage: false,
      effectiveReferenceMode: true,
    },
  ],
  [
    "ending-frame image",
    {
      imageCount: 0,
      hasEndFrameImage: true,
      effectiveReferenceMode: false,
    },
  ],
];

describe("video duration constraints", () => {
  it("distinguishes no duration contract from an invalid advertised contract", () => {
    expect(hasVideoDurationConfiguration({})).toBe(false);
    expect(hasVideoDurationConfiguration({ minDuration: 4 })).toBe(true);
    expect(hasVideoDurationConfiguration({ durationOptions: [0, -1] })).toBe(
      false,
    );
  });

  it("keeps a valid range continuous and resolves its default", () => {
    expect(getVideoDurationConstraint(rangeModel)).toEqual({
      kind: "range",
      min: 4,
      max: 15,
    });
    expect(resolveVideoDuration(rangeModel, null)).toBe(7);
  });

  it.each([
    ["incomplete", { minDuration: 4, durationOptions: [5, 10] }],
    ["reversed", { minDuration: 15, maxDuration: 4, durationOptions: [5, 10] }],
  ])("uses options when a %s range is invalid", (_label, model) => {
    expect(getVideoDurationConstraint(model)).toEqual({
      kind: "options",
      options: [5, 10],
    });
  });

  it("uses a complete valid range in preference to options", () => {
    const model = {
      minDuration: 4,
      maxDuration: 8,
      durationOptions: [5, 8],
    };

    expect(resolveVideoDuration(model, 6)).toBe(6);
  });

  it("clamps continuous values below and above the range", () => {
    expect(resolveVideoDuration(rangeModel, 1)).toBe(4);
    expect(resolveVideoDuration(rangeModel, 99)).toBe(15);
  });

  it("never emits a gap in sparse options", () => {
    const model = { durationOptions: [5, 10] };

    expect(resolveVideoDuration(model, 6)).toBe(5);
    expect(resolveVideoDuration(model, 9)).toBe(10);
  });

  it("snaps an exact discrete tie toward the longer duration", () => {
    expect(resolveVideoDuration({ durationOptions: [5, 9] }, 7)).toBe(9);
  });

  it("accepts only unique, positive, finite safe-integer options", () => {
    expect(
      normalizeVideoDurationOptions([
        10,
        0,
        5,
        10,
        -1,
        4.5,
        Infinity,
        Number.MAX_SAFE_INTEGER + 1,
      ]),
    ).toEqual([5, 10]);
  });
});

describe("image-specific video duration cap", () => {
  it("applies to a concrete starting-frame image", () => {
    expect(
      resolveVideoDuration(rangeModel, 15, {
        imageCount: 1,
      }),
    ).toBe(10);
  });

  it("applies to a concrete omni-reference image", () => {
    expect(
      resolveVideoDuration(rangeModel, 15, {
        imageCount: 3,
      }),
    ).toBe(10);
  });

  it("applies to a concrete ending-frame image", () => {
    expect(
      resolveVideoDuration(rangeModel, 15, {
        hasEndFrameImage: true,
      }),
    ).toBe(10);
  });

  it("does not invent a remembered pre-cap value when images are removed", () => {
    const capped = resolveVideoDuration(rangeModel, 15, { imageCount: 1 });

    expect(capped).toBe(10);
    expect(resolveVideoDuration(rangeModel, capped, { imageCount: 0 })).toBe(
      10,
    );
  });

  it("does not apply to audio or video references alone", () => {
    expect(
      resolveVideoDuration(rangeModel, 15, {
        videoCount: 2,
        audioCount: 2,
      }),
    ).toBe(15);
  });

  it("filters discrete options above the image cap", () => {
    const model = {
      durationOptions: [5, 10, 15],
      maxDurationWithImageReferences: 10,
    };

    expect(resolveVideoDuration(model, 15, { imageCount: 1 })).toBe(10);
  });

  it("fails closed when an image cap is below the general minimum", () => {
    const contradictoryModel = {
      minDuration: 4,
      maxDuration: 15,
      maxDurationWithImageReferences: 3,
    };

    expect(
      getVideoDurationConstraint(contradictoryModel, { imageCount: 1 }),
    ).toBeNull();
    expect(
      resolveVideoDuration(contradictoryModel, 4, { imageCount: 1 }),
    ).toBeNull();
  });
});

describe("request and estimate projection", () => {
  it.each(immediateGenerateCases)(
    "uses the pending visible value for immediate Generate on a %s",
    (_label, model, storedDuration, pendingDuration, expectedRequest) => {
      const projection = projectVideoDuration(model, {
        storedDuration,
        pendingDuration,
      });

      expect(projection.estimateDuration).toBe(storedDuration);
      expect(projection.requestDuration).toBe(expectedRequest);
    },
  );

  it.each(cappedMediaCases)(
    "applies the image cap to a request with a %s",
    (_label, media) => {
      const projection = projectVideoDuration(rangeModel, {
        storedDuration: 15,
        ...media,
      });

      expect(projection.estimateDuration).toBe(10);
      expect(projection.requestDuration).toBe(10);
    },
  );

  it("ignores a stale end frame that reference-mode requests do not send", () => {
    const projection = projectVideoDuration(rangeModel, {
      storedDuration: 15,
      effectiveReferenceMode: true,
      hasEndFrameImage: true,
      videoCount: 1,
      audioCount: 1,
    });

    expect(projection.mediaInputs.hasEndFrameImage).toBe(false);
    expect(projection.estimateDuration).toBe(15);
    expect(projection.requestDuration).toBe(15);
  });

  it("does not cap a video/audio-only reference request", () => {
    const projection = projectVideoDuration(rangeModel, {
      storedDuration: 15,
      effectiveReferenceMode: true,
      videoCount: 2,
      audioCount: 2,
    });

    expect(projection.estimateDuration).toBe(15);
    expect(projection.requestDuration).toBe(15);
  });

  it("converges request and estimate after Generate persists the sent value", () => {
    const pending = projectVideoDuration(rangeModel, {
      storedDuration: 5,
      pendingDuration: 12,
    });
    const afterFlush = projectVideoDuration(rangeModel, {
      storedDuration: pending.requestDuration,
    });

    expect(pending.requestDuration).toBe(12);
    expect(afterFlush.estimateDuration).toBe(12);
    expect(afterFlush.requestDuration).toBe(afterFlush.estimateDuration);
  });
});
