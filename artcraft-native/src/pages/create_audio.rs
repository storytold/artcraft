//! Create Audio (`CreateAudio` + `PromptBoxAudio`): a song, sound or sample from a prompt, with
//! the model's options (style, instrumental, lyrics, loop, beat & key, tuning), audio or image
//! references, the cost, and the audio feed.

use std::ops::RangeInclusive;
use std::path::PathBuf;

use egui::{Align2, Color32, FontId, Id, Rect, Response, Sense, Stroke, TextureHandle, Ui, pos2, vec2};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::backend::media_cache::Lookup;
use crate::backend::{EnqueueMeta, Modality};
use crate::feed::store::FeedStore;
use crate::feed::types::MediaKind;
use crate::models::{self, AudioCaps, Catalog, DEFAULT_AUDIO_MODEL, MUSICAL_KEYS, ModelInfo};
use crate::pages::common::{self, AppRequest, CostState, Env};
use crate::prompt_box::deck::cover_uv;
use crate::prompt_box::model_selector::model_selector;
use crate::prompt_box::pickers;
use crate::prompt_box::refs::{ImageSlot, RefKind, RefMedia, RefStatus, References};
use crate::prompt_box::{self, DeckMode, PromptBoxAction, PromptBoxProps, PromptBoxState, Slot};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::toast::Toasts;
use crate::ui::widgets::{self, Leading};

const PLACEHOLDER: &str = "Describe the music or sound you want...";
const STYLE_PLACEHOLDER: &str = "Style: e.g. dreamy synth-pop, female vocals";
/// The audio references' total length cap (`AUDIO_REF_MAX_DURATION_SECONDS`).
const MAX_REF_SECS: f32 = 600.0;
/// Beat & Key and Tuning (`SoundsSettingsPopover`, `AudioTuningPopover`).
const BPM_RANGE: RangeInclusive<u16> = 40..=240;
const DEFAULT_BPM: u16 = 120;
const SPEED_RANGE: RangeInclusive<f32> = 0.5..=2.0;
const VOLUME_RANGE: RangeInclusive<f32> = 0.5..=2.0;
const PITCH_RANGE: RangeInclusive<i8> = -12..=12;
const POPOVER_WIDTH: f32 = 240.0;
/// Shown when generate fails on the server's side (`OMNI_GENERATE_OUTAGE_MESSAGE`).
const OUTAGE_MESSAGE: &str = "Couldn't start generation - the service is temporarily unavailable. Try again shortly.";

/// What the page remembers between launches.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
pub struct AudioSettings {
  pub prompt: String,
  pub style_prompt: String,
  pub model: Option<String>,
  pub instrumental: bool,
  pub keep_lyrics: bool,
  pub loopable: bool,
  /// `None` = Auto.
  pub bpm: Option<u16>,
  pub musical_key: String,
  /// `None` = the model's default.
  pub sample_rate_hz: Option<u32>,
  pub speed: f32,
  pub volume: f32,
  /// Semitones.
  pub pitch: i8,
}

impl Default for AudioSettings {
  fn default() -> Self {
    Self { prompt: String::new(), style_prompt: String::new(), model: None, instrumental: false, keep_lyrics: false, loopable: false, bpm: None, musical_key: "auto".to_owned(), sample_rate_hz: None, speed: 1.0, volume: 1.0, pitch: 0 }
  }
}

#[derive(Default)]
pub struct CreateAudioPage {
  pub settings: AudioSettings,
  pub refs: References,
  pub feed: FeedStore,
  pub cost: CostState,
  pub generating: bool,
  box_state: PromptBoxState,
  box_height: f32,
}

/// What the reference row asks for.
#[derive(Debug, PartialEq)]
enum RowAction {
  AddAudio,
  AudioFromLibrary,
  AddImage,
  Remove(u64),
  Toggle(u64),
}

impl CreateAudioPage {
  pub fn new(settings: AudioSettings) -> Self {
    let mut page = Self { settings, box_height: 138.0, ..Default::default() };
    page.box_state.editor.focus_requested = true;
    page
  }

  pub fn ui(&mut self, ui: &mut Ui, env: &mut Env<'_>) {
    let model = common::selected_model(&env.catalog.audio_page, self.settings.model.as_deref(), DEFAULT_AUDIO_MODEL).cloned();
    if let Some(m) = &model {
      let fields = self.fields(m, true);
      self.cost.update(ui, env.backend, Modality::Audio, &fields);
    }
    let mut feed = std::mem::take(&mut self.feed);
    let mut box_height = self.box_height;
    common::create_shell(ui, env, MediaKind::Audio, "Create Audio", "Describe a song, a sound, or a sample", &mut feed, &mut box_height, |ui, env| self.prompt_box(ui, env, model.as_ref()));
    self.feed = feed;
    self.box_height = box_height;
  }

