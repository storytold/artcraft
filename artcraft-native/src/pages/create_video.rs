//! Create Video (`ImageToVideo` + `PromptBoxVideo`): keyframe or omni-reference input, the
//! model's pickers (aspect ratio, resolution, bitrate, format, duration, sound, count), the cost,
//! and the video feed.

use std::path::PathBuf;

use egui::{Id, Ui};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::backend::wire::Prompt;
use crate::backend::{EnqueueMeta, Modality};
use crate::feed::store::FeedStore;
use crate::feed::types::MediaKind;
use crate::models::{self, DEFAULT_PROMPT_MAX, DEFAULT_VIDEO_MODEL, ModelInfo};
use crate::pages::common::{self, AppRequest, CostState, Env};
use crate::pages::toolbar;
use crate::prompt_box::deck::{DeckAction, DeckLimits};
use crate::prompt_box::editor::{self, MentionItem, MentionKind};
use crate::prompt_box::model_selector::model_selector;
use crate::prompt_box::pickers::{self, PickOption, Trigger};
use crate::prompt_box::refs::{ImageSlot, RefKind, RefMedia, References};
use crate::prompt_box::{self, DeckMode, PromptBoxAction, PromptBoxProps, PromptBoxState};
use crate::ui::icons::Icon;
use crate::ui::widgets::Leading;

const PLACEHOLDER: &str = "Describe what you want to happen in the video...";
const PLACEHOLDER_REFERENCE: &str = "Use @Image1, @Video1, @Audio1... to reference uploads in prompt...";
const TEXT_ONLY_BANNER: &str = "This model can't generate from text alone - add a starting frame to animate your prompt.";

/// How the user steers the video: first/last frames, or a mix of reference media.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum InputMode {
  Keyframe,
  #[default]
  Reference,
}

/// What the page remembers between launches.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct VideoSettings {
  pub prompt: String,
  pub model: Option<String>,
  pub aspect_ratio: Option<String>,
  pub resolution: Option<String>,
  pub bitrate: Option<String>,
  pub output_format: Option<String>,
  pub duration: Option<u16>,
  pub generate_audio: bool,
  pub input_mode: InputMode,
  pub count: u16,
}

impl Default for VideoSettings {
  fn default() -> Self {
    Self { prompt: String::new(), model: None, aspect_ratio: None, resolution: None, bitrate: None, output_format: None, duration: None, generate_audio: true, input_mode: InputMode::Reference, count: 1 }
  }
}

#[derive(Default)]
pub struct CreateVideoPage {
  pub settings: VideoSettings,
  pub refs: References,
  pub feed: FeedStore,
  pub cost: CostState,
  pub generating: bool,
  box_state: PromptBoxState,
  box_height: f32,
  /// Which character each mentioned name means, when the user picked one explicitly.
  character_picks: std::collections::HashMap<String, String>,
}

impl CreateVideoPage {
  pub fn new(settings: VideoSettings) -> Self {
    let mut page = Self { settings, box_height: 140.0, ..Default::default() };
    page.box_state.editor.focus_requested = true;
    page
  }

  pub fn ui(&mut self, ui: &mut Ui, env: &mut Env<'_>) {
    let model = common::selected_model(&env.catalog.video_page, self.settings.model.as_deref(), DEFAULT_VIDEO_MODEL).cloned();
    if let Some(m) = &model {
      self.reconcile(m);
      let fields = self.fields(m, true);
      self.cost.update(ui, env.backend, Modality::Video, &fields);
    }
    let mut feed = std::mem::take(&mut self.feed);
    let mut box_height = self.box_height;
    common::create_shell(ui, env, MediaKind::Video, "Create Video", "Choose an image, add a prompt, then generate", &mut feed, &mut box_height, |ui, env| self.prompt_box(ui, env, model.as_ref()));
    self.feed = feed;
    self.box_height = box_height;
  }

