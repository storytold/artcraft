//! The model catalog: capabilities come from the server's OmniGen listing (so new models and
//! options show up without an app update); names, descriptions, families and typical durations
//! are filled in here when the server doesn't say.

use crate::feed::grid::ModelNames;
use crate::feed::types::MediaKind;

/// Default models (`defaultModelForPage.ts`).
pub const DEFAULT_IMAGE_MODEL: &str = "nano_banana_pro";
pub const DEFAULT_VIDEO_MODEL: &str = "seedance_2p0";
pub const DEFAULT_AUDIO_MODEL: &str = "suno_music";
/// The fallback prompt limit (`maxPromptLength ?? 1000`).
pub const DEFAULT_PROMPT_MAX: usize = 1000;
/// The model pickers group by family once they list this many models.
const GROUP_THRESHOLD: usize = 8;
/// Audio models that work from exactly one audio track (`AUDIO_MODELS_REQUIRING_AUDIO_REF`).
const AUDIO_MODELS_REQUIRING_AUDIO_REF: [&str; 2] = ["suno_remix", "suno_sample"];
/// The musical keys (`SoundsSettingsPopover`; there are no E keys): value, label, short label.
pub const MUSICAL_KEYS: [(&str, &str, &str); 13] = [("auto", "Auto", "Auto"), ("c_major", "C Major", "C"), ("c_minor", "C Minor", "Cm"), ("d_major", "D Major", "D"), ("d_minor", "D Minor", "Dm"), ("f_major", "F Major", "F"), ("f_minor", "F Minor", "Fm"), ("g_major", "G Major", "G"), ("g_minor", "G Minor", "Gm"), ("a_major", "A Major", "A"), ("a_minor", "A Minor", "Am"), ("b_major", "B Major", "B"), ("b_minor", "B Minor", "Bm")];

/// One generation model and what it accepts.
#[derive(Clone, Debug, Default)]
pub struct ModelInfo {
  pub id: String,
  pub name: String,
  pub description: String,
  /// Snake-case maker (`google`, `bytedance`, …), for the logo.
  pub creator: String,
  pub family: String,
  pub disabled: bool,
  pub prompt_supported: bool,
  /// `None` = unlimited.
  pub prompt_max: Option<usize>,
  pub aspect_ratios: Vec<String>,
  pub aspect_default: Option<String>,
  pub resolutions: Vec<String>,
  pub resolution_default: Option<String>,
  pub qualities: Vec<String>,
  pub quality_default: Option<String>,
  pub batch_sizes: Vec<u16>,
  pub batch_default: u16,
  pub image_refs_max: usize,
  // Video only.
  pub text_to_video: bool,
  pub start_frame: bool,
  pub start_frame_required: bool,
  pub end_frame: bool,
  pub sound_toggle: bool,
  pub video_refs_max: usize,
  pub video_refs_max_secs: Option<u16>,
  pub audio_refs_max: usize,
  pub audio_refs_max_secs: Option<u16>,
  /// `@Character` mentions (0 = not supported).
  pub character_refs_max: usize,
  pub duration_options: Vec<u16>,
  pub duration_min: Option<u16>,
  pub duration_max: Option<u16>,
  pub duration_max_with_refs: Option<u16>,
  pub duration_default: Option<u16>,
  pub bitrates: Vec<String>,
  pub bitrate_default: Option<String>,
  pub output_formats: Vec<String>,
  pub output_format_default: Option<String>,
  /// Audio only.
  pub audio: AudioCaps,
  /// How long a generation usually takes (drives the estimated progress bar).
  pub expected_secs: f32,
}

/// What an audio model takes besides the prompt and references.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct AudioCaps {
  pub style_prompt: bool,
  pub instrumental: bool,
  pub keep_lyrics: bool,
  pub loopable: bool,
  pub bpm: bool,
  pub musical_key: bool,
  pub sample_rates: Vec<u32>,
  pub sample_rate_default: Option<u32>,
  pub speed: bool,
  pub volume: bool,
  pub pitch: bool,
  /// Remixes and samples work from exactly one audio track.
  pub requires_audio_ref: bool,
}

impl AudioCaps {
  /// Whether the Tuning popover shows.
  pub fn has_tuning(&self) -> bool {
    !self.sample_rates.is_empty() || self.speed || self.volume || self.pitch
  }

  /// `picked` if the model offers it, else its default, else its first rate.
  pub fn sample_rate(&self, picked: Option<u32>) -> Option<u32> {
    picked.filter(|hz| self.sample_rates.contains(hz)).or(self.sample_rate_default).or_else(|| self.sample_rates.first().copied())
  }
}

impl ModelInfo {
  /// Batch sizes the count picker offers (`predefined` or `1..=max`).
  pub fn batch_options(&self) -> Vec<u16> {
    if self.batch_sizes.is_empty() {
      vec![1]
    } else {
      self.batch_sizes.clone()
    }
  }

