//! What the create pages share: the page shell (`DesktopCreatePageShell`), uploading references,
//! cost-estimate bookkeeping and the app-level requests pages make.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use egui::{Align2, Color32, Id, Mesh, Order, Rect, Ui, pos2, vec2};
use serde_json::{Map, Value};

use crate::backend::media_cache::MediaCache;
use crate::backend::{Backend, Modality, UploadedMedia};
use crate::feed::grid::{self, FeedAction, FeedView, RatioCache, ViewMode};
use crate::feed::store::FeedStore;
use crate::feed::types::MediaKind;
use crate::models::Catalog;
use crate::prompt_box;
use crate::prompt_box::refs::{ImageSlot, RefKind, RefMedia, RefStatus, References};
use crate::theme;
use crate::ui::toast::Toasts;
use crate::ui::widgets;

/// How long settings must sit still before a cost estimate is requested.
const COST_DEBOUNCE_SECS: f64 = 0.3;
/// Gap between the prompt box and the window's bottom edge (`bottom-4`).
const BOX_BOTTOM: f32 = 16.0;

/// The app services a page can use this frame.
pub struct Env<'a> {
  pub ctx: egui::Context,
  pub backend: &'a Backend,
  pub cache: &'a mut MediaCache,
  pub toasts: &'a mut Toasts,
  pub catalog: &'a Catalog,
  pub signed_in: bool,
  pub enter_to_generate: bool,
  pub view_mode: ViewMode,
  pub ratios: &'a mut RatioCache,
  pub prompts: &'a std::collections::HashMap<String, String>,
  pub requests: &'a mut Vec<AppRequest>,
}

/// Things only the app can do.
#[derive(Debug)]
pub enum AppRequest {
  SignIn,
  Open { kind: MediaKind, token: String },
  PickFromLibrary { kind: RefKind, slot: ImageSlot, max: usize, page: MediaKind },
  MakeVideo { token: String },
  Recreate { kind: MediaKind, token: String },
  Share(String),
  Download(Vec<String>),
  CopyText(String),
  Preview(String),
  LoadMoreLibrary(FeedKey),
}

/// Which feed a library page is for.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum FeedKey {
  Image,
  Video,
  Library,
}

impl FeedKey {
  pub fn of(kind: MediaKind) -> Self {
    match kind {
      MediaKind::Image => FeedKey::Image,
      MediaKind::Video => FeedKey::Video,
    }
  }

  /// The library's media class filter.
  pub fn media_classes(self) -> &'static str {
    match self {
      FeedKey::Image => "image",
      FeedKey::Video => "video",
      FeedKey::Library => "image,video",
    }
  }
}

/// The page around the feed: the splash empty state (or the feed), a fade behind the prompt box,
/// and the prompt box (drawn by `prompt_box`) floating at the bottom centre.
#[allow(clippy::too_many_arguments)]
pub fn create_shell(ui: &mut Ui, env: &mut Env<'_>, kind: MediaKind, title: &str, subtitle: &str, feed: &mut FeedStore, box_height: &mut f32, prompt_box: impl FnOnce(&mut Ui, &mut Env<'_>)) {
  let area = ui.max_rect();
  let bottom_offset = *box_height + 40.0;
  if feed.has_content() {
    let view = FeedView { id: Id::new(("feed", kind.label())), mode: env.view_mode, pending: &feed.pending, failed: &feed.failed, items: &feed.items, has_more: feed.has_more, loading: feed.loading, selecting: feed.selecting, selected: &feed.selected, last_viewed: feed.last_viewed.as_deref(), prompts: env.prompts, make_video: kind == MediaKind::Image, bottom_padding: bottom_offset + 24.0 };
    let mut feed_ui = ui.new_child(egui::UiBuilder::new().max_rect(area.shrink2(vec2(12.0, 0.0))));
    let actions = grid::show(&mut feed_ui, &view, env.cache, env.ratios, env.catalog);
    handle_feed_actions(env, kind, feed, actions);
    bottom_fade(ui, area);
  } else {
    empty_state(ui, env, area, bottom_offset, title, subtitle);
  }
  if env.signed_in && !feed.library_started() {
    env.requests.push(AppRequest::LoadMoreLibrary(FeedKey::of(kind)));
  }
  if feed.selecting {
    selection_bar(ui, area, *box_height + 32.0, feed, kind, env.requests);
  }

  let width = (area.width() - 32.0).min(prompt_box::MAX_WIDTH);
  let pos = pos2(area.center().x, area.bottom() - BOX_BOTTOM);
  let response = egui::Area::new(Id::new(("prompt-box", kind.label()))).order(Order::Middle).pivot(Align2::CENTER_BOTTOM).fixed_pos(pos).show(ui.ctx(), |ui| {
    ui.set_width(width);
    prompt_box(ui, env);
  });
  *box_height = response.response.rect.height();
}