  fn prompt_box(&mut self, ui: &mut Ui, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    let missing_ref = model.is_some_and(|m| self.missing_required_ref(m));
    let accepts: Vec<RefKind> = model.map_or_else(Vec::new, |m| [(RefKind::Audio, m.audio_refs_max), (RefKind::Image, m.image_refs_max)].into_iter().filter(|(_, n)| *n > 0).map(|(k, _)| k).collect());
    let props = PromptBoxProps { id: Id::new("audio-prompt-box"), placeholder: PLACEHOLDER, enter_to_generate: env.enter_to_generate, mentions: &[], max_length: None, deck: DeckMode::None, accepts: &accepts, credits: self.cost.credits, generate_enabled: !self.settings.prompt.trim().is_empty() && model.is_some() && !missing_ref, generating: self.generating, generate_tooltip: "Generate", warning: missing_ref.then_some("Audio track required"), banner: None, extra_input: !self.settings.style_prompt.is_empty() };

    let playing = self.refs.audios.iter().map(|r| r.id).find(|id| env.audio.is_playing(&ref_key(*id)));
    let image = self.refs.images.first().and_then(|r| r.preview.as_deref()).and_then(|key| match env.cache.get(&env.ctx, key) {
      Lookup::Ready(t) => Some(t),
      _ => None,
    });
    let models = &env.catalog.audio_page;
    let mut prompt = std::mem::take(&mut self.settings.prompt);
    let settings = &mut self.settings;
    let refs = &self.refs;
    let mut picked_model = None;
    let mut row_actions = Vec::new();
    let mut slots = |ui: &mut Ui, slot: Slot| match (slot, model) {
      (Slot::ToolbarLeft, _) => {
        if let Some(id) = model_selector(ui, Id::new("audio-model"), models, model, false) {
          picked_model = Some(id);
        }
        if let Some(m) = model {
          audio_toolbar(ui, &m.audio, settings);
        }
      },
      (Slot::AbovePrompt, Some(m)) => reference_row(ui, m, refs, playing, image.as_ref(), &mut row_actions),
      (Slot::BelowPrompt, Some(m)) if m.audio.style_prompt => style_row(ui, &mut settings.style_prompt),
      _ => {},
    };
    let actions = prompt_box::show(ui, &mut prompt, &self.refs, &mut self.box_state, &props, env.cache, &mut slots);
    self.settings.prompt = prompt;
    if let Some(id) = picked_model {
      self.settings.model = Some(id);
    }
    if let Some(m) = model {
      for action in row_actions {
        self.row_action(action, env, m);
      }
    }
    for action in actions {
      self.handle(action, env, model);
    }
  }

  fn handle(&mut self, action: PromptBoxAction, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    match action {
      PromptBoxAction::Generate => self.generate(env, model),
      // Toggles and tuning stay as they are.
      PromptBoxAction::ClearAll => {
        self.settings.prompt.clear();
        self.settings.style_prompt.clear();
        self.refs.clear();
      },
      PromptBoxAction::DroppedFiles(paths) => {
        if let Some(m) = model {
          self.add_dropped(env, m, &paths);
        }
      },
      PromptBoxAction::PastedImage(png) => match model {
        Some(m) if m.image_refs_max > 0 => {
          self.make_room_for_image(env);
          common::upload_png(env, &mut self.refs, png, ImageSlot::Reference);
        },
        _ => env.toasts.error("Image references aren't available here"),
      },
      PromptBoxAction::Deck(_) | PromptBoxAction::MentionPicked(..) => {},
    }
  }

  fn row_action(&mut self, action: RowAction, env: &mut Env<'_>, m: &ModelInfo) {
    match action {
      RowAction::AddAudio => {
        let paths = common::pick_files(&[RefKind::Audio], m.audio_refs_max > 1);
        self.add_audio(env, m, &paths);
      },
      RowAction::AudioFromLibrary => {
        let max = m.audio_refs_max.saturating_sub(self.refs.audios.len()).max(1);
        env.requests.push(AppRequest::PickFromLibrary { kind: RefKind::Audio, slot: ImageSlot::Reference, max, page: MediaKind::Audio });
      },
      RowAction::AddImage => {
        if let Some(path) = common::pick_files(&[RefKind::Image], false).first() {
          self.make_room_for_image(env);
          common::upload_path(env, &mut self.refs, path, RefKind::Image, ImageSlot::Reference);
        }
      },
      RowAction::Remove(id) => {
        if env.audio.is_playing(&ref_key(id)) {
          env.audio.stop();
        }
        self.refs.remove(id);
      },
      RowAction::Toggle(id) => {
        if let Some(url) = self.refs.audios.iter().find(|r| r.id == id).and_then(|r| r.full_url.clone()) {
          env.requests.push(AppRequest::ToggleAudio { ref_id: id, url });
        }
      },
    }
  }

  /// Dropped files (`usePromptBoxDrop`): audio wins over images; only the first image counts.
  fn add_dropped(&mut self, env: &mut Env<'_>, m: &ModelInfo, paths: &[PathBuf]) {
    let audios: Vec<PathBuf> = paths.iter().filter(|p| RefKind::from_path(p) == Some(RefKind::Audio)).cloned().collect();
    let image = paths.iter().find(|p| RefKind::from_path(p) == Some(RefKind::Image));
    if !audios.is_empty() {
      self.add_audio(env, m, &audios);
    } else if let Some(path) = image {
      if m.image_refs_max == 0 {
        env.toasts.error("Image references aren't available here");
        return;
      }
      self.make_room_for_image(env);
      common::upload_path(env, &mut self.refs, path, RefKind::Image, ImageSlot::Reference);
    } else if !paths.is_empty() {
      env.toasts.error(format!("Only {} files can be added here", accepted_kinds(m)));
    }
  }