  /// `count` if this model allows it, else its default.
  pub fn valid_batch(&self, count: u16) -> u16 {
    let options = self.batch_options();
    if options.contains(&count) {
      count
    } else if options.contains(&self.batch_default) {
      self.batch_default
    } else {
      options[0]
    }
  }

  /// `current` if supported, else the default, else the first option (`resolveQuality` & co.).
  pub fn resolve(current: Option<&str>, options: &[String], default: Option<&String>) -> Option<String> {
    match current {
      Some(c) if options.iter().any(|o| o == c) => Some(c.to_owned()),
      _ => default.filter(|d| options.is_empty() || options.contains(d)).cloned().or_else(|| options.first().cloned()),
    }
  }

  pub fn supports_reference_mode(&self) -> bool {
    self.image_refs_max > 0 || self.video_refs_max > 0 || self.audio_refs_max > 0
  }

  /// Whether the duration picker shows (a range or several options).
  pub fn duration_range(&self, with_refs: bool) -> Option<(u16, u16)> {
    let max = if with_refs { self.duration_max_with_refs.or(self.duration_max) } else { self.duration_max };
    match (self.duration_min, max) {
      (Some(min), Some(max)) if max > min => Some((min, max)),
      _ => {
        let (lo, hi) = (self.duration_options.iter().min()?, self.duration_options.iter().max()?);
        (hi > lo).then_some((*lo, *hi))
      },
    }
  }

  /// Snaps `current` into the model's duration range (preferring the higher neighbour), or its
  /// default (`resolveVideoDuration`).
  pub fn resolve_duration(&self, current: Option<u16>, with_refs: bool) -> Option<u16> {
    let default = self.duration_default.or_else(|| self.duration_options.first().copied()).or(self.duration_min);
    let current = current.or(default)?;
    if !self.duration_options.is_empty() {
      let cap = if with_refs { self.duration_max_with_refs } else { None };
      let mut options: Vec<u16> = self.duration_options.iter().copied().filter(|o| cap.is_none_or(|c| *o <= c)).collect();
      options.sort_unstable();
      return options.iter().copied().find(|&o| o >= current).or(options.last().copied()).or(default);
    }
    match self.duration_range(with_refs) {
      Some((min, max)) => Some(current.clamp(min, max)),
      None => default,
    }
  }
}

/// Builds a model from the server's image listing.
pub fn image_model(d: &artcraft_client::endpoints::omni_gen::models::image::omni_gen_list_image_models::OmniGenImageModelDetails) -> ModelInfo {
  let id = String::from(d.model.clone());
  let mut m = base(&id, MediaKind::Image, d.full_name.as_deref(), d.model_creator.clone().map(String::from));
  m.disabled = d.is_disabled.unwrap_or(false);
  m.prompt_supported = d.text_prompt_supported.unwrap_or(true);
  m.prompt_max = d.text_prompt_max_length.map(usize::from).or_else(|| default_prompt_max(&id));
  m.aspect_ratios = strings(&d.aspect_ratio_options);
  m.aspect_default = d.aspect_ratio_default.clone().map(String::from);
  m.resolutions = strings(&d.resolution_options);
  m.resolution_default = d.resolution_default.clone().map(String::from);
  m.qualities = strings(&d.quality_options);
  m.quality_default = d.default_quality.clone().map(String::from);
  m.batch_sizes = batch_sizes(d.batch_size_options.as_deref(), d.batch_size_min, d.batch_size_max);
  m.batch_default = d.batch_size_default.unwrap_or(1);
  m.image_refs_max = if d.image_refs_supported.unwrap_or(false) { d.image_refs_max.map_or(1, usize::from) } else { 0 };
  m
}

