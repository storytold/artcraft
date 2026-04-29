import * as THREE from "three";
import { FKBoneBlacklistStrings } from "./FKBoneFilter";
import { TransformControls } from "../TransformControls";

export const FKHelperSphereName = "__FKHelperSphere__";

export class FKHelper {

  private targetBoneSpheres: THREE.Object3D<THREE.Object3DEventMap>[];
  private transformControls: TransformControls;
  private raycaster: THREE.Raycaster;
  private scene: THREE.Scene;

  private skeletonHelper: THREE.SkeletonHelper | null = null;
  private isControlInScene = false;

  // Need the actual object to perform FK on
  // This means the object must have bones
  // Not all bones require FK right now
  // Need a set of names to filter bones
  // Use mixamo names
  // Need a transform control (rotation mode) for the bones
  // Need to disable the object transforms for bone transforms
  // Need raycaster
  constructor({
    camera,
    domElement,
    scene,
    onDragChange
  }: {
    camera: THREE.Camera;
    domElement: HTMLElement;
    scene: THREE.Scene;
    onDragChange: (dragging: boolean) => void;
  }) {
    this.raycaster = new THREE.Raycaster();
    this.scene = scene;
    this.targetBoneSpheres = [];
    this.transformControls = new TransformControls(camera, domElement);

    this.transformControls.setSpace("local");
    this.transformControls.setMode("rotate");
    this.transformControls.setSize(0.5);
    this.transformControls.addEventListener("dragging-changed", (event: any) => {
      onDragChange(event.value);
    });
  }

  // Set FK target
  setTarget(target: THREE.Object3D) {
    // TODO: Highlight all the necessary bones
    this.clear();
    target.traverse((child) => {
      // Skip if not bone
      if (child.type !== "Bone") {
        return;
      }

      // Skip if bones is one of the blacklisted ones
      // This step could probably be optimized better
      for (const blacklistedBone of FKBoneBlacklistStrings) {
        if (child.name.toLowerCase().includes(blacklistedBone)) {
          return;
        }
      }

      console.log(child.name);

      // For each target bone, display a sphere to show the FK target and raycast intersect
      const geometry = new THREE.SphereGeometry(0.015, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false, transparent: true });
      const sphere = new THREE.Mesh(geometry, material);

      // FIX: Set the sphere scale to counter parent's world scale to remain constant in size
      // TODO: Make a scale clamp
      const parentScale = new THREE.Vector3();
      child.getWorldScale(parentScale);

      const sphereScale = new THREE.Vector3(1, 1, 1);
      sphereScale.divide(parentScale);
      sphere.scale.copy(sphereScale);

      sphere.name = FKHelperSphereName;
      child.add(sphere);
      this.targetBoneSpheres.push(sphere);
    });

    this.skeletonHelper = new THREE.SkeletonHelper(target);
    this.scene.add(this.skeletonHelper);
    console.log("All bones:", this.skeletonHelper.bones.map((b) => b.name));
  }

  onMouseClick(mouse: THREE.Vector2) {
    this.raycaster.setFromCamera(mouse, this.transformControls.camera);
    const intersections = this.raycaster.intersectObjects(this.targetBoneSpheres, false);

    if (intersections.length < 1) {
      console.log("No intersections");
      this.resetHighlight();
      this.removeControls();
      return;
    }

    // Attach the controls to the first bone
    const firstBone = intersections[0];
    this.highlightSphere(firstBone.object);
    this.showControls(firstBone.object.parent!);
    console.log("Showing bone", firstBone.object);
  }

  private showControls(object?: THREE.Object3D) {
    if (object) {
      this.transformControls.attach(object);
    }

    if (this.isControlInScene) {
      return;
    }

    this.scene.add(this.transformControls);
    this.isControlInScene = true;
  }

  private highlightSphere(sphere: THREE.Object3D) {
    this.targetBoneSpheres.forEach((s) => {
      // @ts-expect-error Material on object3d, but it's fine since this is a mesh
      s.material.opacity = 0.2
    });
    // @ts-expect-error Material on object3d, but it's fine since this is a mesh
    sphere.material.opacity = 1;
  }

  private resetHighlight() {
    this.targetBoneSpheres.forEach((s) => {
      // @ts-expect-error Material on object3d, but it's fine since this is a mesh
      s.material.opacity = 1;
    });
  }

  private removeControls() {
    this.transformControls.detach();

    if (this.isControlInScene) {
      this.scene.remove(this.transformControls);
      this.isControlInScene = false;
    }
  }

  private removeSpheres() {
    this.targetBoneSpheres.forEach((sphere) => {
      this.scene.remove(sphere);
      sphere.parent?.remove(sphere);
      // @ts-expect-error Geometry on object3d, but it's fine since this is a mesh
      sphere.geometry.dispose();
    });
    this.targetBoneSpheres = [];
  }

  clear() {
    this.removeControls();
    this.removeSpheres();

    if (this.skeletonHelper) {
      this.scene.remove(this.skeletonHelper!);
    }
  }
}