  /// Uploads audio tracks into the free slots (dropping an image reference: they don't mix).
  fn add_audio(&mut self, env: &mut Env<'_>, m: &ModelInfo, paths: &[PathBuf]) {
    if paths.is_empty() {
      return;
    }
    if m.audio_refs_max == 0 {
      env.toasts.error("Audio references aren't available here");
      return;
    }
    let free = m.audio_refs_max.saturating_sub(self.refs.audios.len());
    if paths.len() > free {
      env.toasts.error(format!("Max {} audio track{}", m.audio_refs_max, if m.audio_refs_max == 1 { "" } else { "s" }));
    }
    if free == 0 {
      return;
    }
    self.make_room_for_audio(env.toasts);
    for path in paths.iter().take(free) {
      common::upload_path(env, &mut self.refs, path, RefKind::Audio, ImageSlot::Reference);
    }
  }

  /// Library picks, ready to attach: audio within the slots and the total-length cap.
  pub fn attach_from_library(&mut self, toasts: &mut Toasts, catalog: &Catalog, kind: RefKind, picks: Vec<RefMedia>) {
    let Some(m) = common::selected_model(&catalog.audio_page, self.settings.model.as_deref(), DEFAULT_AUDIO_MODEL) else {
      return;
    };
    if kind != RefKind::Audio || picks.is_empty() {
      common::attach_from_library(&mut self.refs, kind, ImageSlot::Reference, picks);
      return;
    }
    self.make_room_for_audio(toasts);
    let mut total = self.refs.total_secs(RefKind::Audio);
    let mut accepted = Vec::new();
    for pick in picks.into_iter().take(m.audio_refs_max.saturating_sub(self.refs.audios.len())) {
      if total + pick.duration_secs > MAX_REF_SECS {
        toasts.error(duration_message());
        break;
      }
      total += pick.duration_secs;
      accepted.push(pick);
    }
    common::attach_from_library(&mut self.refs, kind, ImageSlot::Reference, accepted);
  }

  /// After an upload lands: keep the audio references under the total-length cap.
  pub fn check_durations(&mut self, toasts: &mut Toasts, ref_id: u64) {
    if self.refs.audios.iter().any(|r| r.id == ref_id) && self.refs.total_secs(RefKind::Audio) > MAX_REF_SECS + 0.5 {
      self.refs.remove(ref_id);
      toasts.error(duration_message());
    }
  }

  /// Audio and image references don't mix: adding audio drops the image.
  fn make_room_for_audio(&mut self, toasts: &mut Toasts) {
    if !self.refs.images.is_empty() {
      self.refs.images.clear();
      toasts.error("Removed image reference \u{2014} it can't be combined with audio");
    }
  }

  /// One image at most, and never with audio.
  fn make_room_for_image(&mut self, env: &mut Env<'_>) {
    if !self.refs.audios.is_empty() {
      if self.refs.audios.iter().any(|r| env.audio.is_playing(&ref_key(r.id))) {
        env.audio.stop();
      }
      self.refs.audios.clear();
      env.toasts.error("Removed audio reference \u{2014} it can't be combined with an image");
    }
    self.refs.images.clear();
  }

  fn missing_required_ref(&self, m: &ModelInfo) -> bool {
    m.audio.requires_audio_ref && self.refs.audios.len() != 1
  }

  fn generate(&mut self, env: &mut Env<'_>, model: Option<&ModelInfo>) {
    let Some(m) = model.filter(|_| !self.generating && !self.settings.prompt.trim().is_empty()) else {
      return;
    };
    if self.missing_required_ref(m) {
      env.toasts.error(format!("{} needs an audio track to work from \u{2014} add one first", m.name));
      return;
    }
    if !env.signed_in {
      env.requests.push(AppRequest::SignIn);
      return;
    }
    if self.refs.any_uploading() {
      env.toasts.error("Please wait for your references to finish uploading");
      return;
    }
    self.generating = true;
    let meta = EnqueueMeta { prompt: self.settings.prompt.trim().to_owned(), model_id: m.id.clone(), batch_count: 1, ref_image: None };
    env.backend.generate(Modality::Audio, self.fields(m, false), meta);
  }

  pub fn on_enqueued(&mut self, env: &mut Env<'_>, job_tokens: &[String], meta: &EnqueueMeta) {
    self.generating = false;
    self.feed.add_enqueued(MediaKind::Audio, job_tokens, meta, env.catalog);
    env.toasts.success("Audio generation enqueued!");
  }

  pub fn on_enqueue_failed(&mut self, env: &mut Env<'_>, message: &str, status: Option<u16>) {
    self.generating = false;
    env.toasts.error(failure_message(message, status));
  }