/// Builds a model from the server's video listing.
pub fn video_model(d: &artcraft_client::endpoints::omni_gen::models::video::omni_gen_list_video_models::OmniGenVideoModelDetails) -> ModelInfo {
  let id = String::from(d.model.clone());
  let mut m = base(&id, MediaKind::Video, d.full_name.as_deref(), d.model_creator.clone().map(String::from));
  if let Some(short) = d.extra_info_short.as_deref().filter(|s| !s.is_empty()) {
    m.description = short.to_owned();
  }
  m.disabled = d.is_disabled.unwrap_or(false);
  m.prompt_supported = d.text_prompt_supported.unwrap_or(true);
  m.prompt_max = d.text_prompt_max_length.map(usize::from).or_else(|| default_prompt_max(&id));
  m.text_to_video = d.text_to_video_supported.unwrap_or(true);
  m.start_frame = d.starting_keyframe_supported.unwrap_or(false);
  m.start_frame_required = d.starting_keyframe_required.unwrap_or(false);
  m.end_frame = d.ending_keyframe_supported.unwrap_or(false);
  m.sound_toggle = d.show_generate_with_sound_toggle.unwrap_or(false);
  let max = |supported: Option<bool>, max: Option<u16>| if supported.unwrap_or(false) { max.map_or(1, usize::from) } else { 0 };
  m.image_refs_max = max(d.image_references_supported, d.image_references_max);
  m.video_refs_max = max(d.video_references_supported, d.video_references_max);
  m.video_refs_max_secs = d.video_references_max_total_duration_seconds;
  m.audio_refs_max = max(d.audio_references_supported, d.audio_references_max);
  m.audio_refs_max_secs = d.audio_references_max_total_duration_seconds;
  m.character_refs_max = max(d.character_references_supported, d.character_references_max);
  m.aspect_ratios = strings(&d.aspect_ratio_options);
  m.aspect_default = d.aspect_ratio_default.clone().map(String::from);
  m.resolutions = strings(&d.resolution_options);
  m.resolution_default = d.resolution_default.clone().map(String::from);
  m.qualities = strings(&d.quality_options);
  m.quality_default = d.default_quality.clone().map(String::from);
  m.bitrates = strings(&d.bitrate_options);
  m.bitrate_default = d.bitrate_default.clone().map(String::from);
  m.output_formats = d.output_format_options.clone().unwrap_or_default();
  m.output_format_default = d.output_format_default.clone();
  m.duration_options = d.duration_seconds_options.clone().unwrap_or_default();
  m.duration_min = d.duration_seconds_min;
  m.duration_max = d.duration_seconds_max;
  m.duration_max_with_refs = d.duration_seconds_max_with_image_references;
  m.duration_default = d.duration_seconds_default;
  m.batch_sizes = batch_sizes(d.batch_size_options.as_deref(), d.batch_size_min, d.batch_size_max);
  m.batch_default = d.batch_size_default.unwrap_or(1);
  m
}

/// Builds a model from the server's audio listing.
pub fn audio_model(d: &crate::backend::wire::AudioModel) -> ModelInfo {
  let mut m = base(&d.model, MediaKind::Audio, d.full_name.as_deref(), d.model_creator.clone());
  if let Some(short) = d.extra_info_short.as_deref().filter(|s| !s.is_empty()) {
    m.description = short.to_owned();
  }
  m.disabled = d.is_disabled;
  m.prompt_supported = d.text_prompt_supported.unwrap_or(true);
  m.prompt_max = None;
  let max = |supported: bool, max: Option<u16>| if supported { max.map_or(1, usize::from) } else { 0 };
  m.audio_refs_max = max(d.audio_references_supported, d.audio_references_max);
  m.image_refs_max = max(d.image_references_supported, d.image_references_max);
  m.audio = AudioCaps { style_prompt: d.style_prompt_supported, instrumental: d.instrumental_toggle_supported, keep_lyrics: d.keep_lyrics_supported, loopable: d.loopable_toggle_supported, bpm: d.bpm_supported, musical_key: d.musical_key_supported, sample_rates: d.sample_rate_hz_options.clone(), sample_rate_default: d.sample_rate_hz_default, speed: d.speed_supported, volume: d.volume_supported, pitch: d.pitch_supported, requires_audio_ref: AUDIO_MODELS_REQUIRING_AUDIO_REF.contains(&d.model.as_str()) };
  m
}

fn strings<T: Clone + Into<String>>(options: &Option<Vec<T>>) -> Vec<String> {
  options.as_deref().unwrap_or_default().iter().cloned().map(Into::into).collect()
}

fn batch_sizes(options: Option<&[u16]>, min: Option<u16>, max: Option<u16>) -> Vec<u16> {
  match options.filter(|o| !o.is_empty()) {
    Some(options) => options.to_vec(),
    None => (min.unwrap_or(1).max(1)..=max.unwrap_or(1).max(1)).collect(),
  }
}

fn base(id: &str, kind: MediaKind, full_name: Option<&str>, creator: Option<String>) -> ModelInfo {
  // Known families use the pickers' curated names ("Flux 1 Dev", not "FLUX.1 [dev]"); models
  // the app doesn't know yet use the server's name.
  let name = if has_curated_name(id) { display_name(id) } else { full_name.filter(|n| !n.is_empty()).map_or_else(|| display_name(id), str::to_owned) };
  // The server reports "artcraft" for models it serves itself; show the actual maker when the id
  // says who that is (Nano Banana → Google), like the webapp.
  let creator = match creator.filter(|c| !c.is_empty() && c != "unknown") {
    Some(c) if c == "artcraft" && creator_for(id) != "artcraft" => creator_for(id).to_owned(),
    Some(c) => c,
    None => creator_for(id).to_owned(),
  };
  ModelInfo { id: id.to_owned(), name, description: description(id).to_owned(), creator, family: family(id).to_owned(), prompt_supported: true, text_to_video: true, batch_default: 1, expected_secs: expected_secs(id, kind), ..Default::default() }
}

