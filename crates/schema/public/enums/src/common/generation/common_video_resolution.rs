use utoipa::ToSchema;

/// Common video resolutions.
/// Mirrors artcraft_router::api::common_resolution::CommonVideoResolution.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
}
