
// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum GenerationProvider {
  Artcraft = "artcraft",
  Grok = "grok",
  Midjourney = "midjourney",
  Sora = "sora",
  WorldLabs = "world_labs",
  Fal = "fal",
  WaveSpeed = "wavespeed",
  Higgsfield = "higgsfield",
  Krea = "krea",
  Leonardo = "leonardo",
  Magnific = "magnific",
  Openart = "openart",
  Picsart = "picsart",
  Pixverse = "pixverse",
  Runway = "runway",
}