  fn prompt_box(&mut self, ui: &mut Ui, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    let mode = self.settings.input_mode;
    let reference = mode == InputMode::Reference;
    let limits = model.map(|m| deck_limits(m, env.signed_in));
    let deck = match (model, mode) {
      (Some(m), InputMode::Keyframe) if m.start_frame => DeckMode::Keyframes { show_last: m.end_frame, library: env.signed_in },
      (Some(_), InputMode::Reference) => limits.clone().map_or(DeckMode::None, DeckMode::References),
      _ => DeckMode::None,
    };
    let accepts: Vec<RefKind> = match (&deck, model) {
      (DeckMode::Keyframes { .. }, _) => vec![RefKind::Image],
      (DeckMode::References(l), _) => [(RefKind::Image, l.max_images), (RefKind::Video, l.max_videos), (RefKind::Audio, l.max_audios)].into_iter().filter(|(_, n)| *n > 0).map(|(k, _)| k).collect(),
      _ => Vec::new(),
    };
    let characters_on = model.is_some_and(supports_characters);
    let mut mentions = if reference { self.mentions() } else { Vec::new() };
    if characters_on {
      mentions.extend(editor::character_mentions(env.characters.iter().map(|c| (c.name.as_str(), c.token.as_str(), c.avatar_url()))));
    }
    let needs_start = model.is_some_and(|m| self.needs_start_frame(m));
    let banner = model.filter(|m| !m.text_to_video && !self.has_image_input()).map(|_| TEXT_ONLY_BANNER);
    let props = PromptBoxProps { id: Id::new("video-prompt-box"), placeholder: if reference { PLACEHOLDER_REFERENCE } else { PLACEHOLDER }, enter_to_generate: env.enter_to_generate, mentions: &mentions, max_length: Some(model.map_or(Some(DEFAULT_PROMPT_MAX), |m| m.prompt_max)), deck, accepts: &accepts, credits: self.cost.credits, generate_enabled: !self.settings.prompt.trim().is_empty() && model.is_some() && !needs_start, generating: self.generating, generate_tooltip: if needs_start { "Add a starting image before generating" } else { "Generate" }, warning: needs_start.then_some("Starting frame required"), banner };

    let models = &env.catalog.video_page;
    let mut prompt = std::mem::take(&mut self.settings.prompt);
    let count = self.settings.count;
    let settings = &mut self.settings;
    let with_refs = reference && !self.refs.images.is_empty();
    let mut picked_model = None;
    let mut picked_mode = None;
    let mut open_characters = false;
    let mut left = |ui: &mut Ui| {
      if let Some(id) = model_selector(ui, Id::new("video-model"), models, model, true) {
        picked_model = Some(id);
      }
      if let Some(m) = model {
        picked_mode = video_toolbar(ui, m, settings, with_refs).or(picked_mode);
        if characters_on && crate::prompt_box::pickers::toggle(ui, Id::new("video-characters"), Icon::User, "@Characters", false, "Characters") {
          open_characters = true;
        }
      }
    };
    let mut picked_count = None;
    let mut right = |ui: &mut Ui| {
      if let Some(m) = model {
        picked_count = toolbar::count(ui, Id::new("video-count"), m, count, "videos");
      }
    };
    let actions = prompt_box::show(ui, &mut prompt, &self.refs, &mut self.box_state, &props, env.cache, &mut left, &mut right);
    self.settings.prompt = prompt;
    if let Some(id) = picked_model {
      self.settings.model = Some(id);
    }
    if let Some(n) = picked_count {
      self.settings.count = n;
    }
    if let Some(mode) = picked_mode {
      switch_mode(&mut self.settings, &mut self.refs, mode);
    }
    if open_characters {
      env.requests.push(AppRequest::OpenCharacters);
    }
    for action in actions {
      self.handle(action, env, model, limits.as_ref());
    }
  }