/// Families whose picker names the app curates (the static model lists' `selectorName`s).
fn has_curated_name(id: &str) -> bool {
  const PREFIXES: [&str; 13] = ["flux_", "nano_banana", "gpt_image", "seedream", "seedance", "kling", "veo_", "sora", "happy_horse", "grok_imagine", "qwen", "suno", "seed_audio"];
  PREFIXES.iter().any(|p| id.starts_with(p))
}

/// A readable name for a model id: the irregular ones by table, the rest by rule
/// (`seedance_2p0_fast` → "Seedance 2.0 Fast").
pub fn display_name(id: &str) -> String {
  let special = match id {
    "nano_banana" | "gemini_25_flash" => "Nano Banana",
    "grok_image" => "Grok Image",
    "grok_imagine_image" => "Grok",
    "grok_imagine_video" => "Grok Video",
    "grok_imagine_image_q" => "Grok Imagine Quality",
    "gpt_image_1" => "GPT Image 1 (GPT-4o)",
    "flux_pro_1" => "Flux Pro (Inpainting)",
    "seedance_2p0_bp" => "Seedance 2.0 Plus",
    "seedance_2p0_bp_fast" => "Seedance 2.0 Plus Fast",
    "seedance_2p0_bp_mini" => "Seedance 2.0 Plus Mini",
    "seedance_2p0_bpu" => "Seedance 2.0 Plus Ultra",
    "seedance_2p0_bpu_fast" => "Seedance 2.0 Plus Ultra Fast",
    "seedance_2p0_bpu_mini" => "Seedance 2.0 Plus Ultra Mini",
    "marble_0p1_mini" => "Marble Mini",
    "marble_0p1_plus" => "Marble Plus",
    "minimax_h3" => "MiniMax H3",
    _ => "",
  };
  if !special.is_empty() {
    return special.to_owned();
  }
  let words: Vec<String> = id
    .split('_')
    .filter(|w| !w.is_empty())
    .map(|w| {
      let bytes = w.as_bytes();
      // "2p0" → "2.0", "1p5" → "1.5"
      if bytes[0].is_ascii_digit() && w.contains('p') && w.chars().all(|c| c.is_ascii_digit() || c == 'p') {
        return w.replace('p', ".");
      }
      match w {
        "gpt" => "GPT".to_owned(),
        "veo" => "Google Veo".to_owned(),
        "u" => "Ultra".to_owned(),
        "q" => "Quality".to_owned(),
        _ => {
          let mut c = w.chars();
          c.next().map_or_else(String::new, |f| f.to_uppercase().chain(c).collect())
        },
      }
    })
    .collect();
  words.join(" ")
}

/// A model's prompt limit when the listing doesn't give one (the static lists' `maxPromptLength`;
/// `None` = unlimited, unknown models get the desktop's 1000).
fn default_prompt_max(id: &str) -> Option<usize> {
  const LIMITS: [(&str, Option<usize>); 15] = [("nano_banana", None), ("gpt_image", None), ("seedance_2", None), ("seedance_1", Some(3000)), ("grok_imagine_video", Some(4096)), ("grok_video", Some(4096)), ("grok", Some(8000)), ("midjourney", Some(6000)), ("flux", Some(4000)), ("seedream", Some(4000)), ("qwen", Some(800)), ("kling", Some(2500)), ("happy_horse", Some(2500)), ("sora", Some(2000)), ("veo", Some(5000))];
  LIMITS.iter().find(|(prefix, _)| id.starts_with(prefix)).map_or(Some(DEFAULT_PROMPT_MAX), |(_, limit)| *limit)
}

/// The image picker's one-liners (`selectorDescription`).
fn description(id: &str) -> &'static str {
  match id {
    "grok_image" | "grok_imagine_image" => "Fast af",
    "midjourney" | "midjourney_7" | "midjourney_7_niji" | "midjourney_8" => "Stunning style and quality",
    "flux_pro_1p1_ultra" => "Higher quality model",
    "flux_pro_1p1" => "High quality model",
    "flux_1_dev" => "Fast, but lower quality",
    "flux_1_schnell" => "Fastest image gen, but lowest quality",
    "nano_banana" | "nano_banana_2" => "Fast instructive editing",
    "nano_banana_pro" => "Powerful instructive editing",
    "gpt_image_1" => "Slow, but super smart",
    "gpt_image_1p5" => "Faster, improved",
    "gpt_image_2" => "Smart with great text support",
    "gpt_image_2p5_flare" => "Precise edits, keeps subjects intact",
    "gpt_image_2p5_sunburst" => "Premium detail, slower",
    "seedream_4" | "seedream_4p5" | "seedream_5_lite" => "Fast",
    "grok_video" | "grok_imagine_video" => "Fastest video model",
    "sora_2" => "Smart video model",
    "veo_3" => "Slow, high-quality model",
    "suno_music" => "Full songs from a text prompt",
    "suno_remix" => "Remix an existing track",
    "suno_sounds" => "Sound effects with beat control",
    "suno_sample" => "Build a song from a sample",
    "seed_audio_1p0" => "Sound generation with fine tuning",
    _ => "",
  }
}