  /// The OmniGen request (`buildAudioGenerationBody`): only what the model takes, nothing null.
  /// The estimate counts references with placeholders and needs no prompt.
  fn fields(&self, m: &ModelInfo, estimate: bool) -> Map<String, Value> {
    let (s, caps) = (&self.settings, &m.audio);
    let mut f = Map::new();
    f.insert("model".into(), json!(m.id));
    let tokens = |list: &[RefMedia]| -> Vec<String> {
      if estimate {
        vec!["placeholder".to_owned(); list.len()]
      } else {
        list.iter().filter_map(|r| r.token.clone()).collect()
      }
    };
    for (key, max, list) in [("audio_media_tokens", m.audio_refs_max, &self.refs.audios), ("image_media_tokens", m.image_refs_max, &self.refs.images)] {
      let list = tokens(list.as_slice());
      if max > 0 && !list.is_empty() {
        f.insert(key.into(), json!(list));
      }
    }
    if let Some(hz) = caps.sample_rate(s.sample_rate_hz).filter(|_| !caps.sample_rates.is_empty()) {
      f.insert("sample_rate_hz".into(), json!(hz));
    }
    if estimate {
      return f;
    }
    let (prompt, style) = (s.prompt.trim(), s.style_prompt.trim());
    if !prompt.is_empty() {
      f.insert("prompt".into(), json!(prompt));
    }
    if caps.style_prompt && !style.is_empty() {
      f.insert("style_prompt".into(), json!(style));
    }
    for (supported, key, value) in [(caps.keep_lyrics, "keep_lyrics", s.keep_lyrics), (caps.instrumental, "is_instrumental", s.instrumental), (caps.loopable, "is_loopable", s.loopable)] {
      if supported {
        f.insert(key.into(), json!(value));
      }
    }
    if let Some(bpm) = s.bpm.filter(|_| caps.bpm) {
      f.insert("bpm".into(), json!(bpm));
    }
    if caps.musical_key {
      f.insert("musical_key".into(), json!(musical_key(&s.musical_key).0));
    }
    for (supported, key, value) in [(caps.speed, "speed", s.speed), (caps.volume, "volume", s.volume)] {
      if supported {
        f.insert(key.into(), json!(hundredths(value)));
      }
    }
    if caps.pitch {
      f.insert("pitch".into(), json!(s.pitch));
    }
    f
  }
}

/// The audio pickers after the model (`PromptBoxAudio`'s toolbar): the toggles the model offers,
/// Beat & Key, and Tuning.
fn audio_toolbar(ui: &mut Ui, caps: &AudioCaps, s: &mut AudioSettings) {
  let toggles = [(caps.instrumental, &mut s.instrumental, "audio-instrumental", Icon::MicOff, "Instrumental"), (caps.keep_lyrics, &mut s.keep_lyrics, "audio-keep-lyrics", Icon::Mic, "Keep lyrics"), (caps.loopable, &mut s.loopable, "audio-loop", Icon::Repeat, "Loop")];
  for (supported, value, id, icon, label) in toggles {
    if supported && pickers::toggle(ui, Id::new(id), icon, label, *value, &format!("{label}: {}", if *value { "ON" } else { "OFF" })) {
      *value = !*value;
    }
  }
  if caps.bpm || caps.musical_key {
    beat_and_key(ui, caps, s);
  }
  if caps.has_tuning() {
    tuning(ui, caps, s);
  }
}

/// The Beat & Key popover: a BPM slider with Auto, and the musical key grid.
fn beat_and_key(ui: &mut Ui, caps: &AudioCaps, s: &mut AudioSettings) {
  let mut parts = Vec::new();
  if caps.bpm {
    parts.push(s.bpm.map_or_else(|| "Auto BPM".to_owned(), |b| format!("{b} BPM")));
  }
  if caps.musical_key {
    parts.push(musical_key(&s.musical_key).2.to_owned());
  }
  let label = if parts.is_empty() { "Beat".to_owned() } else { parts.join(" \u{b7} ") };
  pickers::popover_pill(ui, Id::new("audio-beat"), Leading::Icon(Icon::Drum), &label, "Beat & Key", |ui| {
    ui.set_width(POPOVER_WIDTH);
    widgets::menu_header(ui, "Beat & Key");
    padded(ui, |ui| {
      if caps.bpm {
        ui.horizontal(|ui| {
          setting_name(ui, "BPM");
          ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            setting_value(ui, &s.bpm.map_or_else(|| "Auto".to_owned(), |b| b.to_string()));
            if s.bpm.is_some() && ui.add(egui::Button::new(egui::RichText::new("Auto").size(11.5).color(theme::ACCENT_INK)).frame(false)).on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
              s.bpm = None;
            }
          });
        });
        let mut bpm = s.bpm.unwrap_or(DEFAULT_BPM);
        if full_slider(ui, &mut bpm, BPM_RANGE, 1.0).changed() {
          s.bpm = Some(bpm);
        }
      }
      if caps.musical_key {
        ui.add_space(6.0);
        setting_name(ui, "Musical key");
        ui.spacing_mut().item_spacing = vec2(4.0, 4.0);
        let width = ui.available_width();
        let (auto, keys) = MUSICAL_KEYS.split_first().expect("keys");
        if choice_chip(ui, auto.2, s.musical_key == auto.0, width, auto.1).clicked() {
          s.musical_key = auto.0.to_owned();
        }
        let cell = (width - 12.0) / 4.0;
        for row in keys.chunks(4) {
          ui.horizontal(|ui| {
            for (value, label, short) in row {
              if choice_chip(ui, short, s.musical_key == *value, cell, label).clicked() {
                s.musical_key = (*value).to_owned();
              }
            }
          });
        }
      }
    });
  });
}

