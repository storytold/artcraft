use utoipa::ToSchema;

/// Splat models available for generation.
/// Mirrors artcraft_router::api::common_splat_model::CommonSplatModel.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonSplatModel {
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,

  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,
}
