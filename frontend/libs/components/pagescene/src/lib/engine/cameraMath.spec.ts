import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import {
  CAMERA_MOVE_ACTION_SLOTS,
  CAMERA_ROTATE_ACTION_SLOTS,
  createFreeCamControlState,
  emptyMoveKeys,
  emptyRotateKeys,
  freeCamFrameTick,
  lerpVelocity,
  lookAtFromCamera,
  moveSlotForKeyCode,
  moveVectorFromKeys,
  panFromDrag,
  rotateSlotForKeyCode,
  rotationVectorFromKeys,
  zoomFromWheel,
} from "./cameraMath";

describe("empty key state", () => {
  it("starts with every key released", () => {
    expect(Object.values(emptyMoveKeys()).every((v) => v === 0)).toBe(true);
    expect(Object.values(emptyRotateKeys()).every((v) => v === 0)).toBe(true);
  });

  it("returns a fresh object each call so state is never shared", () => {
    expect(emptyMoveKeys()).not.toBe(emptyMoveKeys());
  });
});

describe("moveVectorFromKeys", () => {
  it("is the zero vector with nothing held", () => {
    expect(moveVectorFromKeys(emptyMoveKeys()).toArray()).toEqual([0, 0, 0]);
  });

  it("maps right/up to +x/+y and forward to -z (camera looks down -z)", () => {
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), right: 1 }).x).toBe(1);
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), left: 1 }).x).toBe(-1);
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), up: 1 }).y).toBe(1);
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), down: 1 }).y).toBe(-1);
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), forward: 1 }).z).toBe(-1);
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), back: 1 }).z).toBe(1);
  });

  it("cancels opposite keys", () => {
    const v = moveVectorFromKeys({ ...emptyMoveKeys(), left: 1, right: 1 });
    expect(v.x).toBe(0);
  });

  it("auto-forward drifts forward unless back is held", () => {
    expect(moveVectorFromKeys(emptyMoveKeys(), true).z).toBe(-1);
    expect(moveVectorFromKeys({ ...emptyMoveKeys(), back: 1 }, true).z).toBe(1);
  });
});

describe("rotationVectorFromKeys", () => {
  it("scales by roll speed", () => {
    const v = rotationVectorFromKeys({ ...emptyRotateKeys(), pitchUp: 1 }, 0.5);
    expect(v.toArray()).toEqual([0.5, 0, 0]);
  });

  it("maps yawLeft to +y and rollLeft to +z", () => {
    expect(rotationVectorFromKeys({ ...emptyRotateKeys(), yawLeft: 1 }, 1).y).toBe(1);
    expect(rotationVectorFromKeys({ ...emptyRotateKeys(), yawRight: 1 }, 1).y).toBe(-1);
    expect(rotationVectorFromKeys({ ...emptyRotateKeys(), rollLeft: 1 }, 1).z).toBe(1);
  });
});

describe("panFromDrag / zoomFromWheel", () => {
  it("inverts x and scales by speed * 0.01", () => {
    expect(panFromDrag(100, 50, 1)).toEqual({ x: -1, y: 0.5 });
    expect(panFromDrag(100, 50, 2)).toEqual({ x: -2, y: 1 });
  });

  it("normalises one wheel notch (120) to 1", () => {
    expect(zoomFromWheel(120)).toBe(1);
    expect(zoomFromWheel(-240)).toBe(-2);
  });
});

describe("lookAtFromCamera", () => {
  it("is one unit in front of an unrotated camera", () => {
    const cam = new PerspectiveCamera();
    cam.position.set(1, 2, 3);
    const p = lookAtFromCamera(cam);
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(2);
    expect(p.z).toBeCloseTo(2);
  });

  it("follows the camera's rotation", () => {
    const cam = new PerspectiveCamera();
    cam.rotateY(Math.PI / 2); // turn left: forward becomes -x
    cam.updateMatrixWorld();
    const p = lookAtFromCamera(cam);
    expect(p.x).toBeCloseTo(-1);
    expect(p.z).toBeCloseTo(0);
  });
});

