import {
  VisualNode,
  type ResolvedVisualSourceNodeState,
  type VisualNodeParams,
} from "./visual-node";

export interface VideoNodeParams extends VisualNodeParams {
  url: string;
  file: File;
  mediaId: string;
}

export class VideoNode extends VisualNode<
  VideoNodeParams,
  ResolvedVisualSourceNodeState
> {}