/// Typical generation time (the static list's `progressBarTime`, else the feed's per-kind default).
pub fn expected_secs(id: &str, kind: MediaKind) -> f32 {
  match id {
    "grok_image" | "grok_imagine_image" | "flux_pro_1p1" | "flux_1_dev" | "flux_1_schnell" => 10.0,
    "grok_video" | "grok_imagine_video" => 50.0,
    "nano_banana" | "nano_banana_2" | "nano_banana_pro" => 25.0,
    "flux_pro_1p1_ultra" => 35.0,
    "midjourney" | "midjourney_7" | "midjourney_7_niji" | "midjourney_8" => 45.0,
    "gpt_image_1" | "gpt_image_1p5" | "gpt_image_2p5_flare" | "seedream_4" | "seedream_4p5" | "seedream_5_lite" => 60.0,
    "gpt_image_2" | "gpt_image_2p5_sunburst" => 120.0,
    _ if kind == MediaKind::Video => 900.0,
    _ if kind == MediaKind::Audio => 120.0,
    _ => 30.0,
  }
}

/// The maker, by id prefix, when the server doesn't say.
pub fn creator_for(id: &str) -> &'static str {
  const PREFIXES: [(&str, &str); 18] = [("suno", "suno"), ("seed_audio", "bytedance"), ("flux", "black_forest_labs"), ("nano_banana", "google"), ("gemini", "google"), ("veo", "google"), ("imagen", "google"), ("gpt_image", "openai"), ("sora", "openai"), ("seedream", "bytedance"), ("seedance", "bytedance"), ("seededit", "bytedance"), ("kling", "kling"), ("grok", "grok"), ("midjourney", "midjourney"), ("qwen", "alibaba"), ("happy_horse", "alibaba"), ("minimax", "minimax")];
  PREFIXES.iter().find(|(p, _)| id.starts_with(p)).map_or("artcraft", |(_, c)| c)
}

/// The picker family (`getModelFamilyName`).
fn family(id: &str) -> &'static str {
  const FAMILIES: [(&str, &str); 23] = [("seed_audio", "Seed Audio"), ("seedance", "Seedance"), ("kling", "Kling"), ("veo", "Veo"), ("sora", "Sora"), ("happy_horse", "Happy Horse"), ("wan", "Wan"), ("vidu", "Vidu"), ("preview", "Preview"), ("nano_banana", "Nano Banana"), ("gemini_25_flash", "Nano Banana"), ("seedream", "Seedream"), ("seededit", "SeedEdit"), ("gpt_image", "GPT Image"), ("flux", "Flux"), ("midjourney", "Midjourney"), ("grok", "Grok"), ("qwen", "Qwen"), ("recraft", "Recraft"), ("imagen", "Imagen"), ("minimax", "MiniMax"), ("marble", "World Labs"), ("suno", "Suno")];
  FAMILIES.iter().find(|(p, _)| id.starts_with(p)).map_or("Other", |(_, f)| f)
}

/// Family order in the picker (`FAMILY_ORDER`): video families, then image families; the rest
/// alphabetical, "Other" last.
fn family_rank(family: &str) -> (usize, String) {
  const ORDER: [&str; 17] = ["Seedance", "Kling", "Veo", "Sora", "Happy Horse", "Wan", "Vidu", "Grok", "Nano Banana", "Seedream", "GPT Image", "Flux", "Midjourney", "Qwen", "SeedEdit", "Recraft", "Imagen"];
  match ORDER.iter().position(|f| *f == family) {
    Some(i) => (i, String::new()),
    None if family == "Other" => (usize::MAX, String::new()),
    None => (ORDER.len(), family.to_owned()),
  }
}

/// A group of models in the picker.
pub struct Family<'a> {
  pub name: String,
  pub models: Vec<&'a ModelInfo>,
}

/// Groups `models` by family (when there are enough of them), newest variant first.
pub fn grouped(models: &[ModelInfo]) -> Option<Vec<Family<'_>>> {
  if models.len() < GROUP_THRESHOLD {
    return None;
  }
  let mut families: Vec<Family<'_>> = Vec::new();
  for m in models {
    match families.iter_mut().find(|f| f.name == m.family) {
      Some(f) => f.models.push(m),
      None => families.push(Family { name: m.family.clone(), models: vec![m] }),
    }
  }
  families.sort_by_key(|f| family_rank(&f.name));
  for f in &mut families {
    f.models.sort_by(|a, b| natural_desc(&a.name, &b.name));
  }
  Some(families)
}

