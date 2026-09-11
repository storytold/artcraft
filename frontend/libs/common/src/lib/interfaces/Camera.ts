export interface Camera {
  id: string;
  label: string;
  focalLength: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

export interface FocalLengthDragging {
  isDragging: boolean;
  focalLength: number;
}
