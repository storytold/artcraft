use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

/// Desktop metadata is local. Everything else is an API-owned field, including
/// model IDs and option strings introduced after this version of the app.
#[derive(Clone, Deserialize, Serialize)]
pub struct OmniRequest {
  pub provider: Option<GenerationProvider>,
  pub frontend_caller: Option<TauriCommandCaller>,
  pub frontend_subscriber_id: Option<String>,
  pub frontend_subscriber_payload: Option<String>,
  #[serde(flatten)]
  pub fields: Map<String, Value>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Modality {
  Image,
  Video,
  Mesh,
  Splat,
  Audio,
}

impl OmniRequest {
  pub fn uses_artcraft(&self) -> bool {
    // Native Grok is deliberately disabled, including calls from old UI state.
    self.model().is_some_and(|model| model.starts_with("grok_")) || matches!(self.provider, None | Some(GenerationProvider::Artcraft | GenerationProvider::Grok))
  }

  pub fn model(&self) -> Option<&str> {
    self.fields.get("model").and_then(Value::as_str)
  }

  pub fn uses_legacy_image_endpoint(&self) -> bool {
    // These desktop editor integrations still have dedicated request shapes.
    // Catalog models, including any future ID, use Omni by default.
    matches!(self.model(), Some("recraft_3" | "flux_pro_kontext_max" | "flux_dev_juggernaut" | "flux_pro_1" | "midjourney"))
  }

  pub fn api_fields(&self, modality: Modality) -> Map<String, Value> {
    let mut fields = self.fields.clone();
    if let Some(model) = self.model() {
      fields.insert("model".into(), Value::String(canonical_model_id(model).into()));
    }
    match modality {
      Modality::Image => rename_field(&mut fields, "batch_size", "image_batch_count"),
      Modality::Video => {
        rename_field(&mut fields, "image_media_token", "start_frame_image_media_token");
        fields.remove("sora_orientation");
        fields.remove("grok_aspect_ratio");
      },
      Modality::Splat => rename_field(&mut fields, "image_media_tokens", "reference_image_media_tokens"),
      Modality::Mesh => {
        if let Some(token) = fields.remove("image_media_token").filter(|v| !v.is_null()) {
          fields.entry("reference_image_media_tokens").or_insert(Value::Array(vec![token]));
        }
      },
      Modality::Audio => {},
    }
    // These belong to the old pricing endpoint, not Omni generation or pricing.
    fields.remove("generation_mode");
    fields
  }
}

impl Modality {
  pub fn as_str(self) -> &'static str {
    match self {
      Self::Image => "image",
      Self::Video => "video",
      Self::Mesh => "mesh",
      Self::Splat => "splat",
      Self::Audio => "audio",
    }
  }

  pub fn task_type(self) -> TaskType {
    match self {
      Self::Image => TaskType::ImageGeneration,
      Self::Video => TaskType::VideoGeneration,
      Self::Mesh => TaskType::ObjectGeneration,
      Self::Splat => TaskType::GaussianGeneration,
      Self::Audio => TaskType::AudioGeneration,
    }
  }
}

fn rename_field(fields: &mut Map<String, Value>, old: &str, new: &str) {
  if let Some(value) = fields.remove(old).filter(|v| !v.is_null()) {
    if fields.get(new).is_none_or(Value::is_null) {
      fields.insert(new.into(), value);
    }
  }
}

// Compatibility for persisted desktop settings and existing editor callers.
// Unknown IDs pass through unchanged; this is not a model allowlist.
fn canonical_model_id(model: &str) -> &str {
  match model {
    "flux_pro_11" => "flux_pro_1p1",
    "flux_pro_11_ultra" => "flux_pro_1p1_ultra",
    "gemini_25_flash" => "nano_banana",
    "grok_image" => "grok_imagine_image",
    "grok_video" => "grok_imagine_video",
    "kling_1.6_pro" => "kling_1p6_pro",
    "kling_2.1_pro" => "kling_2p1_pro",
    "kling_2.1_master" => "kling_2p1_master",
    "seedance_1.0_lite" => "seedance_1p0_lite",
    "hunyuan_3d_2" | "hunyuan_3d_2_0" => "hunyuan_3d_2p0",
    "hunyuan_3d_2_1" => "hunyuan_3d_2p1",
    "world_labs_marble" | "worldlabs_marble" => "marble_0p1_plus",
    _ => model,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn future_model_and_options_survive_without_desktop_metadata() {
    let request: OmniRequest = serde_json::from_value(json!({
      "model": "future_video_v9", "resolution": "eight_k", "bitrate": "ultra",
      "duration_seconds": 30, "generate_audio": false, "new_option": {"value": 1},
      "estimate_only": {"total_input_video_duration_millis": 7250},
      "frontend_subscriber_id": "local-only"
    }))
    .unwrap();
    let fields = request.api_fields(Modality::Video);
    assert_eq!(fields["model"], "future_video_v9");
    assert_eq!(fields["resolution"], "eight_k");
    assert_eq!(fields["bitrate"], "ultra");
    assert_eq!(fields["duration_seconds"], 30);
    assert_eq!(fields["generate_audio"], false);
    assert_eq!(fields["new_option"]["value"], 1);
    assert_eq!(fields["estimate_only"]["total_input_video_duration_millis"], 7250);
    assert!(!fields.contains_key("frontend_subscriber_id"));
    assert!(!fields.contains_key("provider"));
  }

  #[test]
  fn grok_uses_artcraft_even_with_a_saved_native_provider() {
    let request: OmniRequest = serde_json::from_value(json!({
      "model": "grok_video", "provider": "grok"
    }))
    .unwrap();
    assert!(request.uses_artcraft());
    assert_eq!(request.api_fields(Modality::Video)["model"], "grok_imagine_video");
  }

  #[test]
  fn legacy_mesh_and_splat_inputs_use_omni_field_names() {
    let mesh: OmniRequest = serde_json::from_value(json!({
      "model": "hunyuan_3d_2_0", "image_media_token": "mf_mesh_input"
    }))
    .unwrap();
    let fields = mesh.api_fields(Modality::Mesh);
    assert_eq!(fields["model"], "hunyuan_3d_2p0");
    assert_eq!(fields["reference_image_media_tokens"], json!(["mf_mesh_input"]));
    assert!(!fields.contains_key("image_media_token"));

    let splat: OmniRequest = serde_json::from_value(json!({
      "model": "world_labs_marble", "image_media_tokens": ["mf_splat_input"]
    }))
    .unwrap();
    let fields = splat.api_fields(Modality::Splat);
    assert_eq!(fields["model"], "marble_0p1_plus");
    assert_eq!(fields["reference_image_media_tokens"], json!(["mf_splat_input"]));
  }

  #[test]
  fn future_model_ids_survive_storage_and_event_serialization() {
    use crate::core::events::generation_events::common::GenerationModel;
    use enums::tauri::tasks::task_model_type::TaskModelType;

    let stored = TaskModelType::from_str("future_model_v99").unwrap();
    let event = GenerationModel::Unknown(stored.to_str().to_owned());
    assert_eq!(serde_json::to_value(event).unwrap(), json!("future_model_v99"));
    // Keep existing event strings compatible with old history.
    assert_eq!(serde_json::to_value(GenerationModel::FluxPro11).unwrap(), json!("flux_pro_1.1"));
  }
}