fn handle_feed_actions(env: &mut Env<'_>, kind: MediaKind, feed: &mut FeedStore, actions: Vec<FeedAction>) {
  for action in actions {
    match action {
      FeedAction::Open(token) => {
        feed.last_viewed = Some(token.clone());
        env.requests.push(AppRequest::Open { kind, token });
      },
      FeedAction::ToggleSelect(token) => {
        if !feed.selected.remove(&token) {
          feed.selected.insert(token);
        }
      },
      FeedAction::DismissFailed(job) => feed.dismiss(&job),
      FeedAction::LoadMore => env.requests.push(AppRequest::LoadMoreLibrary(FeedKey::of(kind))),
      FeedAction::Recreate(token) => env.requests.push(AppRequest::Recreate { kind, token }),
      FeedAction::MakeVideo(token) => env.requests.push(AppRequest::MakeVideo { token }),
      FeedAction::Share(token) => env.requests.push(AppRequest::Share(token)),
      FeedAction::Download(token) => env.requests.push(AppRequest::Download(vec![token])),
      FeedAction::CopyPrompt(text) => env.requests.push(AppRequest::CopyText(text)),
    }
  }
}

/// The floating "N selected · Download · ×" pill (`SelectionActionBar`), `bottom` above the
/// window's bottom edge.
pub fn selection_bar(ui: &Ui, area: Rect, bottom: f32, feed: &mut FeedStore, kind: MediaKind, requests: &mut Vec<AppRequest>) {
  let pos = pos2(area.center().x, area.bottom() - bottom);
  egui::Area::new(Id::new(("selection-bar", kind.label()))).order(Order::Foreground).pivot(Align2::CENTER_BOTTOM).fixed_pos(pos).show(ui.ctx(), |ui| {
    egui::Frame::new().fill(theme::fade(theme::PANEL, 0.95)).stroke(theme::hairline()).corner_radius(egui::CornerRadius::same(24)).inner_margin(egui::Margin::symmetric(10, 8)).shadow(theme::shadow()).show(ui, |ui| {
      ui.horizontal(|ui| {
        ui.spacing_mut().item_spacing.x = 10.0;
        ui.add_space(6.0);
        ui.label(egui::RichText::new(format!("{} selected", feed.selected.len())).size(13.0).family(theme::medium()));
        let any = !feed.selected.is_empty();
        if ui.add_enabled_ui(any, |ui| widgets::button(ui, Some(crate::ui::icons::Icon::Download), "Download", widgets::Kind::Secondary, 0.0, 30.0)).inner.clicked() {
          requests.push(AppRequest::Download(feed.selected.iter().cloned().collect()));
        }
        if widgets::ghost(ui, crate::ui::icons::Icon::X, None, "Exit selection", false).clicked() {
          feed.selecting = false;
          feed.selected.clear();
        }
      });
    });
  });
}