/// The Tuning popover: sample rate chips and the speed, volume and pitch sliders.
fn tuning(ui: &mut Ui, caps: &AudioCaps, s: &mut AudioSettings) {
  pickers::popover_pill(ui, Id::new("audio-tuning"), Leading::Icon(Icon::SlidersHorizontal), "Tuning", "Tuning", |ui| {
    ui.set_width(POPOVER_WIDTH);
    widgets::menu_header(ui, "Tuning");
    padded(ui, |ui| {
      if !caps.sample_rates.is_empty() {
        setting_name(ui, "Sample rate");
        let current = caps.sample_rate(s.sample_rate_hz);
        ui.horizontal_wrapped(|ui| {
          ui.spacing_mut().item_spacing = vec2(4.0, 4.0);
          for hz in &caps.sample_rates {
            let label = models::sample_rate_label(*hz);
            if choice_chip(ui, &label, current == Some(*hz), 72.0, &label).clicked() {
              s.sample_rate_hz = Some(*hz);
            }
          }
        });
        ui.add_space(6.0);
      }
      if caps.speed {
        labeled_slider(ui, "Speed", &format!("{:.2}\u{d7}", s.speed), &mut s.speed, SPEED_RANGE, 0.05);
      }
      if caps.volume {
        labeled_slider(ui, "Volume", &format!("{:.2}\u{d7}", s.volume), &mut s.volume, VOLUME_RANGE, 0.05);
      }
      if caps.pitch {
        labeled_slider(ui, "Pitch", &format!("{}{} st", if s.pitch > 0 { "+" } else { "" }, s.pitch), &mut s.pitch, PITCH_RANGE, 1.0);
      }
    });
  });
}

/// The references above the prompt (`AudioReferenceRow`): the audio tracks (play, remove), add or
/// pick more while there's room, and the image when the model takes one.
fn reference_row(ui: &mut Ui, m: &ModelInfo, refs: &References, playing: Option<u64>, image: Option<&TextureHandle>, actions: &mut Vec<RowAction>) {
  if m.audio_refs_max == 0 && m.image_refs_max == 0 {
    return;
  }
  ui.horizontal_wrapped(|ui| {
    ui.spacing_mut().item_spacing = vec2(8.0, 6.0);
    if m.audio_refs_max > 0 {
      icons::icon(ui, Icon::Music, 14.0, theme::MUTED);
      ui.label(egui::RichText::new(format!("Audio Track ({}/{})", refs.audios.len(), m.audio_refs_max)).size(12.5).color(theme::MUTED));
      if m.audio.requires_audio_ref && refs.audios.is_empty() {
        ui.label(egui::RichText::new("required").size(12.5).color(theme::BAD));
      }
      for (i, r) in refs.audios.iter().enumerate() {
        audio_tile(ui, i, r, playing == Some(r.id), actions);
      }
      if refs.audios.len() < m.audio_refs_max {
        let uploading = refs.audios.iter().any(|r| r.status == RefStatus::Uploading);
        if ui.add_enabled_ui(!uploading, |ui| widgets::pill(ui, Leading::Icon(Icon::Upload), if uploading { "Uploading\u{2026}" } else { "Add audio" }, false)).inner.clicked() {
          actions.push(RowAction::AddAudio);
        }
        if widgets::pill(ui, Leading::Icon(Icon::Folder), "From library", false).clicked() {
          actions.push(RowAction::AudioFromLibrary);
        }
      }
    }
    if m.image_refs_max > 0 {
      ui.add_space(8.0);
      ui.label(egui::RichText::new("Image").size(12.5).color(theme::MUTED));
      match refs.images.first() {
        Some(r) => image_tile(ui, r, image, actions),
        None => {
          if widgets::pill(ui, Leading::Icon(Icon::Image), "Add image", false).clicked() {
            actions.push(RowAction::AddImage);
          }
        },
      }
    }
  });
  ui.add_space(8.0);
  hairline(ui);
  ui.add_space(8.0);
}

/// One audio reference (`AudioRefTile`): play / stop, "Audio 1 · 12s", remove.
fn audio_tile(ui: &mut Ui, index: usize, r: &RefMedia, playing: bool, actions: &mut Vec<RowAction>) {
  let uploading = r.status == RefStatus::Uploading;
  let text = if uploading { format!("Audio {}", index + 1) } else { format!("Audio {} \u{b7} {}s", index + 1, r.duration_secs.round() as i64) };
  let galley = ui.painter().layout_no_wrap(text, FontId::new(12.5, theme::medium()), theme::INK);
  let (rect, _) = ui.allocate_exact_size(vec2(6.0 + 24.0 + 8.0 + galley.size().x + 6.0 + 20.0 + 6.0, theme::CONTROL_H), Sense::hover());
  ui.painter().rect(rect, theme::RADIUS, theme::CONTROLS, Stroke::new(1.0, theme::LINE), egui::StrokeKind::Inside);
  let play = Rect::from_center_size(pos2(rect.left() + 18.0, rect.center().y), vec2(24.0, 24.0));
  if uploading {
    icons::paint_spinner(ui, play.shrink(4.0), theme::MUTED);
  } else {
    let resp = ui.interact(play, Id::new(("audio-ref-play", r.id)), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
    let label = if playing { "Stop" } else { "Play" };
    resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, label));
    let fill = match (playing, resp.hovered()) {
      (true, _) => theme::ACCENT,
      (false, true) => theme::WASH_HOVER,
      (false, false) => theme::WASH,
    };
    ui.painter().circle_filled(play.center(), 12.0, fill);
    if playing {
      ui.painter().rect_filled(Rect::from_center_size(play.center(), vec2(8.0, 8.0)), 1.0, Color32::WHITE);
    } else {
      icons::paint(ui.painter(), play.shrink(7.0).translate(vec2(1.0, 0.0)), Icon::Play, theme::INK);
    }
    if resp.clicked() {
      actions.push(RowAction::Toggle(r.id));
    }
  }
  ui.painter().galley(pos2(play.right() + 8.0, rect.center().y - galley.size().y / 2.0), galley, theme::INK);
  let remove = Rect::from_center_size(pos2(rect.right() - 16.0, rect.center().y), vec2(20.0, 20.0));
  if x_button(ui, remove, Id::new(("audio-ref-remove", r.id)), "Remove audio", true) {
    actions.push(RowAction::Remove(r.id));
  }
}