describe("lerpVelocity", () => {
  it("moves each component part way toward the target and returns the same instance", () => {
    const velocity = new Vector3(0, 10, -10);
    const out = lerpVelocity(velocity, new Vector3(10, 0, 10), 0.5);
    expect(out).toBe(velocity);
    expect(velocity.toArray()).toEqual([5, 5, 0]);
  });

  it("smoothing 1 snaps to the target, 0 stays put", () => {
    expect(lerpVelocity(new Vector3(1, 1, 1), new Vector3(4, 4, 4), 1).toArray()).toEqual([4, 4, 4]);
    expect(lerpVelocity(new Vector3(1, 1, 1), new Vector3(4, 4, 4), 0).toArray()).toEqual([1, 1, 1]);
  });
});

describe("createFreeCamControlState", () => {
  it("starts disabled, at rest, with the documented tuning", () => {
    const s = createFreeCamControlState();
    expect(s.enabled).toBe(false);
    expect(s.velocity.lengthSq()).toBe(0);
    expect(s.movementSpeed).toBe(1.15);
    expect(s.smoothing).toBe(0.2);
    expect(s.rollSpeed).toBeCloseTo(Math.PI / 180);
  });
});

describe("key code slot lookup", () => {
  it("returns the slot for a mapped code and null otherwise", () => {
    const map = { KeyW: "forward", KeyS: "back" } as const;
    expect(moveSlotForKeyCode("KeyW", map)).toBe("forward");
    expect(moveSlotForKeyCode("KeyZ", map)).toBeNull();
    expect(rotateSlotForKeyCode("ArrowUp", { ArrowUp: "pitchUp" })).toBe("pitchUp");
    expect(rotateSlotForKeyCode("KeyZ", {})).toBeNull();
  });

  it("action tables cover every held-key slot except roll", () => {
    expect(Object.values(CAMERA_MOVE_ACTION_SLOTS).sort()).toEqual(
      Object.keys(emptyMoveKeys()).sort(),
    );
    expect(Object.values(CAMERA_ROTATE_ACTION_SLOTS).sort()).toEqual(
      ["pitchDown", "pitchUp", "yawLeft", "yawRight"],
    );
  });
});

describe("freeCamFrameTick", () => {
  it("does nothing while disabled, even with keys held", () => {
    const cam = new PerspectiveCamera();
    const s = createFreeCamControlState();
    s.moveKeys.forward = 1;
    expect(freeCamFrameTick(cam, s, 1)).toBe(false);
    expect(cam.position.z).toBe(0);
  });

  it("reports no change when idle", () => {
    const cam = new PerspectiveCamera();
    const s = createFreeCamControlState();
    s.enabled = true;
    expect(freeCamFrameTick(cam, s, 1)).toBe(false);
  });

  it("moves the camera forward (-z) while forward is held", () => {
    const cam = new PerspectiveCamera();
    const s = createFreeCamControlState();
    s.enabled = true;
    s.moveKeys.forward = 1;
    expect(freeCamFrameTick(cam, s, 1)).toBe(true);
    expect(cam.position.z).toBeLessThan(0);
  });

  it("keeps coasting after release until velocity dies down, then stops", () => {
    const cam = new PerspectiveCamera();
    const s = createFreeCamControlState();
    s.enabled = true;
    s.moveKeys.forward = 1;
    freeCamFrameTick(cam, s, 1);
    s.moveKeys.forward = 0;
    expect(freeCamFrameTick(cam, s, 1)).toBe(true); // residual velocity
    let ticks = 0;
    while (freeCamFrameTick(cam, s, 1) && ticks < 200) ticks++;
    expect(ticks).toBeLessThan(200);
  });

  it("applies rotation without needing movement", () => {
    const cam = new PerspectiveCamera();
    const s = createFreeCamControlState();
    s.enabled = true;
    s.rotateKeys.yawLeft = 1;
    expect(freeCamFrameTick(cam, s, 1)).toBe(true);
    expect(cam.rotation.y).toBeCloseTo(s.rollSpeed);
  });
});
