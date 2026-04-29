import { signal } from "@preact/signals-react";

export interface Camera {
  id: string;
  label: string;
  focalLength: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

export const cameras = signal<Camera[]>([
  {
    id: "main",
    label: "Main View",
    focalLength: 17,
    position: { x: -2.5, y: 2.5, z: 2.5 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
  {
    id: "cam2",
    label: "Camera 2",
    focalLength: 10,
    position: { x: 0, y: 0.6, z: 1.5 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
]);

export const selectedCameraId = signal<string>("main");

export const addCamera = (camera: Camera) => {
  cameras.value = [...cameras.value, camera];
};

export const updateCamera = (id: string, updates: Partial<Camera>) => {
  cameras.value = cameras.value.map((cam) =>
    cam.id === id ? { ...cam, ...updates } : cam,
  );
};

export const deleteCamera = (id: string) => {
  if (id === "main") return; // Prevent deleting main camera
  cameras.value = cameras.value.filter((cam) => cam.id !== id);
  if (selectedCameraId.value === id) {
    selectedCameraId.value = "main";
  }
};

export interface FocalLengthDragging {
  isDragging: boolean;
  focalLength: number;
}

export const focalLengthDragging = signal<FocalLengthDragging>({
  isDragging: false,
  focalLength: 35,
});