/// The image reference: a 36 px thumbnail with a remove × on hover.
fn image_tile(ui: &mut Ui, r: &RefMedia, texture: Option<&TextureHandle>, actions: &mut Vec<RowAction>) {
  let (rect, _) = ui.allocate_exact_size(vec2(36.0, 36.0), Sense::hover());
  ui.painter().rect(rect, theme::RADIUS, theme::CONTROLS, Stroke::new(1.0, theme::LINE), egui::StrokeKind::Inside);
  if let Some(t) = texture {
    egui::Image::new(t).uv(cover_uv(t.size_vec2())).corner_radius(theme::RADIUS).paint_at(ui, rect.shrink(1.0));
  }
  if r.status == RefStatus::Uploading {
    icons::paint_spinner(ui, rect.shrink(9.0), Color32::WHITE);
  }
  let remove = Rect::from_min_size(pos2(rect.right() - 14.0, rect.top() - 4.0), vec2(18.0, 18.0));
  let shown = ui.rect_contains_pointer(rect.union(remove));
  if x_button(ui, remove, Id::new(("image-ref-remove", r.id)), "Remove image", shown) {
    actions.push(RowAction::Remove(r.id));
  }
}

/// The style line under the prompt (`StylePromptRow`).
fn style_row(ui: &mut Ui, style: &mut String) {
  ui.add_space(6.0);
  hairline(ui);
  ui.add_space(6.0);
  ui.horizontal(|ui| {
    icons::icon(ui, Icon::Tags, 14.0, theme::DIM);
    let clear_w = if style.is_empty() { 0.0 } else { 28.0 };
    ui.add(egui::TextEdit::singleline(style).id_salt("audio-style").hint_text(STYLE_PLACEHOLDER).frame(egui::Frame::NONE).font(FontId::new(14.0, egui::FontFamily::Proportional)).desired_width(ui.available_width() - clear_w));
    if !style.is_empty() {
      let (rect, _) = ui.allocate_exact_size(vec2(20.0, 20.0), Sense::hover());
      if x_button(ui, rect, Id::new("audio-style-clear"), "Clear style", true) {
        style.clear();
      }
    }
  });
}

/// A small round × at `rect`, painted while `shown` (it stays clickable for keyboards and tests).
fn x_button(ui: &mut Ui, rect: Rect, id: Id, label: &str, shown: bool) -> bool {
  let resp = ui.interact(rect, id, Sense::click());
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, label));
  if shown || resp.hovered() {
    let fill = if resp.hovered() { theme::fade(theme::DANGER, 0.7) } else { Color32::from_black_alpha(128) };
    ui.painter().circle_filled(rect.center(), rect.width() / 2.0, fill);
    icons::paint(ui.painter(), rect.shrink(rect.width() * 0.27), Icon::X, Color32::WHITE);
  }
  resp.on_hover_text(label).on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}

/// A selectable chip in the popovers (keys, sample rates): outlined, filled when selected.
fn choice_chip(ui: &mut Ui, label: &str, selected: bool, width: f32, tooltip: &str) -> Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(width, 28.0), Sense::click());
  let (fill, border) = match (selected, resp.hovered()) {
    (true, _) => (theme::WASH_HOVER, theme::fade(Color32::WHITE, 0.8)),
    (false, true) => (theme::WASH, theme::LINE_STRONG),
    (false, false) => (Color32::TRANSPARENT, theme::LINE),
  };
  ui.painter().rect(rect, theme::RADIUS, fill, Stroke::new(1.0, border), egui::StrokeKind::Inside);
  ui.painter().text(rect.center(), Align2::CENTER_CENTER, label, FontId::new(12.5, theme::medium()), if selected { theme::INK } else { theme::MUTED });
  resp.widget_info(|| egui::WidgetInfo::selected(egui::WidgetType::Button, true, selected, label));
  resp.on_hover_text(tooltip).on_hover_cursor(egui::CursorIcon::PointingHand)
}

/// A setting's name, its value at the right, and a slider across the popover.
fn labeled_slider<N: egui::emath::Numeric>(ui: &mut Ui, name: &str, value: &str, number: &mut N, range: RangeInclusive<N>, step: f64) {
  ui.horizontal(|ui| {
    setting_name(ui, name);
    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| setting_value(ui, value));
  });
  full_slider(ui, number, range, step);
  ui.add_space(4.0);
}

fn full_slider<N: egui::emath::Numeric>(ui: &mut Ui, number: &mut N, range: RangeInclusive<N>, step: f64) -> Response {
  ui.style_mut().spacing.slider_width = ui.available_width();
  ui.add(egui::Slider::new(number, range).step_by(step).show_value(false))
}

fn setting_name(ui: &mut Ui, name: &str) {
  ui.label(egui::RichText::new(name).size(12.0).color(theme::MUTED));
}

fn setting_value(ui: &mut Ui, value: &str) {
  ui.label(egui::RichText::new(value).size(12.0).family(theme::semibold()).color(theme::INK));
}

