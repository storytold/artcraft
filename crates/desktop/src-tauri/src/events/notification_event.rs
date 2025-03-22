use serde::Serialize;

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationModelType {
  ImageSegmentation,
  TextEncoder,
  TextTokenizer,
  Unet,
  Vae,
  Json,
  ClipEncoder,
  FluxModel,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationEvent<'a> {
  ModelDownloadStarted {
    model_name: &'a str, 
    model_type: NotificationModelType,
  },
  ModelDownloadProgress {
    model_name: &'a str,
    model_type: NotificationModelType,
    currently_downloaded_bytes: usize,
    total_file_bytes: usize,
  },
  ModelDownloadComplete {
    model_name: &'a str,
    model_type: NotificationModelType,
  },
  ModelLoading {
    model_name: String,
    model_type: NotificationModelType,
  },
  ModelInference {
    model_name: String,
    model_type: NotificationModelType,
  },
  ModelInferenceComplete {
    model_name: String,
    model_type: NotificationModelType,
  },
}
