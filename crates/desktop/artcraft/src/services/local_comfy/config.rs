//! Local models: ComfyUI workflows (API format) described in `local_models.json` in ArtCraft's settings folder.
//!
//! Re-read on every request, so workflow and binding edits apply to the next generation; the model picker is
//! built when the app starts, so new or renamed models and changed picker options appear after a restart. Example:
//!
//! ```json
//! { "comfy_url": "http://127.0.0.1:8188",
//!   "models": [ { "id": "local_qwen_image_edit", "name": "Qwen Image Edit (local)",
//!                 "workflow": "workflows/qwen_edit_api.json",
//!                 "prompt": ["6", "prompt"], "seed": ["10", "seed"],
//!                 "images": [["4", "image"], ["5", "image"]], "output_node": "12",
//!                 "megapixels": ["13", "megapixels"], "resolutions": ["one_k", "two_k"] } ] }
//! ```
//!
//! Every model id must start with `local_`: that prefix is how a request is routed here instead of the API.
//! A relative `workflow` path is relative to the settings folder.
//! The model takes exactly as many reference images as it has `images` bindings.
//! Size: bind `width` + `height` (text-to-image latents) and/or `megapixels` (edit workflows that keep the source
//! shape); the picker then offers `aspect_ratios` / `resolutions` and writes the chosen size there.

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::SystemTime;

use log::{error, warn};
use once_cell::sync::Lazy;
use serde_derive::Deserialize;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;

use uuid_utils::uuid::generate_random_uuid;

use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;

pub const LOCAL_MODEL_PREFIX: &str = "local_";

/// Batch size offered when the workflow has a seed to vary (without one, every image would be the same).
pub const MAX_BATCH_SIZE: u16 = 4;

const DEFAULT_COMFY_URL: &str = "http://127.0.0.1:8188";

const COMFY_CLIENT_ID_PREFIX: &str = "artcraft-local-";

const DEFAULT_ASPECT_RATIOS: [CommonAspectRatio; 9] = [
  CommonAspectRatio::Square,
  CommonAspectRatio::WideFourByThree,
  CommonAspectRatio::WideThreeByTwo,
  CommonAspectRatio::WideSixteenByNine,
  CommonAspectRatio::WideTwentyOneByNine,
  CommonAspectRatio::TallThreeByFour,
  CommonAspectRatio::TallTwoByThree,
  CommonAspectRatio::TallNineBySixteen,
  CommonAspectRatio::TallNineByTwentyOne,
];

const DEFAULT_RESOLUTIONS: [CommonResolution; 3] = [CommonResolution::HalfK, CommonResolution::OneK, CommonResolution::TwoK];

const PREFERRED_DEFAULT_RESOLUTION: CommonResolution = CommonResolution::OneK;

/// Modification time of the config version whose problems were last logged: the file is read on every request,
/// but each problem is reported once per edit.
static LOGGED_VERSION: Lazy<Mutex<Option<SystemTime>>> = Lazy::new(|| Mutex::new(None));

/// A workflow input: (node id, input name).
pub type Binding = (String, String);

#[derive(Clone, Debug, Deserialize)]
pub struct LocalModelsConfig {
  #[serde(default = "default_comfy_url")]
  pub comfy_url: String,
  #[serde(default)]
  pub models: Vec<LocalModel>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct LocalModel {
  pub id: String,
  pub name: String,
  /// Path to the ComfyUI workflow in API format ("Export (API)"); made absolute when the config is loaded.
  pub workflow: PathBuf,
  /// One binding per reference image, in order (canvas, scene, then the other references).
  #[serde(default)]
  pub images: Vec<Binding>,
  #[serde(rename = "prompt")]
  pub maybe_prompt: Option<Binding>,
  #[serde(rename = "negative_prompt")]
  pub maybe_negative_prompt: Option<Binding>,
  #[serde(rename = "seed")]
  pub maybe_seed: Option<Binding>,
  /// Node whose images are the result. If absent, every saved ("output") image of the run is taken.
  #[serde(rename = "output_node")]
  pub maybe_output_node: Option<String>,
  /// Latent size inputs, set from the picker's aspect ratio and resolution.
  #[serde(rename = "width")]
  pub maybe_width: Option<Binding>,
  #[serde(rename = "height")]
  pub maybe_height: Option<Binding>,
  /// ImageScaleToTotalPixels-style input (units of 1024 x 1024 pixels), set from the picker's resolution.
  #[serde(rename = "megapixels")]
  pub maybe_megapixels: Option<Binding>,
  /// Aspect ratios offered in the picker (needs `width` and `height`). Default: the common set.
  #[serde(rename = "aspect_ratios")]
  pub maybe_aspect_ratios: Option<Vec<String>>,
  /// Resolutions offered in the picker (needs a size binding). Default: half_k, one_k, two_k.
  #[serde(rename = "resolutions")]
  pub maybe_resolutions: Option<Vec<String>>,
  #[serde(rename = "aspect_ratio_default")]
  pub maybe_aspect_ratio_default: Option<String>,
  #[serde(rename = "resolution_default")]
  pub maybe_resolution_default: Option<String>,
}

impl LocalModel {
  pub fn sets_shape(&self) -> bool {
    self.maybe_width.is_some() && self.maybe_height.is_some()
  }

