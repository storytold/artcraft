import { MathUtils, Vector3 } from "three";
import type { PerspectiveCamera } from "three";

// Pure math used by the free-cam viewport controls.
// No DOM access, no event listeners, no signals — every function
// takes inputs and returns values. The input hooks own the listener
// lifecycle and the per-frame loop; this module owns the formulas.

// Held movement keys (WASD + QE). Stored as 0/1 so update steps can
// just sum them in opposite directions.
export interface HeldMoveKeys {
  forward: 0 | 1;
  back: 0 | 1;
  left: 0 | 1;
  right: 0 | 1;
  up: 0 | 1;
  down: 0 | 1;
}

// Held rotation keys (arrow keys + roll). Same encoding.
export interface HeldRotateKeys {
  pitchUp: 0 | 1;
  pitchDown: 0 | 1;
  yawLeft: 0 | 1;
  yawRight: 0 | 1;
  rollLeft: 0 | 1;
  rollRight: 0 | 1;
}

export const emptyMoveKeys = (): HeldMoveKeys => ({
  forward: 0,
  back: 0,
  left: 0,
  right: 0,
  up: 0,
  down: 0,
});

export const emptyRotateKeys = (): HeldRotateKeys => ({
  pitchUp: 0,
  pitchDown: 0,
  yawLeft: 0,
  yawRight: 0,
  rollLeft: 0,
  rollRight: 0,
});

// Per-frame movement direction (in camera-local space). Multiply by
// (delta * movementSpeed) before applying.
export const moveVectorFromKeys = (
  keys: HeldMoveKeys,
  autoForward = false,
): Vector3 => {
  const forward = keys.forward || (autoForward && !keys.back) ? 1 : 0;
  return new Vector3(
    -keys.left + keys.right,
    -keys.down + keys.up,
    -forward + keys.back,
  );
};

// Per-frame rotation deltas. Already pre-scaled by rollSpeed.
export const rotationVectorFromKeys = (
  keys: HeldRotateKeys,
  rollSpeed: number,
): Vector3 =>
  new Vector3(
    -keys.pitchDown + keys.pitchUp,
    -keys.yawRight + keys.yawLeft,
    -keys.rollRight + keys.rollLeft,
  ).multiplyScalar(rollSpeed);

// Mouse-drag pan amounts (in camera-local x/y, before applying).
// dx/dy are pointer deltas in pixels; speed scales them.
export const panFromDrag = (
  dx: number,
  dy: number,
  speed: number,
): { x: number; y: number } => ({
  x: -dx * (speed * 0.01),
  y: dy * (speed * 0.01),
});

// Wheel-event zoom amount along camera-local z.
export const zoomFromWheel = (deltaY: number): number => deltaY / 120;

// World-space lookAt point one unit ahead of the camera along its
// current orientation. Used to update camera entries in the store
// after a free-cam move so the camera entry's "lookAt" stays in
// sync with the rendered orientation.
export const lookAtFromCamera = (camera: PerspectiveCamera): Vector3 => {
  const lookAt = new Vector3(0, 0, -1);
  lookAt.applyQuaternion(camera.quaternion);
  lookAt.add(camera.position);
  return lookAt;
};

// Smooth a velocity vector toward a target with a per-component lerp.
// Returns the same `velocity` instance for chaining.
export const lerpVelocity = (
  velocity: Vector3,
  target: Vector3,
  smoothing: number,
): Vector3 => {
  velocity.x = MathUtils.lerp(velocity.x, target.x, smoothing);
  velocity.y = MathUtils.lerp(velocity.y, target.y, smoothing);
  velocity.z = MathUtils.lerp(velocity.z, target.z, smoothing);
  return velocity;
};

// Per-frame state owned by useFreeCam. The editor's render loop
// reads this struct on every tick and applies the resulting motion.
// Mutated in place by event handlers (keyboard) so the React
// reference stays stable.
export interface FreeCamControlState {
  enabled: boolean;
  moveKeys: HeldMoveKeys;
  rotateKeys: HeldRotateKeys;
  velocity: Vector3;
  movementSpeed: number;
  rollSpeed: number;
  smoothing: number;
}

export const createFreeCamControlState = (): FreeCamControlState => ({
  enabled: false,
  moveKeys: emptyMoveKeys(),
  rotateKeys: emptyRotateKeys(),
  velocity: new Vector3(),
  movementSpeed: 1.15,
  rollSpeed: Math.PI / 180,
  smoothing: 0.2,
});

// Translate a code from a KeyboardEvent into the move-state slot it
// drives, if any. Returns the property name on HeldMoveKeys, or null.
export const moveSlotForKeyCode = (
  code: string,
): keyof HeldMoveKeys | null => {
  switch (code) {
    case "KeyW": return "forward";
    case "KeyS": return "back";
    case "KeyA": return "left";
    case "KeyD": return "right";
    case "KeyQ": return "down";
    case "KeyE": return "up";
    default: return null;
  }
};

export const rotateSlotForKeyCode = (
  code: string,
): keyof HeldRotateKeys | null => {
  switch (code) {
    case "ArrowUp":    return "pitchUp";
    case "ArrowDown":  return "pitchDown";
    case "ArrowLeft":  return "yawLeft";
    case "ArrowRight": return "yawRight";
    default: return null;
  }
};

// Per-frame integration step. Reads `state` (held keys + velocity),
// applies the resulting movement / rotation to `camera`, and returns
// `true` if anything changed. The caller is responsible for any
// downstream sync (e.g. lookAt updates) when this returns true.
export const freeCamFrameTick = (
  camera: PerspectiveCamera,
  state: FreeCamControlState,
  delta: number,
): boolean => {
  if (!state.enabled) return false;

  const moveVec = moveVectorFromKeys(state.moveKeys);
  const rotVec = rotationVectorFromKeys(state.rotateKeys, state.rollSpeed);

  const stationary = moveVec.lengthSq() === 0;
  const noRotation = rotVec.lengthSq() === 0;
  const velocityIdle = state.velocity.lengthSq() < 0.0001;
  if (stationary && noRotation && velocityIdle) return false;

  const target = moveVec.multiplyScalar(delta * state.movementSpeed);
  lerpVelocity(state.velocity, target, state.smoothing);

  camera.translateX(state.velocity.x);
  camera.translateY(state.velocity.y);
  camera.translateZ(state.velocity.z);
  camera.rotateX(rotVec.x);
  camera.rotateY(rotVec.y);
  camera.rotateZ(rotVec.z);
  return true;
};
