//! Create Image (`TextToImage` + `PromptBoxImage`): prompt, reference images, model, aspect
//! ratio, resolution, quality and count; the cost; and the image feed.

use egui::{Id, Ui};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::backend::wire::Prompt;
use crate::backend::{EnqueueMeta, Modality};
use crate::feed::store::FeedStore;
use crate::feed::types::MediaKind;
use crate::models::{DEFAULT_IMAGE_MODEL, DEFAULT_PROMPT_MAX, ModelInfo};
use crate::pages::common::{self, AppRequest, CostState, Env};
use crate::pages::toolbar;
use crate::prompt_box::deck::{DeckAction, DeckLimits};
use crate::prompt_box::model_selector::model_selector;
use crate::prompt_box::refs::{ImageSlot, RefKind, RefMedia, References};
use crate::prompt_box::{self, DeckMode, PromptBoxAction, PromptBoxProps, PromptBoxState, editor};

const PLACEHOLDER: &str = "Describe what you want in the image...";

/// What the page remembers between launches.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct ImageSettings {
  pub prompt: String,
  pub model: Option<String>,
  pub aspect_ratio: Option<String>,
  pub resolution: Option<String>,
  pub quality: Option<String>,
  pub count: u16,
}

#[derive(Default)]
pub struct CreateImagePage {
  pub settings: ImageSettings,
  pub refs: References,
  pub feed: FeedStore,
  pub cost: CostState,
  pub generating: bool,
  box_state: PromptBoxState,
  box_height: f32,
}

impl CreateImagePage {
  pub fn new(settings: ImageSettings) -> Self {
    let mut page = Self { settings, box_height: 140.0, ..Default::default() };
    page.box_state.editor.focus_requested = true;
    page
  }

  pub fn ui(&mut self, ui: &mut Ui, env: &mut Env<'_>) {
    let models = &env.catalog.image_page;
    let model = common::selected_model(models, self.settings.model.as_deref(), DEFAULT_IMAGE_MODEL).cloned();
    if let Some(m) = &model {
      self.reconcile(m);
      let fields = self.fields(m, true);
      self.cost.update(ui, env.backend, Modality::Image, &fields);
    }
    let mut feed = std::mem::take(&mut self.feed);
    let mut box_height = self.box_height;
    common::create_shell(ui, env, MediaKind::Image, "Create Image", "Add a prompt, then generate", &mut feed, &mut box_height, |ui, env| self.prompt_box(ui, env, model.as_ref()));
    self.feed = feed;
    self.box_height = box_height;
  }

  fn prompt_box(&mut self, ui: &mut Ui, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    let max_images = model.map_or(0, |m| m.image_refs_max);
    let deck = if max_images > 0 { DeckMode::References(DeckLimits { max_images, max_videos: 0, max_video_secs: None, max_audios: 0, max_audio_secs: None, library: env.signed_in }) } else { DeckMode::None };
    let accepts: &[RefKind] = if max_images > 0 { &[RefKind::Image] } else { &[] };
    let prompt_max = model.map_or(Some(DEFAULT_PROMPT_MAX), |m| m.prompt_max);
    let props = PromptBoxProps { id: Id::new("image-prompt-box"), placeholder: PLACEHOLDER, enter_to_generate: env.enter_to_generate, mentions: &[], max_length: Some(prompt_max), deck, accepts, credits: self.cost.credits, generate_enabled: !self.settings.prompt.trim().is_empty() && model.is_some(), generating: self.generating, generate_tooltip: "Generate", warning: None, banner: None };
    let models = &env.catalog.image_page;
    let settings = &mut self.settings;
    let mut picked_model = None;
    let mut left = |ui: &mut Ui| {
      if let Some(id) = model_selector(ui, Id::new("image-model"), models, model, false) {
        picked_model = Some(id);
      }
      let Some(m) = model else {
        return;
      };
      let aspect = ModelInfo::resolve(settings.aspect_ratio.as_deref(), &m.aspect_ratios, m.aspect_default.as_ref());
      if let Some(v) = toolbar::aspect_ratio(ui, Id::new("image-aspect"), m, aspect.as_deref().unwrap_or("")) {
        settings.aspect_ratio = Some(v);
      }
      let resolution = ModelInfo::resolve(settings.resolution.as_deref(), &m.resolutions, m.resolution_default.as_ref());
      if let Some(v) = toolbar::resolution(ui, Id::new("image-resolution"), m, resolution.as_deref().unwrap_or("")) {
        settings.resolution = Some(v);
      }
      let quality = ModelInfo::resolve(settings.quality.as_deref(), &m.qualities, m.quality_default.as_ref());
      if let Some(v) = toolbar::quality(ui, Id::new("image-quality"), m, quality.as_deref().unwrap_or("")) {
        settings.quality = Some(v);
      }
    };
    let count = settings.count;
    let mut picked_count = None;
    let mut right = |ui: &mut Ui| {
      if let Some(m) = model {
        picked_count = toolbar::count(ui, Id::new("image-count"), m, count, "images");
      }
    };
    let actions = prompt_box::show(ui, &mut settings.prompt, &self.refs, &mut self.box_state, &props, env.cache, &mut left, &mut right);
    if let Some(id) = picked_model {
      self.settings.model = Some(id);
    }
    if let Some(n) = picked_count {
      self.settings.count = n;
    }
    for action in actions {
      self.handle(action, env, model, max_images);
    }
  }

