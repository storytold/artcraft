use serde::Serialize;

#[derive(Serialize)]
pub (super) struct CreateMediaPostWireRequest {
  #[serde(rename = "mediaType")]
  pub (super) media_type: String,

  #[serde(rename = "mediaUrl")]
  pub (super) media_url: String,
}
