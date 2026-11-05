import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import type Editor from "../editor";
import { TimelineController } from "./TimelineController";

// Builds a controller around a stub editor holding one real THREE object.
const build = () => {
  const scene = new THREE.Scene();
  const obj = new THREE.Object3D();
  scene.add(obj);
  const editor = {
    activeScene: { scene },
    bus: { emit: vi.fn() },
    history: { record: vi.fn() },
    cameraController: { getCameraPersonMode: () => false },
    characterAnimationManager: { sync: vi.fn(), evaluateAt: vi.fn() },
  } as unknown as Editor;
  const controller = new TimelineController(editor);
  controller.create();
  return { controller, obj };
};

describe("TimelineController keyframe edits", () => {
  it("re-poses the object when the keyframe under the playhead is deleted", () => {
    const { controller, obj } = build();
    // Keyframes: x=0 at t=0 and x=20 at t=2; park the playhead on the second.
    obj.position.x = 0;
    controller.addKeyframe(obj.uuid, 0);
    obj.position.x = 20;
    controller.addKeyframe(obj.uuid, 2);
    controller.seekTo(2);
    expect(obj.position.x).toBe(20);

    const last = controller.getTimeline()!.tracks[0].keyframes[1];
    controller.deleteKeyframe(last.id);

    // Only the x=0 key remains, so the object must now sit at x=0 rather than
    // keep showing the pose of the key that no longer exists.
    expect(obj.position.x).toBe(0);
  });

  it("keeps the playhead inside the restored timeline when Cancel shortens it", () => {
    const { controller } = build();
    const savedDuration = controller.getTimeline()!.duration;

    // Grow the timeline past the saved length and park the playhead out there.
    controller.setDuration(savedDuration + 20);
    controller.seekTo(savedDuration + 15);
    expect(controller.getPlayhead()).toBe(savedDuration + 15);

    controller.cancel();

    expect(controller.getTimeline()!.duration).toBe(savedDuration);
    expect(controller.getPlayhead()).toBeLessThanOrEqual(savedDuration);
  });
});