/// The splash: a bordered section with corner marks, the page title and a sign-in prompt for
/// visitors (`CreateEmptyState`).
fn empty_state(ui: &mut Ui, env: &mut Env<'_>, area: Rect, bottom_offset: f32, title: &str, subtitle: &str) {
  let usable = Rect::from_min_max(area.min, pos2(area.right(), area.bottom() - bottom_offset));
  let width = (usable.width() - 64.0).min(768.0);
  let height = if env.signed_in { 190.0 } else { 250.0 };
  let section = Rect::from_center_size(usable.center(), vec2(width, height));
  let p = ui.painter();
  p.rect(section, 0.0, Color32::from_rgba_unmultiplied(242, 241, 238, 4), egui::Stroke::new(1.0, Color32::from_rgba_unmultiplied(242, 241, 238, 51)), egui::StrokeKind::Inside);
  widgets::corner_marks(p, section);
  let mut child = ui.new_child(egui::UiBuilder::new().max_rect(section.shrink2(vec2(40.0, 52.0))));
  child.label(widgets::heading(title, 48.0));
  child.add_space(12.0);
  child.label(egui::RichText::new(subtitle).size(16.0).color(theme::MUTED));
  if !env.signed_in {
    child.add_space(24.0);
    if widgets::button(&mut child, Some(crate::ui::icons::Icon::Sparkles), "Sign in to create", widgets::Kind::Primary, 0.0, 44.0).clicked() {
      env.requests.push(AppRequest::SignIn);
    }
  }
}

/// The 192 px fade behind the floating prompt box (`h-48 from-ui-background`).
fn bottom_fade(ui: &Ui, area: Rect) {
  let band = Rect::from_min_max(pos2(area.left(), area.bottom() - 192.0), area.max);
  let mut mesh = Mesh::default();
  let (top, bottom) = (Color32::TRANSPARENT, theme::BG);
  mesh.colored_vertex(band.left_top(), top);
  mesh.colored_vertex(band.right_top(), top);
  mesh.colored_vertex(band.right_bottom(), bottom);
  mesh.colored_vertex(band.left_bottom(), bottom);
  mesh.add_triangle(0, 1, 2);
  mesh.add_triangle(0, 2, 3);
  // Same layer as the feed (painted after it), so it stays under the floating prompt box.
  ui.painter().add(mesh);
}

/// The selected model, else the page default, else the first.
pub fn selected_model<'a>(models: &'a [crate::models::ModelInfo], selected: Option<&str>, default_id: &str) -> Option<&'a crate::models::ModelInfo> {
  selected.and_then(|id| models.iter().find(|m| m.id == id)).or_else(|| models.iter().find(|m| m.id == default_id)).or_else(|| models.first())
}

// --- References -------------------------------------------------------------------------------

/// Starts uploading `path` into `slot` (or the deck for videos and audio).
pub fn upload_path(env: &mut Env<'_>, refs: &mut References, path: &Path, kind: RefKind, slot: ImageSlot) {
  if kind == RefKind::Video && !path.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("mp4")) {
    env.toasts.error("Failed to upload video. Please upload an MP4 file.");
    return;
  }
  let mut item = RefMedia::uploading(kind, None);
  if kind == RefKind::Image {
    let key = format!("local://{}", item.id);
    match std::fs::read(path) {
      Ok(bytes) => {
        env.cache.insert_bytes(&env.ctx, &key, Arc::from(bytes));
        item.preview = Some(key);
      },
      Err(err) => {
        env.toasts.error(format!("Couldn't read {}: {err}", file_name(path)));
        return;
      },
    }
  }
  env.backend.upload_file(item.id, kind, path.to_path_buf());
  place(refs, item, slot);
}

/// Uploads a pasted image (PNG bytes) into `slot`.
pub fn upload_png(env: &mut Env<'_>, refs: &mut References, png: Vec<u8>, slot: ImageSlot) {
  let mut item = RefMedia::uploading(RefKind::Image, None);
  let key = format!("local://{}", item.id);
  env.cache.insert_bytes(&env.ctx, &key, Arc::from(png.clone()));
  item.preview = Some(key);
  env.backend.upload_png(item.id, png);
  place(refs, item, slot);
}