  fn handle(&mut self, action: PromptBoxAction, env: &mut Env<'_>, model: Option<&ModelInfo>, max_images: usize) {
    match action {
      PromptBoxAction::Generate => self.generate(env, model),
      PromptBoxAction::ClearAll => {
        self.settings.prompt.clear();
        self.refs.clear();
      },
      PromptBoxAction::Deck(deck) => match deck {
        DeckAction::Upload { .. } => {
          let free = max_images.saturating_sub(self.refs.images.len());
          for path in common::pick_files(&[RefKind::Image], free > 1).into_iter().take(free) {
            common::upload_path(env, &mut self.refs, &path, RefKind::Image, ImageSlot::Reference);
          }
        },
        DeckAction::Library { kind, slot } => {
          env.requests.push(AppRequest::PickFromLibrary { kind, slot, max: max_images.saturating_sub(self.refs.images.len()).max(1), page: MediaKind::Image });
        },
        DeckAction::Remove(id) => self.refs.remove(id),
        DeckAction::ClearAll => self.refs.images.clear(),
        DeckAction::ReorderImages { from, to } => {
          let item = self.refs.images.remove(from);
          self.refs.images.insert(to.min(self.refs.images.len()), item);
        },
        DeckAction::Preview(id) => {
          if let Some(url) = self.refs.find_mut(id).and_then(|r| r.full_url.clone().or_else(|| r.preview.clone())) {
            env.requests.push(AppRequest::Preview(url));
          }
        },
        DeckAction::SwapFrames => {},
      },
      PromptBoxAction::DroppedFiles(paths) => self.add_dropped(env, &paths, max_images),
      PromptBoxAction::MentionPicked(..) => {},
      PromptBoxAction::PastedImage(png) => {
        if self.refs.images.len() >= max_images {
          env.toasts.error(max_images_message(max_images));
        } else {
          common::upload_png(env, &mut self.refs, png, ImageSlot::Reference);
        }
      },
    }
  }

  /// Routes dropped files: images into the deck (up to the model's limit); others get a note.
  fn add_dropped(&mut self, env: &mut Env<'_>, paths: &[std::path::PathBuf], max_images: usize) {
    let kinds: Vec<Option<RefKind>> = paths.iter().map(|p| RefKind::from_path(p)).collect();
    let images: Vec<&std::path::PathBuf> = paths.iter().zip(&kinds).filter(|(_, k)| **k == Some(RefKind::Image)).map(|(p, _)| p).collect();
    let has_video = kinds.contains(&Some(RefKind::Video));
    let has_audio = kinds.contains(&Some(RefKind::Audio));
    if has_video || has_audio {
      let what = match (has_video, has_audio) {
        (true, true) => "Video or audio",
        (true, false) => "Video",
        _ => "Audio",
      };
      env.toasts.error(format!("{what} references aren't available here"));
    } else if images.is_empty() {
      env.toasts.error("Only image files can be added here");
    }
    if images.is_empty() {
      return;
    }
    let free = max_images.saturating_sub(self.refs.images.len());
    if free == 0 {
      env.toasts.error(max_images_message(max_images));
      return;
    }
    for path in images.into_iter().take(free) {
      common::upload_path(env, &mut self.refs, path, RefKind::Image, ImageSlot::Reference);
    }
  }

