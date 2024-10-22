use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SeedVcPayload {
  #[serde(rename = "r")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub reference_media_file_token: Option<MediaFileToken>,
}