fn padded(ui: &mut Ui, content: impl FnOnce(&mut Ui)) {
  egui::Frame::new().inner_margin(egui::Margin::symmetric(8, 6)).show(ui, content);
}

fn hairline(ui: &mut Ui) {
  let (line, _) = ui.allocate_exact_size(vec2(ui.available_width(), 1.0), Sense::hover());
  ui.painter().rect_filled(line, 0.0, theme::fade(Color32::WHITE, 0.1));
}

/// The key a stored value names (Auto for anything unknown): value, label, short label.
fn musical_key(value: &str) -> &'static (&'static str, &'static str, &'static str) {
  MUSICAL_KEYS.iter().find(|k| k.0 == value).unwrap_or(&MUSICAL_KEYS[0])
}

/// The audio player's key for a reference clip.
fn ref_key(id: u64) -> String {
  format!("ref:{id}")
}

/// A slider's value to two decimals (0.05 steps drift in `f32`).
fn hundredths(value: f32) -> f64 {
  (f64::from(value) * 100.0).round() / 100.0
}

/// "audio", "audio or image" (for the drop toasts).
fn accepted_kinds(m: &ModelInfo) -> String {
  let kinds: Vec<&str> = [("audio", m.audio_refs_max), ("image", m.image_refs_max)].into_iter().filter(|(_, n)| *n > 0).map(|(k, _)| k).collect();
  if kinds.is_empty() {
    "reference".to_owned()
  } else {
    kinds.join(" or ")
  }
}

fn duration_message() -> String {
  format!("Total audio duration cannot exceed {}s", MAX_REF_SECS as u32)
}

