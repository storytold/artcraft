import { act, renderHook } from "@testing-library/react";
import { useSceneStore } from "../stores/SceneState";
import { useCanvasPresetsStore } from "../stores/CanvasPresetsStore";
import { useCanvasSafeZones } from "./useCanvasSafeZones";

describe("useCanvasSafeZones", () => {
  beforeEach(() => {
    useSceneStore.getState().RESET();
    useCanvasPresetsStore.setState({ customPresets: [] });
  });

  it("shows the selected safe zone while the canvas has its exact ratio", () => {
    startBlankCanvas(1080, 1920, "tiktok-in-feed");
    const { result } = renderHook(() => useCanvasSafeZones());

    expect(result.current.matching.map((zone) => zone.id)).toEqual([
      "meta-stories-reels",
      "tiktok-in-feed",
      "tiktok-in-feed-anchor",
    ]);
    expect(result.current.shown?.id).toBe("tiktok-in-feed");
  });

  it("hides it on a canvas of another ratio, and shows it again on one that fits", () => {
    startBlankCanvas(1080, 1920, "tiktok-in-feed");
    const { result } = renderHook(() => useCanvasSafeZones());

    act(() => startBlankCanvas(1024, 1792, "tiktok-in-feed"));
    expect(result.current.matching).toEqual([]);
    expect(result.current.shown).toBeNull();

    act(() => startBlankCanvas(1440, 2560, "tiktok-in-feed"));
    expect(result.current.shown?.id).toBe("tiktok-in-feed");
  });

  it("includes the safe zones of the user's own presets", () => {
    const preset = useCanvasPresetsStore.getState().addCustomPreset({
      name: "Client story",
      width: 1080,
      height: 1350,
      safeZones: [
        {
          name: "Logo bar",
          margins: { top: 120, right: 0, bottom: 0, left: 0 },
        },
      ],
    });
    startBlankCanvas(2160, 2700, null);
    const { result } = renderHook(() => useCanvasSafeZones());

    expect(result.current.matching).toEqual(preset.safeZones);
    expect(result.current.shown).toBeNull();

    act(() => result.current.show(preset.safeZones[0].id));
    expect(result.current.shown?.label).toBe("Logo bar");
  });
});

describe("saved presets", () => {
  it("drop damaged entries when they are read back from storage", async () => {
    localStorage.setItem(
      "artcraft-canvas-presets",
      JSON.stringify({
        version: 1,
        state: {
          customPresets: [
            { id: "ok", name: "Ok", width: 800, height: 600, safeZones: [] },
            { id: "broken", name: "Broken", width: "wide", safeZones: [] },
          ],
        },
      }),
    );

    await useCanvasPresetsStore.persist.rehydrate();

    expect(
      useCanvasPresetsStore.getState().customPresets.map((p) => p.id),
    ).toEqual(["ok"]);
  });
});

function startBlankCanvas(
  width: number,
  height: number,
  safeZoneId: string | null,
) {
  const scene = useSceneStore.getState();
  scene.setBaseImageInfo({
    url: "",
    mediaToken: `blank_canvas_${width}x${height}`,
    isBlankCanvas: true,
    blankCanvasWidth: width,
    blankCanvasHeight: height,
  });
  scene.setSafeZoneId(safeZoneId);
}