  /// Aspect ratios for the picker; None when the workflow's shape cannot be set (or none are offered).
  pub fn aspect_ratio_options(&self) -> Option<Vec<CommonAspectRatio>> {
    let configured = self.maybe_aspect_ratios.as_ref().map(|names| known(names, CommonAspectRatio::from_str).0);
    options(self.sets_shape(), configured, &DEFAULT_ASPECT_RATIOS)
  }

  pub fn aspect_ratio_default(&self) -> Option<CommonAspectRatio> {
    let options = self.aspect_ratio_options()?;
    self.maybe_aspect_ratio_default.as_deref().and_then(|name| CommonAspectRatio::from_str(name).ok())
        .filter(|default| options.contains(default))
        .or_else(|| options.first().copied())
  }

  /// Resolutions for the picker; None when the workflow's size cannot be set (or none are offered).
  pub fn resolution_options(&self) -> Option<Vec<CommonResolution>> {
    let configured = self.maybe_resolutions.as_ref().map(|names| known(names, CommonResolution::from_str).0);
    options(self.sets_shape() || self.maybe_megapixels.is_some(), configured, &DEFAULT_RESOLUTIONS)
  }

  pub fn resolution_default(&self) -> Option<CommonResolution> {
    let options = self.resolution_options()?;
    self.maybe_resolution_default.as_deref().and_then(|name| CommonResolution::from_str(name).ok())
        .filter(|default| options.contains(default))
        .or_else(|| options.contains(&PREFERRED_DEFAULT_RESOLUTION).then_some(PREFERRED_DEFAULT_RESOLUTION))
        .or_else(|| options.first().copied())
  }

  pub fn max_batch_size(&self) -> u16 {
    if self.maybe_seed.is_some() { MAX_BATCH_SIZE } else { 1 }
  }

