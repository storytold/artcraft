export enum FilterMediaClasses {
  AUDIO = "audio",
  IMAGE = "image",
  VIDEO = "video",
  /** Deprecated coarse 3D class; legacy records only. New 3D media is MESH or SPLAT. */
  DIMENSIONAL = "dimensional",
  MESH = "mesh",
  SPLAT = "splat",
}

export enum FilterMediaType {
  SCENE_JSON = "scene_json",
  GLB = "glb",
  GLTF = "gltf",
  PMX = "pmx",
  PMD = "pmd",
  VMD = "vmd",
}

export enum FilterEngineCategories {
  ANIMATION = "animation",
  AUDIO = "audio",
  CHARACTER = "character",
  CREATURE = "creature",
  EXPRESSION = "expression",
  IMAGE_PLANE = "image_plane",
  LOCATION = "location",
  OBJECT = "object",
  SPLAT = "splat",
  SCENE = "scene",
  SET_DRESSING = "set_dressing",
  SKYBOX = "skybox",
  VIDEO_PLANE = "video_plane",
}