  fn handle(&mut self, action: PromptBoxAction, env: &mut Env<'_>, model: Option<&ModelInfo>, limits: Option<&DeckLimits>) {
    match action {
      PromptBoxAction::Generate => self.generate(env, model),
      PromptBoxAction::ClearAll => {
        self.settings.prompt.clear();
        self.refs.clear();
      },
      PromptBoxAction::Deck(deck) => match deck {
        DeckAction::Upload { kinds, slot } => {
          let multiple = slot == ImageSlot::Reference;
          let paths = common::pick_files(&kinds, multiple);
          self.add_files(env, &paths, slot, limits);
        },
        DeckAction::Library { kind, slot } => {
          let max = match slot {
            ImageSlot::Reference => limits.map_or(1, |l| free_slots(&self.refs, kind, l)).max(1),
            _ => 1,
          };
          env.requests.push(AppRequest::PickFromLibrary { kind, slot, max, page: MediaKind::Video });
        },
        DeckAction::Remove(id) => self.refs.remove(id),
        DeckAction::ClearAll => {
          self.refs.images.clear();
          self.refs.videos.clear();
          self.refs.audios.clear();
        },
        DeckAction::ReorderImages { from, to } => {
          let item = self.refs.images.remove(from);
          self.refs.images.insert(to.min(self.refs.images.len()), item);
        },
        DeckAction::Preview(id) => match self.refs.find_mut(id) {
          // Audio cards play and stop on click (the webapp's DeckCard).
          Some(r) if r.kind == RefKind::Audio => {
            if let Some(url) = r.full_url.clone() {
              env.requests.push(AppRequest::ToggleAudio { ref_id: id, url });
            }
          },
          Some(r) => {
            if let Some(url) = r.full_url.clone().or_else(|| r.preview.clone()) {
              env.requests.push(if r.kind == RefKind::Video { AppRequest::PlayExternally(url) } else { AppRequest::Preview(url) });
            }
          },
          None => {},
        },
        DeckAction::SwapFrames => self.refs.swap_frames(),
      },
      PromptBoxAction::DroppedFiles(paths) => self.add_files(env, &paths, ImageSlot::Reference, limits),
      PromptBoxAction::MentionPicked(label, Some(token)) => {
        self.character_picks.insert(label.trim_start_matches('@').to_owned(), token);
      },
      PromptBoxAction::MentionPicked(_, None) => {},
      PromptBoxAction::PastedImage(png) => match self.settings.input_mode {
        InputMode::Keyframe => match self.free_keyframe(model) {
          Some(slot) => common::upload_png(env, &mut self.refs, png, slot),
          None => env.toasts.error(frames_full_message(model)),
        },
        InputMode::Reference => {
          if limits.is_some_and(|l| free_slots(&self.refs, RefKind::Image, l) > 0) {
            common::upload_png(env, &mut self.refs, png, ImageSlot::Reference);
          } else {
            env.toasts.error(max_message(RefKind::Image, limits.map_or(0, |l| l.max_images), None));
          }
        },
      },
    }
  }

  /// Routes picked or dropped files (`handleDroppedFiles`): keyframe mode fills the first frame,
  /// then the last; reference mode adds each kind up to its limit.
  fn add_files(&mut self, env: &mut Env<'_>, paths: &[PathBuf], slot: ImageSlot, limits: Option<&DeckLimits>) {
    let model = common::selected_model(&env.catalog.video_page, self.settings.model.as_deref(), DEFAULT_VIDEO_MODEL).cloned();
    for path in paths {
      let Some(kind) = RefKind::from_path(path) else {
        env.toasts.error(format!("{} isn't a supported file", common::file_name(path)));
        continue;
      };
      match (self.settings.input_mode, kind) {
        (InputMode::Keyframe, RefKind::Image) => {
          let target = if slot == ImageSlot::Reference { self.free_keyframe(model.as_ref()) } else { Some(slot) };
          match target {
            Some(slot) => common::upload_path(env, &mut self.refs, path, kind, slot),
            None => env.toasts.error(frames_full_message(model.as_ref())),
          }
        },
        (InputMode::Keyframe, _) => env.toasts.error(format!("{} references aren't available here", if kind == RefKind::Video { "Video" } else { "Audio" })),
        (InputMode::Reference, _) => {
          let Some(l) = limits else {
            continue;
          };
          let max = match kind {
            RefKind::Image => l.max_images,
            RefKind::Video => l.max_videos,
            RefKind::Audio => l.max_audios,
          };
          if max == 0 {
            env.toasts.error(format!("{}{} references aren't available here", kind.noun()[..1].to_uppercase(), &kind.noun()[1..]));
          } else if free_slots(&self.refs, kind, l) == 0 {
            let secs = if kind == RefKind::Video { l.max_video_secs } else { l.max_audio_secs };
            env.toasts.error(max_message(kind, max, secs.filter(|_| kind != RefKind::Image)));
          } else {
            common::upload_path(env, &mut self.refs, path, kind, ImageSlot::Reference);
          }
        },
      }
    }
  }

  /// After an upload lands: enforce the model's total-duration limits.
  pub fn check_durations(&mut self, env: &mut Env<'_>, ref_id: u64) {
    let Some(model) = common::selected_model(&env.catalog.video_page, self.settings.model.as_deref(), DEFAULT_VIDEO_MODEL) else {
      return;
    };
    for (kind, max) in [(RefKind::Video, model.video_refs_max_secs), (RefKind::Audio, model.audio_refs_max_secs)] {
      let Some(max) = max else {
        continue;
      };
      if self.refs.list(kind).iter().any(|r| r.id == ref_id) && self.refs.total_secs(kind) > f32::from(max) + 0.5 {
        self.refs.remove(ref_id);
        env.toasts.error(format!("Total {} duration cannot exceed {max}s", kind.noun()));
      }
    }
  }

