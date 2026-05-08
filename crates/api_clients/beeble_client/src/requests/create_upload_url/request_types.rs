use serde_derive::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct CreateUploadUrlRequestBody {
  pub filename: String,
}

#[derive(Deserialize, Debug)]
pub struct CreateUploadUrlResponseBody {
  pub id: String,
  pub upload_url: String,
  pub beeble_uri: String,
}