/// What a failed generate tells the user: out of credits, an outage, or the server's message.
fn failure_message(message: &str, status: Option<u16>) -> String {
  match status {
    Some(402) => "Not enough credits for this generation".to_owned(),
    Some(code) if code >= 500 => OUTAGE_MESSAGE.to_owned(),
    _ if message.is_empty() => "Failed to start audio generation".to_owned(),
    _ => message.to_owned(),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn model(json: Value) -> ModelInfo {
    models::audio_model(&serde_json::from_value(json).expect("audio model"))
  }

  /// The server's audio models (`configs/omni_gen/audio_models.rs`).
  fn suno_music() -> ModelInfo {
    model(json!({ "model": "suno_music", "style_prompt_supported": true, "instrumental_toggle_supported": true }))
  }

  fn suno_sounds() -> ModelInfo {
    model(json!({ "model": "suno_sounds", "loopable_toggle_supported": true, "bpm_supported": true, "musical_key_supported": true }))
  }

  fn suno_remix() -> ModelInfo {
    model(json!({ "model": "suno_remix", "style_prompt_supported": true, "keep_lyrics_supported": true, "audio_references_supported": true, "audio_references_max": 1 }))
  }

  fn seed_audio() -> ModelInfo {
    model(json!({ "model": "seed_audio_1p0", "audio_references_supported": true, "audio_references_max": 3, "image_references_supported": true, "image_references_max": 1, "sample_rate_hz_options": [8000, 16000, 24000, 32000, 44100, 48000], "sample_rate_hz_default": 24000, "speed_supported": true, "volume_supported": true, "pitch_supported": true }))
  }

  fn page(settings: AudioSettings) -> CreateAudioPage {
    CreateAudioPage { settings, ..Default::default() }
  }

  fn audio_ref(token: &str, secs: f32) -> RefMedia {
    RefMedia::from_library(RefKind::Audio, token.into(), None, Some(format!("https://cdn/{token}.mp3")), secs)
  }

  mod request_bodies {
    use super::*;

    #[test]
    fn suno_music_sends_only_what_it_takes() {
      let p = page(AudioSettings { prompt: "  lofi beat ".into(), style_prompt: " chill ".into(), instrumental: true, keep_lyrics: true, bpm: Some(90), ..Default::default() });
      assert_eq!(Value::Object(p.fields(&suno_music(), false)), json!({ "model": "suno_music", "prompt": "lofi beat", "style_prompt": "chill", "is_instrumental": true }));
    }

    #[test]
    fn suno_sounds_sends_its_toggles_beat_and_key() {
      let mut p = page(AudioSettings { prompt: "door creak".into(), ..Default::default() });
      assert_eq!(Value::Object(p.fields(&suno_sounds(), false)), json!({ "model": "suno_sounds", "prompt": "door creak", "is_loopable": false, "musical_key": "auto" }), "Auto BPM is left to the model");
      p.settings.bpm = Some(128);
      p.settings.musical_key = "c_minor".into();
      let f = p.fields(&suno_sounds(), false);
      assert_eq!((f["bpm"].clone(), f["musical_key"].clone()), (json!(128), json!("c_minor")));
    }

    #[test]
    fn seed_audio_sends_references_and_tuning() {
      let mut p = page(AudioSettings { prompt: "rain".into(), speed: 1.05, volume: 0.5, pitch: -3, sample_rate_hz: Some(11025), ..Default::default() });
      p.refs.audios = vec![audio_ref("mf_a", 10.0), audio_ref("mf_b", 20.0)];
      assert_eq!(Value::Object(p.fields(&seed_audio(), false)), json!({ "model": "seed_audio_1p0", "prompt": "rain", "audio_media_tokens": ["mf_a", "mf_b"], "sample_rate_hz": 24000, "speed": 1.05, "volume": 0.5, "pitch": -3 }));
    }

    #[test]
    fn estimates_count_references_without_the_prompt() {
      let mut p = page(AudioSettings { prompt: "rain".into(), sample_rate_hz: Some(44100), ..Default::default() });
      p.refs.audios = vec![RefMedia::uploading(RefKind::Audio, None), audio_ref("mf_b", 5.0)];
      assert_eq!(Value::Object(p.fields(&seed_audio(), true)), json!({ "model": "seed_audio_1p0", "audio_media_tokens": ["placeholder", "placeholder"], "sample_rate_hz": 44100 }));
      assert_eq!(Value::Object(p.fields(&suno_music(), true)), json!({ "model": "suno_music" }), "references the model can't take don't count");
    }
  }

  mod rules {
    use super::*;

    #[test]
    fn remixes_need_exactly_one_track() {
      let mut p = page(AudioSettings::default());
      assert!(p.missing_required_ref(&suno_remix()));
      assert!(!p.missing_required_ref(&suno_music()));
      p.refs.audios.push(audio_ref("mf_a", 30.0));
      assert!(!p.missing_required_ref(&suno_remix()));
      p.refs.audios.push(audio_ref("mf_b", 30.0));
      assert!(p.missing_required_ref(&suno_remix()), "two tracks are too many");
    }

    #[test]
    fn library_picks_respect_slots_the_cap_and_drop_the_image() {
      let mut catalog = Catalog::default();
      catalog.set_audio(vec![seed_audio()]);
      let mut p = page(AudioSettings { model: Some("seed_audio_1p0".into()), ..Default::default() });
      p.refs.images.push(RefMedia::from_library(RefKind::Image, "mf_img".into(), None, None, 0.0));
      let mut toasts = Toasts::default();
      p.attach_from_library(&mut toasts, &catalog, RefKind::Audio, vec![audio_ref("mf_a", 400.0), audio_ref("mf_b", 300.0), audio_ref("mf_c", 10.0)]);
      let tokens: Vec<_> = p.refs.audios.iter().filter_map(|r| r.token.as_deref()).collect();
      assert_eq!(tokens, ["mf_a"], "the second would pass 600s, so picking stops there");
      assert!(p.refs.images.is_empty(), "audio and an image don't mix");
    }

    #[test]
    fn uploads_past_the_cap_are_dropped() {
      let mut p = page(AudioSettings::default());
      p.refs.audios = vec![audio_ref("mf_a", 590.0), audio_ref("mf_b", 30.0)];
      let late = p.refs.audios[1].id;
      p.check_durations(&mut Toasts::default(), late);
      assert_eq!(p.refs.audios.len(), 1);
    }

    #[test]
    fn failures_explain_credits_and_outages() {
      assert_eq!(failure_message("Payment required", Some(402)), "Not enough credits for this generation");
      assert_eq!(failure_message("boom", Some(503)), OUTAGE_MESSAGE);
      assert_eq!(failure_message("Prompt too long", Some(400)), "Prompt too long");
      assert_eq!(failure_message("", None), "Failed to start audio generation");
    }
  }

  /// The toolbar headlessly (egui_kittest): toggles, Beat & Key and Tuning.
  mod toolbar {
    use egui_kittest::Harness;
    use egui_kittest::kittest::{NodeT, Queryable};

    use super::*;

    struct State {
      caps: AudioCaps,
      settings: AudioSettings,
      fonts_ready: bool,
    }

    #[test]
    fn toggles_show_per_model_and_flip() {
      let mut harness = build(suno_music().audio);
      assert!(harness.query_by_label("Loop").is_none(), "Suno Music has no loop toggle");
      harness.get_by_label("Instrumental").click();
      harness.run();
      assert!(harness.state().settings.instrumental);
    }

    #[test]
    fn beat_and_key_sets_the_key_and_bpm() {
      let mut harness = build(suno_sounds().audio);
      harness.get_by_label("Auto BPM \u{b7} Auto").click();
      harness.run();
      harness.get_by_label("Cm").click();
      harness.run();
      assert_eq!(harness.state().settings.musical_key, "c_minor");
      assert!(harness.query_by_label("Auto BPM \u{b7} Cm").is_some(), "the pill shows the key");
    }

    #[test]
    fn tuning_picks_a_sample_rate() {
      let mut harness = build(seed_audio().audio);
      harness.get_by_label("Tuning").click();
      harness.run();
      // egui reports a selected button as toggled.
      assert!(harness.query_by_label("24 kHz").is_some_and(|n| n.accesskit_node().toggled() == Some(egui::accesskit::Toggled::True)), "the default is selected");
      harness.get_by_label("44.1 kHz").click();
      harness.run();
      assert_eq!(harness.state().settings.sample_rate_hz, Some(44100));
    }

    fn build(caps: AudioCaps) -> Harness<'static, State> {
      let mut harness = Harness::builder().with_size(egui::vec2(1000.0, 600.0)).build_ui_state(
        |ui, s: &mut State| {
          if !s.fonts_ready {
            crate::theme::apply(ui.ctx());
            s.fonts_ready = true;
            return;
          }
          ui.add_space(400.0);
          ui.horizontal(|ui| audio_toolbar(ui, &s.caps, &mut s.settings));
        },
        State { caps, settings: AudioSettings::default(), fonts_ready: false },
      );
      harness.run();
      harness
    }
  }
}
