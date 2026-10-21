import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { createFreeCamControlState } from "../cameraMath";
import type { EngineEventBus } from "../events/EngineEventBus";
import { CameraController } from "./CameraController";

// Builds a controller with a real viewport camera and FreeCam state, and the
// minimum deps stubbed (tickPerFrame only reads cameras + the bus here).
const build = () => {
  const controller = new CameraController({
    getThreeScene: () => new THREE.Scene(),
    getHotItems: () => null,
    removeTransformControls: vi.fn(),
    setSelected: vi.fn(),
    setEditorState: vi.fn(),
    hideObjectPanel: vi.fn(),
    getCameras: () => [],
    getSelectedCameraId: () => "",
    bus: { emit: vi.fn() } as unknown as EngineEventBus,
  });
  controller.camera = new THREE.PerspectiveCamera();
  const state = createFreeCamControlState();
  state.enabled = true;
  controller.setFreeCamState(state);
  return { controller, state };
};

// Holds the yaw key for a quarter of a simulated second at a fixed frame rate
// and returns the total angle the camera turned (measured on the quaternion,
// since Euler y wraps near +/-90 degrees).
const turnedAngleInQuarterSecond = (fps: number) => {
  const { controller, state } = build();
  state.rotateKeys.yawLeft = 1;
  for (let frame = 0; frame < fps / 4; frame++) {
    controller.tickPerFrame(1 / fps);
  }
  return controller.camera!.quaternion.angleTo(new THREE.Quaternion());
};

describe("CameraController free-cam keyboard look", () => {
  it("turns at the same speed on a 60 Hz and a 144 Hz display", () => {
    // Holding an arrow key for the same wall-clock time must sweep the same
    // angle no matter how many frames the display drew in that time.
    const at60 = turnedAngleInQuarterSecond(60);
    const at144 = turnedAngleInQuarterSecond(144);
    expect(at144).toBeCloseTo(at60, 3);
  });
});