  /// Logs picker values ArtCraft does not know (they are left out of the picker).
  fn warn_unknown_values(&self) {
    let lists = [
      ("aspect_ratios", self.maybe_aspect_ratios.as_ref().map_or(vec![], |names| known(names, CommonAspectRatio::from_str).1)),
      ("resolutions", self.maybe_resolutions.as_ref().map_or(vec![], |names| known(names, CommonResolution::from_str).1)),
    ];
    for (key, unknown) in lists {
      if !unknown.is_empty() {
        warn!("local models: '{}' has unknown {} {:?}", self.id, key, unknown);
      }
    }
  }
}

pub fn is_local_model(model_id: &str) -> bool {
  model_id.starts_with(LOCAL_MODEL_PREFIX)
}

/// The configured models; an absent or unreadable file means "no local models" (logged, never fatal).
pub fn load_config(root: &AppDataRoot) -> LocalModelsConfig {
  let empty = LocalModelsConfig { comfy_url: default_comfy_url(), models: vec![] };
  let settings = root.settings_dir().path();
  let path = root.settings_dir().get_local_models_path();
  let text = match std::fs::read_to_string(&path) {
    Ok(text) => text,
    Err(err) if err.kind() == std::io::ErrorKind::NotFound => return empty,
    Err(err) => {
      if is_new_version(&path) {
        error!("local models: cannot read {:?} (it must be UTF-8): {}", path, err);
      }
      return empty;
    }
  };
  let log_problems = is_new_version(&path);
  // Windows editors often save UTF-8 with a byte-order mark, which serde_json rejects.
  let text = text.strip_prefix('\u{feff}').unwrap_or(&text);
  match serde_json::from_str::<LocalModelsConfig>(text) {
    Ok(mut config) => {
      config.models.retain(|m| {
        let ok = is_local_model(&m.id);
        if !ok && log_problems {
          warn!("local models: ignoring '{}' (ids must start with '{}')", m.id, LOCAL_MODEL_PREFIX);
        }
        ok
      });
      for model in &mut config.models {
        model.workflow = settings.join(&model.workflow); // no-op for absolute paths
        if log_problems {
          model.warn_unknown_values();
        }
      }
      config
    }
    Err(err) => {
      if log_problems {
        error!("local models: cannot parse {:?}: {}", path, err);
      }
      empty
    }
  }
}

pub fn find_model(root: &AppDataRoot, model_id: &str) -> Option<(LocalModelsConfig, LocalModel)> {
  let config = load_config(root);
  let model = config.models.iter().find(|m| m.id == model_id)?.clone();
  Some((config, model))
}

/// This install's ComfyUI client id: created once, then kept in the settings folder. Runs queued under it are
/// the ones this app may cancel after a restart; other apps sharing the ComfyUI are never touched.
pub fn comfy_client_id(root: &AppDataRoot) -> String {
  let path = root.settings_dir().get_local_comfy_client_id_path();
  if let Some(id) = std::fs::read_to_string(&path).ok().map(|id| id.trim().to_string()).filter(|id| !id.is_empty()) {
    return id;
  }
  let id = format!("{}{}", COMFY_CLIENT_ID_PREFIX, generate_random_uuid());
  if let Err(err) = std::fs::write(&path, &id) {
    warn!("local models: cannot save the ComfyUI client id to {:?}: {}", path, err);
  }
  id
}

/// Width / height ratio of a picker aspect ratio; None for the "auto" values (keep the workflow's shape).
pub fn aspect_ratio_value(aspect_ratio: CommonAspectRatio) -> Option<f64> {
  Some(match aspect_ratio {
    CommonAspectRatio::Square | CommonAspectRatio::SquareHd => 1.0,
    CommonAspectRatio::WideFiveByFour => 5.0 / 4.0,
    CommonAspectRatio::WideFourByThree => 4.0 / 3.0,
    CommonAspectRatio::WideThreeByTwo | CommonAspectRatio::Wide => 3.0 / 2.0,
    CommonAspectRatio::WideSixteenByNine => 16.0 / 9.0,
    CommonAspectRatio::WideTwentyOneByNine => 21.0 / 9.0,
    CommonAspectRatio::TallFourByFive => 4.0 / 5.0,
    CommonAspectRatio::TallThreeByFour => 3.0 / 4.0,
    CommonAspectRatio::TallTwoByThree | CommonAspectRatio::Tall => 2.0 / 3.0,
    CommonAspectRatio::TallNineBySixteen => 9.0 / 16.0,
    CommonAspectRatio::TallNineByTwentyOne => 9.0 / 21.0,
    CommonAspectRatio::Auto | CommonAspectRatio::Auto2k | CommonAspectRatio::Auto3k | CommonAspectRatio::Auto4k => return None,
  })
}

/// Pixel count of a picker resolution ("one_k" = 1024 x 1024).
pub fn resolution_pixels(resolution: CommonResolution) -> f64 {
  let (width, height): (f64, f64) = match resolution {
    CommonResolution::HalfK => (512.0, 512.0),
    CommonResolution::FourEightyP => (854.0, 480.0),
    CommonResolution::SevenTwentyP => (1280.0, 720.0),
    CommonResolution::OneK => (1024.0, 1024.0),
    CommonResolution::TenEightyP => (1920.0, 1080.0),
    CommonResolution::TwoK => (2048.0, 2048.0),
    CommonResolution::ThreeK => (3072.0, 3072.0),
    CommonResolution::FourK => (4096.0, 4096.0),
  };
  width * height
}

/// Width and height (multiples of 16) for a ratio and a pixel budget.
pub fn size_for(ratio: f64, pixels: f64) -> (u32, u32) {
  let round16 = |v: f64| ((v / 16.0).round() as u32).max(1) * 16;
  (round16((pixels * ratio).sqrt()), round16((pixels / ratio).sqrt()))
}

/// True the first time a given version (modification time) of the config file is loaded.
fn is_new_version(path: &Path) -> bool {
  let modified = std::fs::metadata(path).and_then(|meta| meta.modified()).ok();
  let Ok(mut logged) = LOGGED_VERSION.lock() else { return true };
  let is_new = *logged != modified;
  *logged = modified;
  is_new
}

fn options<T: Copy>(bound: bool, configured: Option<Vec<T>>, defaults: &[T]) -> Option<Vec<T>> {
  if !bound {
    return None;
  }
  let list = configured.unwrap_or_else(|| defaults.to_vec());
  (!list.is_empty()).then_some(list)
}

/// Splits configured names into the values ArtCraft knows and the unknown names.
fn known<'a, T, E>(names: &'a [String], parse: fn(&str) -> Result<T, E>) -> (Vec<T>, Vec<&'a str>) {
  let mut values = Vec::new();
  let mut unknown = Vec::new();
  for name in names {
    match parse(name) {
      Ok(value) => values.push(value),
      Err(_) => unknown.push(name.as_str()),
    }
  }
  (values, unknown)
}

