export type Vec2 = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Tool = "select" | "lasso" | "text";

interface BaseNode {
  id: string;
  parentId: string | null;
  // Stage-local for top-level nodes; group-local for children of a group.
  x: number;
  y: number;
  width: number;
  height: number;
  // Degrees, Konva convention.
  rotation: number;
  zIndex: number;
}

export type ImageNode = BaseNode & {
  kind: "image";
  src: string;
  mediaId: string | null;
  naturalW: number;
  naturalH: number;
};

export type VideoNode = BaseNode & {
  kind: "video";
  src: string;
  mediaId: string | null;
  naturalW: number;
  naturalH: number;
  muted: boolean;
  loop: boolean;
  autoplay: boolean;
};

export type TextNode = BaseNode & {
  kind: "text";
  text: string;
  fontSize: number;
  color: string;
};

export type GroupNode = BaseNode & {
  kind: "group";
  childIds: string[];
};

export type MoodboardNode = ImageNode | VideoNode | TextNode | GroupNode;

export interface MoodboardSnapshot {
  nodes: Record<string, MoodboardNode>;
  rootOrder: string[];
  selectedIds: string[];
}
