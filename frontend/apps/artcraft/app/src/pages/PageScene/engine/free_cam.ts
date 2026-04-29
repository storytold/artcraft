import {
  EventDispatcher,
  Quaternion,
  Vector3,
  Vector2,
  MathUtils,
} from "three";
import * as THREE from "three";
import { cameras, selectedCameraId } from "~/pages/PageScene/signals/camera";
import { isPromptBoxFocused } from "~/pages/PageScene/signals/promptBox";

// Re-exported here for back-compat with keybinds_controls.ts; the
// definitions live in browserChecks.ts and will be imported directly
// once Phase 6 deletes this file.
export {
  isSafariOrWebKit,
  hasApplePay,
  isSafari,
  isPointerLockSupported,
} from "./browserChecks";

class FreeCam extends EventDispatcher {
  object: THREE.PerspectiveCamera;
  domElement: HTMLElement | Document;
  enabled = true;
  movementSpeed = 1.0;
  rollSpeed = 0.005;
  dragToLook = false;
  autoForward = false;
  dragging = false;
  xOffset = 0;
  yOffset = 0;

  // Smoothing properties
  smoothingFactor = 0.2;
  currentVelocity = new Vector3();
  lastPosition = new Vector3();

  lastMousePosition = new Vector2();
  mouseVelocity = new Vector2();
  tmpQuaternion = new Quaternion();

  status = 0;