fn default_comfy_url() -> String {
  DEFAULT_COMFY_URL.to_string()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn sizes() {
    let one_k = resolution_pixels(CommonResolution::OneK);
    assert_eq!(size_for(1.0, one_k), (1024, 1024));
    assert_eq!(size_for(aspect_ratio_value(CommonAspectRatio::WideSixteenByNine).unwrap(), one_k), (1360, 768));
    assert_eq!(size_for(aspect_ratio_value(CommonAspectRatio::TallTwoByThree).unwrap(), one_k), (832, 1248));
    assert!(aspect_ratio_value(CommonAspectRatio::Auto).is_none());
  }

  mod picker_tests {
    use super::*;

    #[test]
    fn offers_only_what_the_workflow_can_set() {
      let mut model = model();
      assert_eq!(model.aspect_ratio_options(), None);
      assert_eq!(model.resolution_options(), None);
      assert_eq!(model.max_batch_size(), 1);

      model.maybe_megapixels = Some(("13".into(), "megapixels".into()));
      assert_eq!(model.aspect_ratio_options(), None);
      assert_eq!(model.resolution_default(), Some(CommonResolution::OneK));

      model.maybe_width = Some(("10".into(), "width".into()));
      model.maybe_height = Some(("10".into(), "height".into()));
      model.maybe_seed = Some(("11".into(), "seed".into()));
      assert_eq!(model.aspect_ratio_default(), Some(CommonAspectRatio::Square));
      assert_eq!(model.max_batch_size(), MAX_BATCH_SIZE);
    }

    #[test]
    fn drops_unknown_and_empty_lists() {
      let mut model = model();
      model.maybe_width = Some(("10".into(), "width".into()));
      model.maybe_height = Some(("10".into(), "height".into()));
      model.maybe_aspect_ratios = Some(vec!["16:9".into(), "tall_two_by_three".into()]);
      model.maybe_aspect_ratio_default = Some("square".into()); // not offered: the first offered value wins
      assert_eq!(model.aspect_ratio_options(), Some(vec![CommonAspectRatio::TallTwoByThree]));
      assert_eq!(model.aspect_ratio_default(), Some(CommonAspectRatio::TallTwoByThree));

      // An empty list means "not offered", never a panic.
      model.maybe_aspect_ratios = Some(vec![]);
      model.maybe_resolutions = Some(vec!["1k".into()]);
      assert_eq!(model.aspect_ratio_default(), None);
      assert_eq!(model.resolution_default(), None);
    }
  }

  fn model() -> LocalModel {
    serde_json::from_str(r#"{ "id": "local_test", "name": "Test", "workflow": "w.json" }"#).unwrap()
  }
}