/// Descending, comparing digit runs as numbers ("Seedream 4.5" before "Seedream 4").
fn natural_desc(a: &str, b: &str) -> std::cmp::Ordering {
  fn key(s: &str) -> Vec<(String, f64)> {
    s.split(|c: char| c.is_whitespace()).map(|w| (w.to_lowercase(), w.parse::<f64>().unwrap_or(-1.0))).collect()
  }
  let (ka, kb) = (key(a), key(b));
  for (x, y) in ka.iter().zip(&kb) {
    let ord = if x.1 >= 0.0 && y.1 >= 0.0 { y.1.total_cmp(&x.1) } else { y.0.cmp(&x.0) };
    if ord != std::cmp::Ordering::Equal {
      return ord;
    }
  }
  kb.len().cmp(&ka.len()).reverse()
}

/// The image page's list: text-to-image capable, enabled, sorted by name.
fn image_page_models(models: &[ModelInfo]) -> Vec<ModelInfo> {
  const HIDDEN: [&str; 2] = ["minimax_h3_turbo", "minimax_h3_ultra"];
  let mut list: Vec<ModelInfo> = models.iter().filter(|m| m.prompt_supported && !m.disabled && !HIDDEN.contains(&m.id.as_str())).cloned().collect();
  list.sort_by_key(|m| m.name.to_lowercase());
  list
}

/// The video page's list: enabled, without SwitchX, sorted by name.
fn video_page_models(models: &[ModelInfo]) -> Vec<ModelInfo> {
  let mut list: Vec<ModelInfo> = models.iter().filter(|m| !m.disabled && m.id != "switch_x").cloned().collect();
  list.sort_by_key(|m| m.name.to_lowercase());
  list
}

/// Every catalog, for looking up names in the feed, and each create page's picker list.
#[derive(Default)]
pub struct Catalog {
  pub image: Vec<ModelInfo>,
  pub video: Vec<ModelInfo>,
  pub audio: Vec<ModelInfo>,
  pub image_page: Vec<ModelInfo>,
  pub video_page: Vec<ModelInfo>,
  /// The audio page's list: enabled, in the server's order.
  pub audio_page: Vec<ModelInfo>,
}

impl Catalog {
  pub fn set_image(&mut self, models: Vec<ModelInfo>) {
    self.image_page = image_page_models(&models);
    self.image = models;
  }

  pub fn set_video(&mut self, models: Vec<ModelInfo>) {
    self.video_page = video_page_models(&models);
    self.video = models;
  }

  pub fn set_audio(&mut self, models: Vec<ModelInfo>) {
    self.audio_page = models.iter().filter(|m| !m.disabled).cloned().collect();
    self.audio = models;
  }

  pub fn find(&self, id: &str) -> Option<&ModelInfo> {
    self.image.iter().chain(&self.video).chain(&self.audio).find(|m| m.id == id)
  }
}

impl ModelNames for Catalog {
  fn display_name(&self, model_id: &str) -> String {
    self.find(model_id).map_or_else(|| display_name(model_id), |m| m.name.clone())
  }

  fn creator(&self, model_id: &str) -> String {
    self.find(model_id).map_or_else(|| creator_for(model_id).to_owned(), |m| m.creator.clone())
  }
}

/// Aspect ratio labels (`AspectRatioPicker`).
pub fn aspect_label(value: &str) -> String {
  match value {
    "auto" => "Auto",
    "square" => "Square",
    "wide_five_by_four" => "5:4 (Wide)",
    "wide_four_by_three" => "4:3 (Wide)",
    "wide_three_by_two" => "3:2 (Wide)",
    "wide_sixteen_by_nine" => "16:9 (Wide)",
    "wide_twenty_one_by_nine" => "21:9 (Wide)",
    "tall_four_by_five" => "4:5 (Tall)",
    "tall_three_by_four" => "3:4 (Tall)",
    "tall_two_by_three" => "2:3 (Tall)",
    "tall_nine_by_sixteen" => "9:16 (Tall)",
    "tall_nine_by_twenty_one" => "9:21 (Tall)",
    "auto_2k" => "Auto (2K)",
    "auto_3k" => "Auto (3K)",
    "auto_4k" => "Auto (4K)",
    "square_hd" => "Square (HD)",
    "wide" => "Wide",
    "tall" => "Tall",
    other => other,
  }
  .to_owned()
}

