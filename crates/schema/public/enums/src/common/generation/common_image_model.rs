use utoipa::ToSchema;

/// Image models available for generation.
/// Mirrors artcraft_router::api::common_image_model::CommonImageModel.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonImageModel {
  #[serde(rename = "nano_banana_pro")]
  NanaBananaPro,
}
