import canvasSizes from "./canvas-sizes.json";
import {
  BUILT_IN_CANVAS_PRESETS,
  createCustomPreset,
  customPresetProblems,
  parseCustomPresets,
  toCustomPresetInput,
  type CustomCanvasPresetInput,
} from "./canvas-size-library";
import { matchingSafeZones } from "./safe-zones";

const MY_STORY: CustomCanvasPresetInput = {
  name: "Client story",
  width: 1080,
  height: 1350,
  safeZones: [
    { name: "Logo bar", margins: { top: 120, right: 0, bottom: 0, left: 0 } },
  ],
};

describe("built-in presets", () => {
  it("reads the canvas size library format it was written for", () => {
    expect(canvasSizes.format).toBe(1);
  });

  it("lists Standard first, then the library's channels", () => {
    const channels = [
      ...new Set(BUILT_IN_CANVAS_PRESETS.map((p) => p.channel)),
    ];
    expect(channels).toEqual(["Standard", "Social"]);
  });

  it("gives every preset a unique id", () => {
    const ids = BUILT_IN_CANVAS_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only attaches safe zones that fit the preset's exact size", () => {
    for (const preset of BUILT_IN_CANVAS_PRESETS) {
      expect(
        matchingSafeZones(preset.safeZones, preset.width, preset.height),
      ).toEqual(preset.safeZones);
    }
  });

  it("resolves every safe zone the library refers to", () => {
    const referenced = canvasSizes.channels.flatMap((c) =>
      c.platforms.flatMap((p) => p.types.flatMap((t) => t.safeZones)),
    );
    const attached = BUILT_IN_CANVAS_PRESETS.flatMap((p) =>
      p.safeZones.map((z) => z.id),
    );
    expect(attached).toEqual(referenced);
  });
});

describe("custom presets", () => {
  it("accepts a named size with sensible margins", () => {
    expect(customPresetProblems(MY_STORY)).toEqual([]);
  });

  it("explains what is wrong", () => {
    const problems = customPresetProblems({
      name: " ",
      width: 1080.5,
      height: 1350,
      safeZones: [
        { name: "", margins: { top: 700, right: 0, bottom: 700, left: 0 } },
        { name: "Bar", margins: { top: -1, right: 0, bottom: 0, left: 0 } },
      ],
    });

    expect(problems).toEqual([
      "Give the preset a name.",
      "Width and height must be whole numbers from 16 to 4096.",
      "Safe zone 1 needs a name.",
      "Safe zone 1: the margins leave nothing visible.",
      "Safe zone 2: margins must be whole pixels, 0 or more.",
    ]);
  });

  it("gives a preset's safe zones its own exact ratio", () => {
    const preset = createCustomPreset("custom-1", MY_STORY);

    expect(preset.channel).toBe("My presets");
    expect(preset.safeZones).toEqual([
      {
        id: "custom-1-safe-zone-1",
        label: "Logo bar",
        ratio: { width: 1080, height: 1350 },
        frame: { width: 1080, height: 1350 },
        margins: { top: 120, right: 0, bottom: 0, left: 0 },
        covered: [],
        mirrorsForRightToLeft: false,
      },
    ]);
    expect(matchingSafeZones(preset.safeZones, 2160, 2700)).toHaveLength(1);
    expect(matchingSafeZones(preset.safeZones, 1080, 1920)).toHaveLength(0);
  });

  it("round-trips through storage", () => {
    const preset = createCustomPreset("custom-1", MY_STORY);
    const stored = JSON.parse(
      JSON.stringify([{ id: preset.id, ...toCustomPresetInput(preset) }]),
    );

    expect(parseCustomPresets(stored)).toEqual([preset]);
  });

  it("drops damaged entries from storage instead of failing", () => {
    const stored = [
      { id: "ok", ...MY_STORY },
      { id: "no-name", ...MY_STORY, name: 42 },
      { id: "too-big", ...MY_STORY, width: 100000 },
      { ...MY_STORY },
      "garbage",
    ];

    expect(parseCustomPresets(stored).map((p) => p.id)).toEqual(["ok"]);
    expect(parseCustomPresets(null)).toEqual([]);
  });
});
