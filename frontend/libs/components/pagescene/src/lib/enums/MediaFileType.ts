export enum MediaFileType {
  Audio = "audio",
  Video = "video",
  Image = "image",

  // BVH is a very popular file format for motion capture.
  // It is compatible with our engine.
  BVH = "bvh",

  // GLTF is the text-based format of GLB. Unforunately it requires a
  // second file to include the visual data, so we strongly discourage
  // the use of this format in favor of GLB.
  GLTF = "gltf",

  // GLB is the format we convert FBX files into. It's a very popular
  // open source 3D file format.
  GLB = "glb",

  // SPLAT file type. SPZ format is a compressed and smaller format.
  SPZ = "spz",

  // MMD is the format for anime characters.
  // open source 3D file format.
  MMD = "mmd",

  // FBX isn't supported by Storyteller Engine, but we can get
  // uploads in this format. It's a very popular 3D graphics format.
  FBX = "fbx",

  // Full Storyteller Engine scenes (RON = Rusty Object Notation)
  // This is a temporary format that will eventually go away.
  Scene = "scene",

  None = "none",
}