/// The proportions an aspect ratio's icon draws (`AspectRatioIcon`); `None` for the auto ones.
pub fn aspect_proportion(value: &str) -> Option<(f32, f32)> {
  Some(match value {
    "square" | "square_hd" => (1.0, 1.0),
    "wide" => (16.0, 10.0),
    "wide_five_by_four" => (5.0, 4.0),
    "wide_four_by_three" => (4.0, 3.0),
    "wide_three_by_two" => (3.0, 2.0),
    "wide_sixteen_by_nine" => (16.0, 9.0),
    "wide_twenty_one_by_nine" => (21.0, 9.0),
    "tall" => (10.0, 16.0),
    "tall_four_by_five" => (4.0, 5.0),
    "tall_three_by_four" => (3.0, 4.0),
    "tall_two_by_three" => (2.0, 3.0),
    "tall_nine_by_sixteen" => (9.0, 16.0),
    "tall_nine_by_twenty_one" => (9.0, 21.0),
    _ => return None,
  })
}

/// Resolution labels (`ResolutionPicker`).
pub fn resolution_label(value: &str) -> String {
  match value {
    "half_k" => "0.5K",
    "four_eighty_p" => "480p",
    "seven_twenty_p" => "720p",
    "one_k" => "1K",
    "ten_eighty_p" => "1080p",
    "two_k" => "2K",
    "three_k" => "3K",
    "four_k" => "4K",
    other => other,
  }
  .to_owned()
}

/// Whether a resolution is high definition (2K and up), for its SD/HD caption.
pub fn resolution_is_hd(value: &str) -> bool {
  matches!(value, "two_k" | "three_k" | "four_k")
}

/// Quality labels (`QualityPicker`).
pub fn quality_label(value: &str) -> String {
  match value {
    "auto" => "Auto",
    "max" => "Max",
    "xhigh" => "Extra high",
    "high" => "High",
    "medium" => "Medium",
    "low" => "Low",
    other => other,
  }
  .to_owned()
}

/// Sample rate labels (`formatSampleRateHz`): 44100 → "44.1 kHz", 24000 → "24 kHz".
pub fn sample_rate_label(hz: u32) -> String {
  if hz.is_multiple_of(1000) {
    format!("{} kHz", hz / 1000)
  } else {
    format!("{:.1} kHz", hz as f32 / 1000.0)
  }
}