  fn generate(&mut self, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    if self.generating || self.settings.prompt.trim().is_empty() {
      return;
    }
    let Some(model) = model else {
      return;
    };
    if !env.signed_in {
      env.requests.push(AppRequest::SignIn);
      return;
    }
    let limit = model.prompt_max;
    if editor::is_over_limit(&self.settings.prompt, limit) {
      env.toasts.error(format!("Prompt exceeds the {} character limit for this model", limit.unwrap_or_default()));
      return;
    }
    if self.refs.any_uploading() {
      env.toasts.error("Please wait for your references to finish uploading");
      return;
    }
    self.generating = true;
    let meta = EnqueueMeta { prompt: self.settings.prompt.clone(), model_id: model.id.clone(), batch_count: u32::from(self.settings.count.max(1)), ref_image: self.refs.images.first().and_then(|r| r.preview.clone()) };
    env.backend.generate(Modality::Image, self.fields(model, false), meta);
  }

  /// The OmniGen request (`GenerateImageRequest` after `api_fields`). `estimate` swaps
  /// still-uploading references for placeholders so the cost reflects them.
  fn fields(&self, model: &ModelInfo, estimate: bool) -> Map<String, Value> {
    let mut f = Map::new();
    f.insert("model".into(), json!(model.id));
    f.insert("prompt".into(), json!(self.settings.prompt));
    f.insert("image_batch_count".into(), json!(model.valid_batch(self.settings.count)));
    if let Some(v) = ModelInfo::resolve(self.settings.aspect_ratio.as_deref(), &model.aspect_ratios, model.aspect_default.as_ref()) {
      f.insert("aspect_ratio".into(), json!(v));
    }
    if !model.resolutions.is_empty() {
      if let Some(v) = ModelInfo::resolve(self.settings.resolution.as_deref(), &model.resolutions, model.resolution_default.as_ref()) {
        f.insert("resolution".into(), json!(v));
      }
    }
    if !model.qualities.is_empty() {
      if let Some(v) = ModelInfo::resolve(self.settings.quality.as_deref(), &model.qualities, model.quality_default.as_ref()) {
        f.insert("quality".into(), json!(v));
      }
    }
    if model.image_refs_max > 0 && !self.refs.images.is_empty() {
      let tokens: Vec<String> = self.refs.images.iter().enumerate().filter_map(|(i, r)| r.token.clone().or_else(|| estimate.then(|| format!("mf_estimate_{i}")))).collect();
      if !tokens.is_empty() {
        f.insert("image_media_tokens".into(), json!(tokens));
      }
    }
    if estimate {
      f.remove("prompt");
    }
    f
  }

  /// Keeps the count valid for the model (`isValidGenerationCount`).
  fn reconcile(&mut self, model: &ModelInfo) {
    let count = model.valid_batch(self.settings.count);
    if count != self.settings.count {
      self.settings.count = count;
    }
  }

  pub fn on_enqueued(&mut self, env: &mut Env<'_>, job_tokens: &[String], meta: &EnqueueMeta) {
    self.generating = false;
    self.feed.add_enqueued(MediaKind::Image, job_tokens, meta, env.catalog);
    env.toasts.success("Image generation enqueued!");
  }

  pub fn on_enqueue_failed(&mut self, env: &mut Env<'_>, message: &str) {
    self.generating = false;
    env.toasts.error(if message.is_empty() { "Failed to start image generation. Please try again." } else { message });
  }

  /// Recreate: the original prompt, model, settings and reference images.
  pub fn apply_prompt(&mut self, prompt: &Prompt) {
    self.settings.prompt = prompt.maybe_positive_prompt.clone().unwrap_or_default();
    if let Some(model) = &prompt.maybe_model_type {
      self.settings.model = Some(model.clone());
    }
    if prompt.maybe_aspect_ratio.is_some() {
      self.settings.aspect_ratio = prompt.maybe_aspect_ratio.clone();
    }
    if prompt.maybe_resolution.is_some() {
      self.settings.resolution = prompt.maybe_resolution.clone();
    }
    if let Some(count) = prompt.maybe_batch_count {
      self.settings.count = count;
    }
    self.refs.images = prompt.maybe_context_images.iter().flatten().filter(|c| !matches!(c.semantic.as_str(), "vid_end_frame" | "vid_ref" | "audioref")).map(|c| RefMedia::from_library(RefKind::Image, c.media_token.clone(), c.media_links.thumbnail(256), Some(c.media_links.cdn_url.clone()), 0.0)).collect();
    self.box_state.editor.focus_requested = true;
  }
}

fn max_images_message(max: usize) -> String {
  format!("Max {max} image reference{}", if max == 1 { "" } else { "s" })
}