fn place(refs: &mut References, item: RefMedia, slot: ImageSlot) {
  match (item.kind, slot) {
    (RefKind::Image, ImageSlot::FirstFrame) => refs.first_frame = Some(item),
    (RefKind::Image, ImageSlot::LastFrame) => refs.last_frame = Some(item),
    (kind, _) => refs.list_mut(kind).push(item),
  }
}

/// Applies a finished upload. Returns `false` (and drops the reference) when it failed.
pub fn apply_upload(toasts: &mut Toasts, refs: &mut References, ref_id: u64, result: Result<UploadedMedia, String>) -> bool {
  match result {
    Ok(media) => {
      if let Some(r) = refs.find_mut(ref_id) {
        r.status = RefStatus::Ready;
        r.token = Some(media.token);
        r.duration_secs = media.duration_secs;
        r.full_url = media.full_url;
        if r.preview.is_none() {
          r.preview = media.thumbnail;
        }
      }
      true
    },
    Err(message) => {
      let kind = refs.find_mut(ref_id).map_or("file", |r| r.kind.noun());
      refs.remove(ref_id);
      toasts.error(format!("Failed to upload {kind}: {message}"));
      false
    },
  }
}

/// Picked library media, ready to attach.
pub fn attach_from_library(refs: &mut References, kind: RefKind, slot: ImageSlot, picks: Vec<RefMedia>) {
  for pick in picks {
    let already = refs.list(kind).iter().chain(refs.first_frame.iter()).chain(refs.last_frame.iter()).any(|r| r.token == pick.token);
    if !already {
      place(refs, RefMedia { kind, ..pick }, slot);
    }
  }
}

/// Asks the user for files of `kinds` (`multiple` for decks).
pub fn pick_files(kinds: &[RefKind], multiple: bool) -> Vec<PathBuf> {
  let mut dialog = rfd::FileDialog::new();
  for kind in kinds {
    let (name, exts): (&str, &[&str]) = match kind {
      RefKind::Image => ("Images", &["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"]),
      RefKind::Video => ("Videos (MP4)", &["mp4"]),
      RefKind::Audio => ("Audio", &["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"]),
    };
    dialog = dialog.add_filter(name, exts);
  }
  if multiple {
    dialog.pick_files().unwrap_or_default()
  } else {
    dialog.pick_file().into_iter().collect()
  }
}

pub fn file_name(path: &Path) -> String {
  path.file_name().and_then(|n| n.to_str()).unwrap_or("file").to_owned()
}

// --- Cost estimates ---------------------------------------------------------------------------

/// The latest cost estimate for a page, requested when the settings settle.
#[derive(Default)]
pub struct CostState {
  /// The request the estimate below is for.
  key: String,
  pub credits: Option<u64>,
  pending_key: Option<(String, f64)>,
}

impl CostState {
  /// Requests an estimate for `fields` once they've been stable for a moment.
  pub fn update(&mut self, ui: &Ui, backend: &Backend, modality: Modality, fields: &Map<String, Value>) {
    let key = Value::Object(fields.clone()).to_string();
    if key == self.key {
      return;
    }
    let now = ui.input(|i| i.time);
    match &self.pending_key {
      Some((k, since)) if *k == key => {
        if now - since >= COST_DEBOUNCE_SECS {
          self.key = key.clone();
          self.credits = None;
          self.pending_key = None;
          backend.estimate_cost(modality, key, fields.clone());
        } else {
          ui.ctx().request_repaint_after(std::time::Duration::from_secs_f64(COST_DEBOUNCE_SECS));
        }
      },
      _ => {
        self.pending_key = Some((key, now));
        ui.ctx().request_repaint_after(std::time::Duration::from_secs_f64(COST_DEBOUNCE_SECS));
      },
    }
  }

  /// Takes an estimate that arrived for `key`.
  pub fn apply(&mut self, key: &str, credits: Option<u64>) {
    if key == self.key {
      self.credits = credits;
    }
  }
}
