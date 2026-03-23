use utoipa::ToSchema;

/// Common video resolutions.
/// Mirrors artcraft_router::api::common_resolution::CommonResolution.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
  
  // TODO: Add 480p(?), 720p(?), 1080p, etc. as there are some models that use these
}