  moveState = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    forward: 0,
    back: 0,
    pitchUp: 0,
    pitchDown: 0,
    yawLeft: 0,
    yawRight: 0,
    rollLeft: 0,
    rollRight: 0,
  };
  moveVector = new Vector3(0, 0, 0);
  rotationVector = new Vector3(0, 0, 0);

  constructor(
    object: THREE.PerspectiveCamera,
    domElement: HTMLElement | Document,
  ) {
    super();

    this.object = object;
    this.domElement = domElement;
    this.lastPosition.copy(object.position);

    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.mousewheel = this.mousewheel.bind(this);
    this.reset = this.reset.bind(this);
    this.update = this.update.bind(this);
    this.updateMovementVector = this.updateMovementVector.bind(this);
    this.updateRotationVector = this.updateRotationVector.bind(this);
    this.getContainerDimensions = this.getContainerDimensions.bind(this);
    this.dispose = this.dispose.bind(this);

    this.domElement.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });

    this.updateMovementVector();
    this.updateRotationVector();
  }

  attachEventListeners() {
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
    window.addEventListener("mousedown", this.mousedown);
    window.addEventListener("mouseup", this.mouseup);
    window.addEventListener("mousemove", this.mousemove);
    window.addEventListener("wheel", this.mousewheel);
  }

  detachEventListeners() {
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
    window.removeEventListener("mousedown", this.mousedown);
    window.removeEventListener("mouseup", this.mouseup);
    window.removeEventListener("mousemove", this.mousemove);
    window.removeEventListener("wheel", this.mousewheel);
  }

  keydown(event: KeyboardEvent) {
    if (!this.enabled || isPromptBoxFocused.value) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.moveState.forward = 1;
        break;
      case "KeyS":
        this.moveState.back = 1;
        break;

      case "KeyA":
        this.moveState.left = 1;
        break;
      case "KeyD":
        this.moveState.right = 1;
        break;

      case "KeyQ":
        this.moveState.down = 1;
        break;
      case "KeyE":
        this.moveState.up = 1;
        break;

      case "ArrowUp":
        this.moveState.pitchUp = 1;
        break;
      case "ArrowDown":
        this.moveState.pitchDown = 1;
        break;

      case "ArrowLeft":
        this.moveState.yawLeft = 1;
        break;
      case "ArrowRight":
        this.moveState.yawRight = 1;
        break;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  keyup(event: KeyboardEvent) {
    if (!this.enabled || isPromptBoxFocused.value) {
      return;
    }

    switch (event.code) {
      case "KeyW":
        this.moveState.forward = 0;
        break;
      case "KeyS":
        this.moveState.back = 0;
        break;

      case "KeyA":
        this.moveState.left = 0;
        break;
      case "KeyD":
        this.moveState.right = 0;
        break;

      case "ArrowUp":
        this.moveState.pitchUp = 0;
        break;
      case "ArrowDown":
        this.moveState.pitchDown = 0;
        break;

      case "ArrowLeft":
        this.moveState.yawLeft = 0;
        break;
      case "ArrowRight":
        this.moveState.yawRight = 0;
        break;

      case "KeyQ":
        this.moveState.down = 0;
        break;
      case "KeyE":
        this.moveState.up = 0;
        break;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  mousedown(event: MouseEvent) {
    if (!this.enabled) {
      return;
    }
    if (event.button === 2) {
      this.dragging = true;
      this.xOffset = event.clientX;
      this.yOffset = event.clientY;
      this.resetVelocity();
    }
  }

  mouseup(event: MouseEvent) {
    if (!this.enabled) {
      return;
    }
    if (event.button === 2) {
      this.xOffset = event.clientX;
      this.yOffset = event.clientY;
      this.resetVelocity();
    }
    this.dragging = false;
  }

  mousemove(event: MouseEvent) {
    if (!this.enabled) {
      return;
    }
    if (this.dragging) {
      const mouseX = event.clientX - this.xOffset;
      const mouseY = event.clientY - this.yOffset;
      this.xOffset = event.clientX;
      this.yOffset = event.clientY;

      if (Math.abs(mouseX + mouseY) > 0) {
        // Store last position before movement
        this.lastPosition.copy(this.object.position);

        // Apply movement with smoothing
        const translationX = -mouseX * (this.movementSpeed * 0.01);
        const translationY = mouseY * (this.movementSpeed * 0.01);

        this.currentVelocity.x = MathUtils.lerp(
          this.currentVelocity.x,
          translationX,
          this.smoothingFactor,
        );
        this.currentVelocity.y = MathUtils.lerp(
          this.currentVelocity.y,
          translationY,
          this.smoothingFactor,
        );

        this.object.translateX(this.currentVelocity.x);
        this.object.translateY(this.currentVelocity.y);
      }
    }
  }

  mousewheel(event: WheelEvent) {
    if (!this.enabled) {
      return;
    }

    // Store last position before zoom
    this.lastPosition.copy(this.object.position);

    const zoomDelta = event.deltaY / 120;
    this.currentVelocity.z = MathUtils.lerp(
      this.currentVelocity.z,
      zoomDelta,
      this.smoothingFactor,
    );
    this.object.translateZ(this.currentVelocity.z);
  }

  resetVelocity() {
    this.currentVelocity.set(0, 0, 0);
    this.lastPosition.copy(this.object.position);
  }

  reset() {
    this.moveState.forward = 0;
    this.moveState.back = 0;
    this.moveState.left = 0;
    this.moveState.right = 0;
    this.moveState.pitchUp = 0;
    this.moveState.pitchDown = 0;
    this.moveState.yawLeft = 0;
    this.moveState.yawRight = 0;
    this.moveState.down = 0;
    this.moveState.up = 0;

    this.resetVelocity();

    this.updateMovementVector();
    this.updateRotationVector();
  }

  isStationary() {
    return (
      this.moveVector.distanceTo(new Vector3(0, 0, 0)) === 0 &&
      this.currentVelocity.distanceTo(new Vector3(0, 0, 0)) < 0.0001
    );
  }

  isRotating() {
    return (
      this.moveState.pitchUp ||
      this.moveState.pitchDown ||
      this.moveState.yawLeft ||
      this.moveState.yawRight
    );
  }

  update(delta: number) {
    if (!this.enabled) {
      return;
    }

    // Skip update if there's no movement, velocity, or rotation
    if (this.isStationary() && !this.isRotating()) {
      return;
    }

    const moveMulti = delta * this.movementSpeed;

    // Apply WASD movement with smoothing
    const targetMovement = new Vector3(
      this.moveVector.x * moveMulti,
      this.moveVector.y * moveMulti,
      this.moveVector.z * moveMulti,
    );

    // Smooth out the movement
    this.currentVelocity.lerp(targetMovement, this.smoothingFactor);

    // Apply the smoothed movement
    this.object.translateX(this.currentVelocity.x);
    this.object.translateY(this.currentVelocity.y);
    this.object.translateZ(this.currentVelocity.z);

    // Store last position
    this.lastPosition.copy(this.object.position);


    // Done with positions
    // Now handle rotations
    this.object.rotateX(this.rotationVector.x);
    this.object.rotateY(this.rotationVector.y);
    this.object.rotateZ(this.rotationVector.z);

    // Update camera signals
    if (selectedCameraId.value) {
      const pos = this.object.position;
      const rot = this.object.rotation;

      // Calculate lookAt point based on camera's forward direction
      const lookAtPoint = new Vector3(0, 0, -1);
      lookAtPoint.applyQuaternion(this.object.quaternion);
      lookAtPoint.add(pos);

      cameras.value = cameras.value.map((cam) =>
        cam.id === selectedCameraId.value
          ? {
            ...cam,
            position: { x: pos.x, y: pos.y, z: pos.z },
            rotation: { x: rot.x, y: rot.y, z: rot.z },
            lookAt: { x: lookAtPoint.x, y: lookAtPoint.y, z: lookAtPoint.z },
          }
          : cam,
      );
    }
  }

  updateMovementVector() {
    const forward =
      this.moveState.forward || (this.autoForward && !this.moveState.back)
        ? 1
        : 0;

    this.moveVector.x = -this.moveState.left + this.moveState.right;
    this.moveVector.y = -this.moveState.down + this.moveState.up;
    this.moveVector.z = -forward + this.moveState.back;
  }

  updateRotationVector() {
    this.rotationVector.x = -this.moveState.pitchDown + this.moveState.pitchUp;
    this.rotationVector.y = -this.moveState.yawRight + this.moveState.yawLeft;
    this.rotationVector.z = -this.moveState.rollRight + this.moveState.rollLeft;
    this.rotationVector.multiplyScalar(this.rollSpeed);
  }

  getContainerDimensions() {
    if (this.domElement !== document) {
      return {
        size: [
          (this.domElement as HTMLElement).offsetWidth,
          (this.domElement as HTMLElement).offsetHeight,
        ],
        offset: [
          (this.domElement as HTMLElement).offsetLeft,
          (this.domElement as HTMLElement).offsetTop,
        ],
      };
    } else {
      return {
        size: [window.innerWidth, window.innerHeight],
        offset: [0, 0],
      };
    }
  }

  dispose() {
    // window.addEventListener('contextmenu', function(event) {
    //   event.preventDefault();
    // });

    // this.domElement.removeEventListener("contextmenu", this.contextmenu);
    // this.domElement.removeEventListener("pointerdown", this.pointerdown);
    // this.domElement.removeEventListener("pointermove", this.pointermove);
    // this.domElement.removeEventListener("pointerup", this.pointerup);
    // this.domElement.removeEventListener("pointercancel", this.pointercancel);
    //
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
  }
}

export { FreeCam };
