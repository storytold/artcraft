// NB(bt,2025-05-27): This is also declared in "editor3d". 
// I'm duplicating here to remove a circular dependency.
// We should consolidate definitions eventually.
export enum FilterEngineCategories {
  ANIMATION = "animation",
  AUDIO = "audio",
  CHARACTER = "character",
  CREATURE = "creature",
  EXPRESSION = "expression",
  IMAGE_PLANE = "image_plane",
  LOCATION = "location",
  OBJECT = "object",
  SCENE = "scene",
  SET_DRESSING = "set_dressing",
  SKYBOX = "skybox",
  VIDEO_PLANE = "video_plane",
}

// NB(bt,2025-05-27): This is also declared in "editor3d". 
// I'm duplicating here to remove a circular dependency.
// We should consolidate definitions eventually.
export enum UploaderStates {
  ready,
  uploadingAsset,
  uploadingImage,
  uploadingCover,
  settingCover,
  success,
  assetError,
  coverCreateError,
  coverSetError,
  imageCreateError,
}

// NB(bt,2025-05-27): This is also declared in "editor3d". 
// I'm duplicating here to remove a circular dependency.
// We should consolidate definitions eventually.
export interface UploaderState {
  status: UploaderStates;
  errorMessage?: string;
  data?: string;
}

// NB(bt,2025-05-27): This is also declared in "editor3d". 
// I'm duplicating here to remove a circular dependency.
// We should consolidate definitions eventually.
export const initialUploaderState = {
  status: UploaderStates.ready,
};
