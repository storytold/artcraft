use serde_derive::Deserialize;

#[derive(Deserialize, Debug)]
pub(crate) struct VideoStatusResponseBody {
  pub status: String,

  pub progress: Option<u8>,

  pub model: Option<String>,

  pub video: Option<VideoStatusVideo>,

  pub error: Option<VideoStatusError>,

  pub usage: Option<VideoStatusUsage>,
}

#[derive(Deserialize, Debug)]
pub(crate) struct VideoStatusVideo {
  pub url: Option<String>,
  pub duration: Option<u32>,
  pub respect_moderation: Option<bool>,
}

#[derive(Deserialize, Debug)]
pub(crate) struct VideoStatusError {
  pub code: String,
  pub message: String,
}

#[derive(Deserialize, Debug)]
pub(crate) struct VideoStatusUsage {
  pub cost_in_usd_ticks: Option<u64>,
}