/// Bitrate labels.
pub fn bitrate_label(value: &str) -> String {
  match value {
    "normal" => "Normal".to_owned(),
    "high" => "High".to_owned(),
    other => other.to_owned(),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn model(id: &str) -> ModelInfo {
    ModelInfo { id: id.to_owned(), name: display_name(id), family: family(id).to_owned(), batch_default: 1, ..Default::default() }
  }

  mod naming {
    use super::*;

    #[test]
    fn humanizes_versions_and_known_words() {
      assert_eq!(display_name("seedance_2p0_fast"), "Seedance 2.0 Fast");
      assert_eq!(display_name("veo_3p1"), "Google Veo 3.1");
      assert_eq!(display_name("gpt_image_2p5_flare"), "GPT Image 2.5 Flare");
      assert_eq!(display_name("kling_3p0_pro"), "Kling 3.0 Pro");
      assert_eq!(display_name("nano_banana"), "Nano Banana");
      assert_eq!(display_name("seedance_2p0_bpu"), "Seedance 2.0 Plus Ultra");
      assert_eq!(display_name("seed_audio_1p0"), "Seed Audio 1.0");
      assert_eq!(display_name("suno_music"), "Suno Music");
    }

    #[test]
    fn prefers_curated_names_and_the_real_maker() {
      let nb = base("nano_banana_pro", MediaKind::Image, Some("Nano Banana Pro"), Some("artcraft".into()));
      assert_eq!((nb.name.as_str(), nb.creator.as_str()), ("Nano Banana Pro", "google"));
      let flux = base("flux_1_dev", MediaKind::Image, Some("FLUX.1 [dev]"), Some("black_forest_labs".into()));
      assert_eq!(flux.name, "Flux 1 Dev");
      let mj = base("midjourney_7_niji", MediaKind::Image, Some("Midjourney v7 Niji (Anime)"), Some("midjourney".into()));
      assert_eq!((mj.name.as_str(), mj.creator.as_str()), ("Midjourney v7 Niji (Anime)", "midjourney"));
    }

    #[test]
    fn falls_back_to_creator_by_prefix() {
      assert_eq!(creator_for("seed_audio_1p0"), "bytedance");
      assert_eq!(creator_for("suno_remix"), "suno");
      assert_eq!(creator_for("seedream_4p5"), "bytedance");
      assert_eq!(creator_for("veo_3"), "google");
      assert_eq!(creator_for("something_new"), "artcraft");
    }

    #[test]
    fn prompt_limits_follow_the_static_lists() {
      assert_eq!(default_prompt_max("nano_banana_pro"), None);
      assert_eq!(default_prompt_max("seedance_2p0"), None);
      assert_eq!(default_prompt_max("seedance_1p5_pro"), Some(3000));
      assert_eq!(default_prompt_max("grok_imagine_video_1p5"), Some(4096));
      assert_eq!(default_prompt_max("grok_imagine_image"), Some(8000));
      assert_eq!(default_prompt_max("unknown_model"), Some(DEFAULT_PROMPT_MAX));
    }
  }

  mod options {
    use super::*;

    #[test]
    fn resolve_prefers_current_then_default_then_first() {
      let opts = vec!["square".to_owned(), "wide_sixteen_by_nine".to_owned()];
      let default = "wide_sixteen_by_nine".to_owned();
      assert_eq!(ModelInfo::resolve(Some("square"), &opts, Some(&default)).as_deref(), Some("square"));
      assert_eq!(ModelInfo::resolve(Some("tall"), &opts, Some(&default)).as_deref(), Some("wide_sixteen_by_nine"));
      assert_eq!(ModelInfo::resolve(None, &opts, None).as_deref(), Some("square"));
      assert_eq!(ModelInfo::resolve(None, &[], None), None);
    }

    #[test]
    fn audio_listing_maps_capabilities() {
      let d: crate::backend::wire::AudioModel = serde_json::from_value(serde_json::json!({ "model": "seed_audio_1p0", "model_creator": "artcraft", "audio_references_supported": true, "audio_references_max": 3, "image_references_supported": true, "sample_rate_hz_options": [8000, 24000, 44100], "sample_rate_hz_default": 24000, "speed_supported": true })).unwrap();
      let m = audio_model(&d);
      assert_eq!((m.name.as_str(), m.creator.as_str(), m.description.as_str()), ("Seed Audio 1.0", "bytedance", "Sound generation with fine tuning"));
      assert_eq!((m.audio_refs_max, m.image_refs_max, m.prompt_max), (3, 1, None));
      assert!(m.audio.has_tuning() && !m.audio.requires_audio_ref && !m.audio.style_prompt);
      assert_eq!(m.audio.sample_rate(Some(44100)), Some(44100));
      assert_eq!(m.audio.sample_rate(Some(11025)), Some(24000), "unsupported picks fall back to the default");
      let remix = audio_model(&serde_json::from_value(serde_json::json!({ "model": "suno_remix", "audio_references_supported": true })).unwrap());
      assert!(remix.audio.requires_audio_ref && !remix.audio.has_tuning());
      assert_eq!((remix.audio_refs_max, remix.audio.sample_rate(None)), (1, None));
      assert_eq!((sample_rate_label(44100).as_str(), sample_rate_label(24000).as_str()), ("44.1 kHz", "24 kHz"));
    }

    #[test]
    fn batch_counts_snap_to_valid_values() {
      let mut m = model("grok_imagine_image");
      m.batch_sizes = vec![6];
      m.batch_default = 6;
      assert_eq!(m.valid_batch(1), 6);
      m.batch_sizes = vec![1, 2, 3, 4];
      m.batch_default = 1;
      assert_eq!(m.valid_batch(3), 3);
      assert_eq!(m.valid_batch(9), 1);
    }

    #[test]
    fn durations_clamp_to_ranges_and_snap_to_options() {
      let mut m = model("seedance_2p0");
      m.duration_min = Some(4);
      m.duration_max = Some(15);
      m.duration_max_with_refs = Some(10);
      m.duration_default = Some(5);
      assert_eq!(m.resolve_duration(None, false), Some(5));
      assert_eq!(m.resolve_duration(Some(20), false), Some(15));
      assert_eq!(m.resolve_duration(Some(14), true), Some(10));
      assert_eq!(m.duration_range(false), Some((4, 15)));

      let mut m = model("sora_2");
      m.duration_options = vec![4, 8, 12];
      m.duration_default = Some(4);
      assert_eq!(m.resolve_duration(Some(6), false), Some(8));
      assert_eq!(m.resolve_duration(Some(20), false), Some(12));
      assert_eq!(m.duration_range(false), Some((4, 12)));
    }
  }

  mod grouping {
    use super::*;

    #[test]
    fn groups_large_lists_by_family_newest_first() {
      let ids = ["nano_banana", "nano_banana_pro", "nano_banana_2", "seedream_4", "seedream_4p5", "flux_1_dev", "gpt_image_1", "gpt_image_2"];
      let models: Vec<ModelInfo> = ids.iter().map(|id| model(id)).collect();
      let families = grouped(&models).expect("8 models group");
      let names: Vec<&str> = families.iter().map(|f| f.name.as_str()).collect();
      assert_eq!(names, ["Nano Banana", "Seedream", "GPT Image", "Flux"]);
      let seedream: Vec<&str> = families[1].models.iter().map(|m| m.name.as_str()).collect();
      assert_eq!(seedream, ["Seedream 4.5", "Seedream 4"]);
    }

    #[test]
    fn small_lists_stay_flat() {
      let models: Vec<ModelInfo> = ["veo_3", "sora_2"].iter().map(|id| model(id)).collect();
      assert!(grouped(&models).is_none());
    }
  }
}
