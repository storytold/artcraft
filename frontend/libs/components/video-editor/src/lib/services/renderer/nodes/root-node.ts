import { BaseNode } from "./base-node";

export type RootNodeParams = {
  duration: number;
};

export class RootNode extends BaseNode<RootNodeParams> {
  get duration() {
    return this.params.duration ?? 0;
  }
}
