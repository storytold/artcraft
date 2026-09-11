export enum EditorStates {
  EDIT,
  CAMERA_VIEW,
}

export enum CameraAspectRatio {
  HORIZONTAL_16_9 = "horizontal_16_9",
  VERTICAL_9_16 = "vertical_9_16",
  SQUARE_1_1 = "SQUARE_1_1",
  HORIZONTAL_3_2 = "horizontal_3_2",
  VERTICAL_2_3 = "vertical_2_3",
}

// Single source of truth for the aspect ratio a fresh scene starts with.
// Store default, CameraController default, and scene reset all read this.
export const DEFAULT_CAMERA_ASPECT_RATIO = CameraAspectRatio.HORIZONTAL_16_9;
