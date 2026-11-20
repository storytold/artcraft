import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { MouseControls, type MouseControlsDeps } from "./keybinds_controls";
import { TransformControls } from "./TransformControls";
import { EngineEventBus } from "./events/EngineEventBus";

vi.mock("./browserChecks", () => ({
  isPointerLockSupported: () => true,
}));

describe("pose-mode pointer input", () => {
  it("selects the joint at press time and keeps the selection as the pointer moves", () => {
    const rig = createPoseRig();

    rig.controls.onMouseDown(mouseEventAt(rig.jointPosition()));
    expect(rig.selectedJointId()).toBe(rig.joint.uuid);

    rig.controls.onMouseMove(mouseEventAt(rig.background));
    rig.controls.onMouseUp(mouseEventAt(rig.background));
    rig.controls.onMouseClick();

    expect(rig.selectedJointId()).toBe(rig.joint.uuid);
    expect(rig.lock).not.toHaveBeenCalled();
  });

  it("selects a joint on the first click after the camera moves", () => {
    const rig = createPoseRig();
    rig.camera.position.x += 0.25;
    rig.camera.updateMatrixWorld();
    const event = mouseEventAt(rig.jointPosition());

    rig.controls.onMouseMove(event);
    rig.controls.onMouseDown(event);
    rig.controls.onMouseUp(event);
    rig.controls.onMouseClick();

    expect(rig.selectedJointId()).toBe(rig.joint.uuid);
  });

  it("keeps camera look for a primary drag outside the markers", () => {
    const rig = createPoseRig();

    rig.controls.onMouseDown(mouseEventAt(rig.background));
    rig.controls.onMouseMove(mouseEventAt(rig.background));

    expect(rig.lock).toHaveBeenCalledTimes(1);
    expect(rig.selectedJointId()).toBeUndefined();
  });

  it("keeps camera look for a middle-button drag over a marker", () => {
    const rig = createPoseRig();
    const event = mouseEventAt(rig.jointPosition(), 1);

    rig.controls.onMouseDown(event);
    rig.controls.onMouseMove(event);

    expect(rig.lock).toHaveBeenCalledTimes(1);
    expect(rig.selectedJointId()).toBeUndefined();
  });

  it("lets a new background click clear selection after a press without a click", () => {
    const rig = createPoseRig();
    const jointPress = mouseEventAt(rig.jointPosition());
    const backgroundPress = mouseEventAt(rig.background);

    rig.controls.onMouseDown(jointPress);
    expect(rig.selectedJointId()).toBe(rig.joint.uuid);
    rig.controls.onMouseUp(backgroundPress);

    rig.controls.onMouseMove(backgroundPress);
    rig.controls.onMouseDown(backgroundPress);
    rig.controls.onMouseUp(backgroundPress);
    rig.controls.onMouseClick();

    expect(rig.selectedJointId()).toBeUndefined();
  });
});

function createPoseRig() {
  const canvas = document.createElement("canvas");
  const rect = new DOMRect(30, 20, 600, 600);
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue(rect);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;
  camera.updateMatrixWorld();

  const character = new THREE.Group();
  character.userData.isCharacter = true;
  const joint = new THREE.Bone();
  joint.name = "upper_arm";
  character.add(joint);
  scene.add(character);

  const lockControls = new PointerLockControls(camera, canvas);
  lockControls.disconnect();
  const lock = vi.spyOn(lockControls, "lock").mockReturnValue(undefined);
  vi.spyOn(lockControls, "unlock").mockReturnValue(undefined);
  const objectGizmo = new TransformControls(camera, canvas);
  const noop = vi.fn();
  const controls = new MouseControls({
    camera,
    camera_person_mode: false,
    cameraViewControls: null,
    lockControls,
    camera_last_pos: camera.position.clone(),
    deleteObject: noop,
    canvReference: canvas,
    mouse: new THREE.Vector2(),
    timeline_mouse: undefined,
    raycaster: new THREE.Raycaster(),
    control: objectGizmo,
    selectionPass: { setSelectedObjects: noop } as MouseControlsDeps["selectionPass"],
    scene,
    publishSelect: noop,
    updateSelectedUI: noop,
    transform_interaction: false,
    last_selected: undefined,
    getAssetType: noop,
    setSelected: noop,
    isMovable: () => true,
    toggle_stats: noop,
    bus: new EngineEventBus(),
    getPoseMode: () => "select",
    isHotkeyDisabled: () => false,
    getTransformSpace: () => "world",
    isViewportLocked: () => false,
  });
  controls.selectObject(character);
  controls.toggleFKMode();
  // The render loop normally updates the new bone markers' world matrices.
  scene.updateMatrixWorld(true);

  return {
    camera,
    controls,
    joint,
    lock,
    background: { x: rect.right - 20, y: rect.bottom - 20 },
    jointPosition: () => {
      const point = joint.getWorldPosition(new THREE.Vector3()).project(camera);
      return {
        x: rect.left + ((point.x + 1) * rect.width) / 2,
        y: rect.top + ((1 - point.y) * rect.height) / 2,
      };
    },
    selectedJointId: () =>
      scene.children.find(
        (child) => child instanceof TransformControls && child !== objectGizmo,
      )?.object?.uuid,
  };
}

function mouseEventAt({ x, y }: { x: number; y: number }, button = 0) {
  return new MouseEvent("mousedown", { clientX: x, clientY: y, button });
}