  fn generate(&mut self, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    if self.generating {
      return;
    }
    if self.settings.prompt.trim().is_empty() {
      env.toasts.error("Please enter a prompt to generate video");
      return;
    }
    let Some(model) = model else {
      env.toasts.error("Please select a model to generate video");
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
    if self.needs_start_frame(model) {
      env.toasts.error("Please add a starting frame image to generate video");
      return;
    }
    if self.refs.any_uploading() {
      env.toasts.error("Please wait for your references to finish uploading");
      return;
    }
    self.generating = true;
    let ref_image = self.refs.first_frame.as_ref().or(self.refs.images.first()).and_then(|r| r.preview.clone());
    let meta = EnqueueMeta { prompt: self.settings.prompt.clone(), model_id: model.id.clone(), batch_count: u32::from(model.valid_batch(self.settings.count)), ref_image };
    let mut fields = self.fields(model, false);
    if supports_characters(model) {
      let tokens = mentioned_characters(&self.settings.prompt, env.characters, &self.character_picks);
      if !tokens.is_empty() {
        fields.insert("reference_character_tokens".into(), json!(tokens));
      }
    }
    env.backend.generate(Modality::Video, fields, meta);
  }

  /// The characters dialog picked `name`: mention it at the end of the prompt.
  pub fn mention_character(&mut self, name: &str, token: &str) {
    let p = &mut self.settings.prompt;
    if !p.is_empty() && !p.ends_with(char::is_whitespace) {
      p.push(' ');
    }
    p.push('@');
    p.push_str(name);
    p.push(' ');
    self.character_picks.insert(name.to_owned(), token.to_owned());
    self.box_state.editor.focus_requested = true;
  }

  /// The OmniGen request (`GenerateVideoRequest` after `api_fields`).
  fn fields(&self, m: &ModelInfo, estimate: bool) -> Map<String, Value> {
    let s = &self.settings;
    let mut f = Map::new();
    f.insert("model".into(), json!(m.id));
    if !estimate {
      f.insert("prompt".into(), json!(s.prompt));
    }
    let resolved = [("aspect_ratio", ModelInfo::resolve(s.aspect_ratio.as_deref(), &m.aspect_ratios, m.aspect_default.as_ref())), ("resolution", ModelInfo::resolve(s.resolution.as_deref(), &m.resolutions, m.resolution_default.as_ref()).filter(|_| !m.resolutions.is_empty())), ("bitrate", ModelInfo::resolve(s.bitrate.as_deref(), &m.bitrates, m.bitrate_default.as_ref()).filter(|_| !m.bitrates.is_empty())), ("output_format", ModelInfo::resolve(s.output_format.as_deref(), &m.output_formats, m.output_format_default.as_ref()).filter(|_| !m.output_formats.is_empty()))];
    for (key, value) in resolved {
      if let Some(v) = value {
        f.insert(key.into(), json!(v));
      }
    }
    let reference = s.input_mode == InputMode::Reference;
    if let Some(d) = m.resolve_duration(s.duration, reference && !self.refs.images.is_empty()) {
      f.insert("duration_seconds".into(), json!(d));
    }
    if m.sound_toggle {
      f.insert("generate_audio".into(), json!(s.generate_audio));
    }
    // Only models that list batch sizes take a count (older ones reject the field).
    if !m.batch_sizes.is_empty() {
      f.insert("video_batch_count".into(), json!(m.valid_batch(s.count)));
    }
    let token = |r: &RefMedia, i: usize| r.token.clone().or_else(|| estimate.then(|| format!("mf_estimate_{i}")));
    if reference {
      for (key, list) in [("reference_image_media_tokens", &self.refs.images), ("reference_video_media_tokens", &self.refs.videos), ("reference_audio_media_tokens", &self.refs.audios)] {
        let tokens: Vec<String> = list.iter().enumerate().filter_map(|(i, r)| token(r, i)).collect();
        if !tokens.is_empty() {
          f.insert(key.into(), json!(tokens));
        }
      }
      if estimate {
        let millis = |kind| (self.refs.total_secs(kind) * 1000.0) as u32;
        f.insert("estimate_only".into(), json!({ "total_input_video_duration_millis": millis(RefKind::Video), "total_input_audio_duration_millis": millis(RefKind::Audio) }));
      }
    } else {
      if let Some(t) = self.refs.first_frame.as_ref().and_then(|r| token(r, 0)) {
        f.insert("start_frame_image_media_token".into(), json!(t));
      }
      if let Some(t) = self.refs.last_frame.as_ref().filter(|_| m.end_frame).and_then(|r| token(r, 1)) {
        f.insert("end_frame_image_media_token".into(), json!(t));
      }
    }
    f
  }

  /// Model-change reconciliation: input mode, end frame and count.
  fn reconcile(&mut self, m: &ModelInfo) {
    let wanted = match self.settings.input_mode {
      InputMode::Reference if !m.supports_reference_mode() => InputMode::Keyframe,
      InputMode::Keyframe if !m.start_frame && m.supports_reference_mode() => InputMode::Reference,
      mode => mode,
    };
    if wanted != self.settings.input_mode {
      switch_mode(&mut self.settings, &mut self.refs, wanted);
    }
    if !m.end_frame && self.refs.last_frame.is_some() {
      self.refs.last_frame = None;
    }
    self.settings.count = m.valid_batch(self.settings.count);
  }

  fn needs_start_frame(&self, m: &ModelInfo) -> bool {
    let keyframe = self.settings.input_mode == InputMode::Keyframe;
    let required = (keyframe && m.start_frame_required) || (!m.text_to_video && m.start_frame);
    required && !self.has_image_input()
  }

  fn has_image_input(&self) -> bool {
    match self.settings.input_mode {
      InputMode::Keyframe => self.refs.first_frame.is_some(),
      InputMode::Reference => !self.refs.images.is_empty(),
    }
  }

  /// The first empty keyframe slot, if any.
  fn free_keyframe(&self, model: Option<&ModelInfo>) -> Option<ImageSlot> {
    if self.refs.first_frame.is_none() {
      Some(ImageSlot::FirstFrame)
    } else if self.refs.last_frame.is_none() && model.is_some_and(|m| m.end_frame) {
      Some(ImageSlot::LastFrame)
    } else {
      None
    }
  }

  /// `@Image1…`, `@Video1…`, `@Audio1…` for the attached references.
  fn mentions(&self) -> Vec<MentionItem> {
    let mut items = editor::mention_items(MentionKind::Image, self.refs.images.iter().map(|r| r.preview.clone()));
    items.extend(editor::mention_items(MentionKind::Video, self.refs.videos.iter().map(|r| r.preview.clone())));
    items.extend(editor::mention_items(MentionKind::Audio, self.refs.audios.iter().map(|_| None)));
    items
  }

  /// "Make Video" from an image: it becomes the first frame (or the first reference).
  pub fn set_start_image(&mut self, image: RefMedia) {
    match self.settings.input_mode {
      InputMode::Keyframe => self.refs.first_frame = Some(image),
      InputMode::Reference => self.refs.images = vec![image],
    }
    self.box_state.editor.focus_requested = true;
  }

  pub fn on_enqueued(&mut self, env: &mut Env<'_>, job_tokens: &[String], meta: &EnqueueMeta) {
    self.generating = false;
    self.feed.add_enqueued(MediaKind::Video, job_tokens, meta, env.catalog);
    env.toasts.success("Video generation enqueued!");
  }

  pub fn on_enqueue_failed(&mut self, env: &mut Env<'_>, message: &str) {
    self.generating = false;
    env.toasts.error(if message.is_empty() { "Failed to start video generation. Please try again." } else { message });
  }

  /// Recreate: the original prompt, model, settings and references.
  pub fn apply_prompt(&mut self, prompt: &Prompt) {
    let s = &mut self.settings;
    s.prompt = prompt.maybe_positive_prompt.clone().unwrap_or_default();
    if prompt.maybe_model_type.is_some() {
      s.model = prompt.maybe_model_type.clone();
    }
    if prompt.maybe_aspect_ratio.is_some() {
      s.aspect_ratio = prompt.maybe_aspect_ratio.clone();
    }
    if prompt.maybe_resolution.is_some() {
      s.resolution = prompt.maybe_resolution.clone();
    }
    if prompt.maybe_duration_seconds.is_some() {
      s.duration = prompt.maybe_duration_seconds;
    }
    if let Some(audio) = prompt.maybe_generate_audio {
      s.generate_audio = audio;
    }
    self.refs.clear();
    for c in prompt.maybe_context_images.iter().flatten() {
      let kind = match c.semantic.as_str() {
        "vid_ref" => RefKind::Video,
        "audioref" => RefKind::Audio,
        _ => RefKind::Image,
      };
      let item = RefMedia::from_library(kind, c.media_token.clone(), c.media_links.thumbnail(256), Some(c.media_links.cdn_url.clone()), 0.0);
      match (c.semantic.as_str(), kind) {
        ("vid_end_frame", _) => self.refs.last_frame = Some(item),
        (_, RefKind::Image) if s.input_mode == InputMode::Keyframe && self.refs.first_frame.is_none() => self.refs.first_frame = Some(item),
        (_, kind) => self.refs.list_mut(kind).push(item),
      }
    }
    self.box_state.editor.focus_requested = true;
  }
}

/// The video-only pickers: aspect ratio through input mode (left toolbar after the model).
/// Returns a newly picked input mode (applied by the caller, since it moves references).
fn video_toolbar(ui: &mut Ui, m: &ModelInfo, s: &mut VideoSettings, with_refs: bool) -> Option<InputMode> {
  let aspect = ModelInfo::resolve(s.aspect_ratio.as_deref(), &m.aspect_ratios, m.aspect_default.as_ref());
  if let Some(v) = toolbar::aspect_ratio(ui, Id::new("video-aspect"), m, aspect.as_deref().unwrap_or("")) {
    s.aspect_ratio = Some(v);
  }
  let resolution = ModelInfo::resolve(s.resolution.as_deref(), &m.resolutions, m.resolution_default.as_ref());
  if let Some(v) = toolbar::resolution(ui, Id::new("video-resolution"), m, resolution.as_deref().unwrap_or("")) {
    s.resolution = Some(v);
  }
  if !m.bitrates.is_empty() {
    let current = ModelInfo::resolve(s.bitrate.as_deref(), &m.bitrates, m.bitrate_default.as_ref()).unwrap_or_default();
    let options: Vec<PickOption<String>> = m.bitrates.iter().map(|v| PickOption::new(v.clone(), models::bitrate_label(v))).collect();
    if let Some(v) = pickers::option_picker(ui, Id::new("video-bitrate"), Trigger::Pill(Leading::None), "Bitrate", "Bitrate", &current, &options) {
      s.bitrate = Some(v);
    }
  }
  if !m.output_formats.is_empty() {
    let current = ModelInfo::resolve(s.output_format.as_deref(), &m.output_formats, m.output_format_default.as_ref()).unwrap_or_default();
    let options: Vec<PickOption<String>> = m.output_formats.iter().map(|v| PickOption::new(v.clone(), v.to_uppercase())).collect();
    if let Some(v) = pickers::option_picker(ui, Id::new("video-format"), Trigger::Pill(Leading::None), "Output Format", "Output format", &current, &options) {
      s.output_format = Some(v);
    }
  }
  if let (Some((min, max)), Some(current)) = (m.duration_range(with_refs), m.resolve_duration(s.duration, with_refs)) {
    if let Some(v) = pickers::duration_picker(ui, Id::new("video-duration"), u32::from(current), u32::from(min), u32::from(max)) {
      s.duration = Some(v as u16);
    }
  }
  if m.sound_toggle && pickers::toggle(ui, Id::new("video-sound"), if s.generate_audio { Icon::Volume } else { Icon::VolumeOff }, "Sound", s.generate_audio, if s.generate_audio { "Sound: ON" } else { "Sound: OFF" }) {
    s.generate_audio = !s.generate_audio;
  }
  if m.start_frame && m.supports_reference_mode() {
    let options = [PickOption::new(InputMode::Keyframe, "Keyframe").subtitle("First/Last frame"), PickOption::new(InputMode::Reference, "Omni Reference").subtitle("Multi-media ref")];
    return pickers::option_picker(ui, Id::new("video-mode"), Trigger::Pill(Leading::None), "Input Mode", "Input mode", &s.input_mode, &options);
  }
  None
}

/// Switches input mode, carrying the first image across: keyframe → reference moves the first
/// frame to the front of the deck (and drops the last frame); reference → keyframe takes the
/// deck's first image as the first frame (and drops videos and audio).
fn switch_mode(s: &mut VideoSettings, refs: &mut References, mode: InputMode) {
  match mode {
    InputMode::Reference => {
      if let Some(first) = refs.first_frame.take() {
        refs.images.insert(0, first);
      }
      refs.last_frame = None;
    },
    InputMode::Keyframe => {
      if refs.first_frame.is_none() && !refs.images.is_empty() {
        refs.first_frame = Some(refs.images.remove(0));
      }
      refs.videos.clear();
      refs.audios.clear();
    },
  }
  s.input_mode = mode;
}

/// Whether the model takes `@Character` mentions (the listing says so; Seedance 2.0 always does).
fn supports_characters(m: &ModelInfo) -> bool {
  m.character_refs_max > 0 || m.id == "seedance_2p0"
}

/// One token per character named in the prompt (`@Name`, not inside a longer word): the user's
/// explicit pick for that name, else the newest character with it.
fn mentioned_characters(prompt: &str, characters: &[crate::backend::wire::Character], picks: &std::collections::HashMap<String, String>) -> Vec<String> {
  let mut names: Vec<&str> = characters.iter().map(|c| c.name.as_str()).filter(|n| !n.is_empty()).collect();
  names.sort_by_key(|n| std::cmp::Reverse(n.len()));
  names.dedup();
  let mut tokens = Vec::new();
  for name in names {
    let needle = format!("@{name}");
    let mentioned = prompt.match_indices(&needle).any(|(i, _)| !prompt[i + needle.len()..].chars().next().is_some_and(|c| c.is_alphanumeric() || c == '_'));
    if !mentioned {
      continue;
    }
    let candidates: Vec<&crate::backend::wire::Character> = characters.iter().filter(|c| c.name == name).collect();
    let chosen = picks.get(name).and_then(|t| candidates.iter().find(|c| &c.token == t)).or(candidates.first());
    if let Some(c) = chosen {
      tokens.push(c.token.clone());
    }
  }
  tokens
}

fn deck_limits(m: &ModelInfo, library: bool) -> DeckLimits {
  DeckLimits { max_images: m.image_refs_max, max_videos: m.video_refs_max, max_video_secs: m.video_refs_max_secs.map(f32::from), max_audios: m.audio_refs_max, max_audio_secs: m.audio_refs_max_secs.map(f32::from), library }
}

fn free_slots(refs: &References, kind: RefKind, l: &DeckLimits) -> usize {
  let max = match kind {
    RefKind::Image => l.max_images,
    RefKind::Video => l.max_videos,
    RefKind::Audio => l.max_audios,
  };
  max.saturating_sub(refs.list(kind).len())
}

fn max_message(kind: RefKind, max: usize, secs: Option<f32>) -> String {
  let noun = match kind {
    RefKind::Image => "image reference",
    RefKind::Video => "video",
    RefKind::Audio => "audio clip",
  };
  let plural = if max == 1 { "" } else { "s" };
  match secs {
    Some(s) => format!("Max {max} {noun}{plural} / {}s total", s.round() as i64),
    None => format!("Max {max} {noun}{plural}"),
  }
}

fn frames_full_message(model: Option<&ModelInfo>) -> &'static str {
  if model.is_some_and(|m| m.end_frame) {
    "First and last frames are already set"
  } else {
    "The first frame is already set"
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::backend::wire::Character;

  fn character(token: &str, name: &str) -> Character {
    Character { token: token.into(), name: name.into(), ..Default::default() }
  }

  #[test]
  fn mentions_resolve_to_one_token_per_name() {
    // Newest first, as the server lists them.
    let characters = [character("c3", "Bob"), character("c2", "Bob2"), character("c1", "Bob"), character("c0", "Ann")];
    let none = std::collections::HashMap::new();
    assert_eq!(mentioned_characters("@Bob2 waves", &characters, &none), ["c2"], "@Bob2 isn't @Bob");
    assert_eq!(mentioned_characters("@Bob, then @Ann.", &characters, &none), ["c3", "c0"], "newest Bob by default");
    let picks = std::collections::HashMap::from([("Bob".to_owned(), "c1".to_owned())]);
    assert_eq!(mentioned_characters("hi @Bob", &characters, &picks), ["c1"], "the explicit pick wins");
    assert!(mentioned_characters("no mentions", &characters, &none).is_empty());
  }
}
