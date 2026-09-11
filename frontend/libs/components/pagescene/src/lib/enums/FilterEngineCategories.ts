// Engine-side categorization of media items, used by the AssetMenu
// browser and the host's media-listing API. String values match the
// host's database column conventions; do not change them without a
// migration.
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
