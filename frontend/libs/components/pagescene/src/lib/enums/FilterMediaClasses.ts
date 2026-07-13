// Media class filter (audio / image / video / 3D classes). Used in
// asset browsing and weight-listing queries.
export enum FilterMediaClasses {
  AUDIO = "audio",
  IMAGE = "image",
  VIDEO = "video",
  // Deprecated pre-split 3D class; rows persist until the backfill lands.
  DIMENSIONAL = "dimensional",
  MESH = "mesh",
  SPLAT = "splat",
}
