import { Object3D, ObjectLoader } from "three";

export class BoneJSONHelper {

  model: Object3D;

  constructor(model: Object3D) {
    this.model = model;
  }

  private findHipBone(objectGroup: Object3D[]): Object3D | undefined {
    let hipBone = undefined;
    for (const child of objectGroup) {
      if (child.type === "Bone" && child.name.toLowerCase().includes("mixamorighips")) {
        hipBone = child;
        break;
      }
    }

    return hipBone;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    if (!this.model.userData.isCharacter) {
      return;
    }

    if (this.model.children.length < 1) {
      return undefined;
    }

    // Find the hip bone
    const hipBone = this.findHipBone(this.model.children[0].children);

    if (!hipBone) {
      console.error("No hip bone found in the model.");
      return undefined;
    }

    return hipBone.toJSON();
  }

  /* Applies the bone tree in a recursive BFS manner */
  private applyBoneTree(hipBone: Object3D, boneTree: Object3D): void {
    hipBone.position.copy(boneTree.position);
    hipBone.quaternion.copy(boneTree.quaternion);
    hipBone.scale.copy(boneTree.scale);

    const hipChildren = hipBone.children;
    const treeChildren = boneTree.children;

    // NOTE: Assumption made that the lengths match!
    // This shouldn't be a problem unless the skeletal model is changed
    for (let i = 0; i < hipChildren.length; i++) {
      const hipChild = hipChildren[i];
      const treeChild = treeChildren[i];
      if (hipChild && treeChild) {
        this.applyBoneTree(hipChild, treeChild);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public poseFromBoneJSON(boneJSON: any): void {
    const hipBone = this.findHipBone(this.model.children[0].children);
    if (!hipBone) {
      return;
    }

    const loader = new ObjectLoader();
    const boneTree = loader.parse(boneJSON);
    this.applyBoneTree(hipBone, boneTree);
  }

}
