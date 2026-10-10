//! The generation feed as a masonry grid (`GenerationGridView`) or a list (`GenerationListView`):
//! running jobs first-class alongside failures and finished media, newest first, loading more as
//! the user scrolls. Audio plays in place, with its waveform.

use std::collections::{HashMap, HashSet};

use egui::{Align2, Color32, CornerRadius, FontFamily, FontId, Id, Mesh, Rect, Sense, Stroke, Ui, pos2, vec2};

use crate::backend::audio::AudioPlayer;
use crate::backend::media_cache::{Lookup, MediaCache};
use crate::feed::types::{FailedJob, FeedItem, MediaKind, PendingJob, pending_status, time_ago};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::{creator_icons, waveform, widgets};

/// `react-masonry-css` gutter and the cap on tall portraits (≈ 5:7).
const GAP: f32 = 8.0;
const MAX_RATIO: f32 = 1.4;
/// Start loading the next page this far before the end.
const LOAD_MORE_MARGIN: f32 = 400.0;
const LIST_THUMB: f32 = 100.0;
/// The list's compact audio player is at most `max-w-md` wide.
const LIST_PLAYER_MAX: f32 = 448.0;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum ViewMode {
  #[default]
  Grid,
  List,
}

/// Something the user did in the feed.
#[derive(Clone, Debug, PartialEq)]
pub enum FeedAction {
  Open(String),
  Recreate(String),
  MakeVideo(String),
  Share(String),
  Download(String),
  CopyPrompt(String),
  DismissFailed(String),
  ToggleSelect(String),
  LoadMore,
}

/// Looks up a model's display name and maker for the cards' model chip.
pub trait ModelNames {
  fn display_name(&self, model_id: &str) -> String;
  fn creator(&self, model_id: &str) -> String;
}

pub struct FeedView<'a> {
  pub id: Id,
  pub mode: ViewMode,
  pub pending: &'a [PendingJob],
  pub failed: &'a [FailedJob],
  pub items: &'a [FeedItem],
  pub has_more: bool,
  pub loading: bool,
  /// Items that are new this session (shown even before the library catches up).
  pub selecting: bool,
  pub selected: &'a HashSet<String>,
  pub last_viewed: Option<&'a str>,
  /// Prompt texts by prompt token (list view and pending cards).
  pub prompts: &'a HashMap<String, String>,
  pub make_video: bool,
  /// Play videos' animated previews instead of their still frames.
  pub autoplay: bool,
  pub bottom_padding: f32,
}

enum Entry<'a> {
  Pending(&'a PendingJob),
  Failed(&'a FailedJob),
  Item(&'a FeedItem),
}

impl Entry<'_> {
  fn time(&self) -> i64 {
    match self {
      Entry::Pending(j) => j.created_at,
      Entry::Failed(j) => j.updated_at,
      Entry::Item(i) => i.created_at,
    }
  }
}

/// Measured height/width ratios of loaded thumbnails, so cards keep their shape.
#[derive(Clone, Default)]
pub struct RatioCache(HashMap<String, f32>);

pub fn show(ui: &mut Ui, view: &FeedView<'_>, cache: &mut MediaCache, ratios: &mut RatioCache, audio: &mut AudioPlayer, names: &dyn ModelNames) -> Vec<FeedAction> {
  let mut entries: Vec<Entry<'_>> = view.pending.iter().map(Entry::Pending).chain(view.failed.iter().map(Entry::Failed)).chain(view.items.iter().map(Entry::Item)).collect();
  entries.sort_by_key(|e| std::cmp::Reverse(e.time()));
  let mut actions = Vec::new();
  let now = chrono::Utc::now().timestamp();
  if view.pending.iter().any(|_| true) {
    ui.ctx().request_repaint_after(std::time::Duration::from_secs(1));
  }

  egui::ScrollArea::vertical().id_salt(view.id.with("scroll")).auto_shrink([false, false]).show_viewport(ui, |ui, viewport| {
    let width = ui.available_width();
    let origin = ui.min_rect().min;
    let layout = match view.mode {
      ViewMode::Grid => masonry(&entries, width, ratios),
      ViewMode::List => list_layout(&entries, width),
    };
    let total = layout.iter().map(|r| r.bottom()).fold(0.0_f32, f32::max);
    ui.allocate_exact_size(vec2(width, total + view.bottom_padding + if view.has_more { 64.0 } else { 0.0 }), Sense::hover());

    for (entry, local) in entries.iter().zip(&layout) {
      if !local.intersects(viewport.expand(200.0)) {
        continue;
      }
      let rect = local.translate(origin.to_vec2());
      match (entry, view.mode) {
        (Entry::Pending(job), ViewMode::Grid) => pending_card(ui, rect, job, now, names),
        (Entry::Failed(job), ViewMode::Grid) => failed_card(ui, view.id, rect, job, cache, names, &mut actions),
        (Entry::Item(item), ViewMode::Grid) => item_card(ui, view, rect, item, cache, ratios, audio, names, &mut actions),
        (Entry::Pending(job), ViewMode::List) => pending_row(ui, rect, job, now, names),
        (Entry::Failed(job), ViewMode::List) => failed_row(ui, view.id, rect, job, names, &mut actions),
        (Entry::Item(item), ViewMode::List) => item_row(ui, view, rect, item, cache, audio, names, now, &mut actions),
      }
    }

    if view.has_more {
      let spinner = Rect::from_center_size(origin + vec2(width / 2.0, total + 32.0), vec2(24.0, 24.0));
      if view.loading {
        icons::paint_spinner(ui, spinner, theme::MUTED);
      }
      if !view.loading && viewport.max.y + LOAD_MORE_MARGIN >= total {
        actions.push(FeedAction::LoadMore);
      }
    }
  });
  actions
}

/// Number of columns for a width (`BREAKPOINT_COLS = {default: 4, 900: 3, 640: 2}`).
fn columns(width: f32) -> usize {
  if width <= 640.0 {
    2
  } else if width <= 900.0 {
    3
  } else {
    4
  }
}

/// Places each entry in the shortest column, like `react-masonry-css`.
fn masonry(entries: &[Entry<'_>], width: f32, ratios: &RatioCache) -> Vec<Rect> {
  let cols = columns(width);
  let col_w = (width - GAP * (cols - 1) as f32) / cols as f32;
  let mut heights = vec![0.0_f32; cols];
  entries
    .iter()
    .map(|entry| {
      let ratio = match entry {
        Entry::Item(item) => ratios.0.get(&item.token).copied().unwrap_or(1.0).min(MAX_RATIO),
        _ => 1.0,
      };
      let (col, y) = heights.iter().copied().enumerate().min_by(|a, b| a.1.total_cmp(&b.1)).unwrap_or((0, 0.0));
      let rect = Rect::from_min_size(pos2(col as f32 * (col_w + GAP), y), vec2(col_w, col_w * ratio));
      heights[col] = rect.bottom() + GAP;
      rect
    })
    .collect()
}

/// One row per entry, centred at `max-w-5xl`.
fn list_layout(entries: &[Entry<'_>], width: f32) -> Vec<Rect> {
  let w = width.min(1024.0);
  let x = (width - w) / 2.0;
  let row_h = LIST_THUMB + 24.0;
  (0..entries.len()).map(|i| Rect::from_min_size(pos2(x, i as f32 * row_h), vec2(w, row_h))).collect()
}

fn pending_card(ui: &mut Ui, rect: Rect, job: &PendingJob, now: i64, names: &dyn ModelNames) {
  let p = ui.painter();
  p.rect_filled(rect, theme::RADIUS, Color32::from_white_alpha(8));
  shimmer(ui, rect);
  let (progress, time_label) = pending_status(job, now);
  if job.batch_count > 1 {
    let banner = Rect::from_min_max(rect.min + vec2(8.0, 8.0), pos2(rect.right() - 8.0, rect.top() + 34.0));
    p.rect_filled(banner, 0.0, Color32::from_black_alpha(153));
    p.text(banner.center(), Align2::CENTER_CENTER, format!("Generating {} {} \u{b7} Results may appear one at a time", job.batch_count, job.kind.plural()), FontId::new(10.0, FontFamily::Proportional), theme::fade(Color32::WHITE, 0.7));
  }
  let c = rect.center() - vec2(0.0, 18.0);
  icons::paint_spinner(ui, Rect::from_center_size(c, vec2(26.0, 26.0)), theme::fade(Color32::WHITE, 0.2));
  let p = ui.painter();
  p.text(c + vec2(0.0, 26.0), Align2::CENTER_CENTER, format!("{progress}%"), FontId::new(12.0, FontFamily::Monospace), theme::fade(Color32::WHITE, 0.4));
  p.text(c + vec2(0.0, 42.0), Align2::CENTER_CENTER, time_label, FontId::new(10.0, FontFamily::Proportional), theme::fade(Color32::WHITE, 0.3));
  let footer = bottom_gradient(ui, rect, 96.0, 178);
  let text_rect = footer.shrink2(vec2(12.0, 10.0));
  let galley = clamp_lines(ui, &job.prompt, 12.0, theme::fade(Color32::WHITE, 0.8), text_rect.width(), 3);
  let y = text_rect.bottom() - 24.0 - galley.size().y;
  ui.painter().galley(pos2(text_rect.left(), y), galley, Color32::WHITE);
  let model_id = job.model_id.as_deref().unwrap_or_default();
  model_chip(ui, pos2(text_rect.left(), text_rect.bottom() - 15.0), model_id, names, 10.0, theme::fade(Color32::WHITE, 0.5));
  widgets::progress_bar(ui.painter(), Rect::from_min_size(pos2(text_rect.left(), text_rect.bottom() - 2.0), vec2(text_rect.width(), 4.0)), progress as f32 / 100.0);
}

fn failed_card(ui: &mut Ui, id: Id, rect: Rect, job: &FailedJob, cache: &mut MediaCache, names: &dyn ModelNames, actions: &mut Vec<FeedAction>) {
  ui.painter().rect_filled(rect, theme::RADIUS, Color32::from_rgba_unmultiplied(239, 68, 68, 26));
  if let Some(Lookup::Ready(t)) = job.ref_image.as_deref().map(|u| cache.get(ui.ctx(), u)) {
    egui::Image::new(&t).uv(crate::prompt_box::deck::cover_uv(t.size_vec2())).tint(theme::fade(Color32::WHITE, 0.1)).paint_at(ui, rect);
  }
  let c = rect.center() - vec2(0.0, 20.0);
  let p = ui.painter();
  icons::paint(p, Rect::from_center_size(c - vec2(0.0, 18.0), vec2(24.0, 24.0)), Icon::AlertCircle, theme::BAD);
  p.text(c + vec2(0.0, 6.0), Align2::CENTER_CENTER, &job.reason, FontId::new(12.0, theme::medium()), theme::BAD);
  if let Some(msg) = job.message.as_deref().filter(|m| *m != job.reason) {
    let galley = clamp_lines(ui, msg, 10.0, theme::fade(theme::BAD, 0.6), rect.width() - 32.0, 3);
    ui.painter().galley(pos2(rect.center().x - galley.size().x / 2.0, c.y + 16.0), galley, Color32::WHITE);
  }
  let button = Rect::from_center_size(c + vec2(0.0, 62.0), vec2(84.0, 28.0));
  let resp = ui.interact(button, id.with(("dismiss", &job.job_token)), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
  let p = ui.painter();
  p.rect_filled(button, theme::RADIUS, if resp.hovered() { theme::WASH_HOVER } else { theme::WASH });
  let ink = if resp.hovered() { theme::fade(Color32::WHITE, 0.7) } else { theme::fade(Color32::WHITE, 0.5) };
  icons::paint(p, Rect::from_center_size(button.left_center() + vec2(18.0, 0.0), vec2(12.0, 12.0)), Icon::X, ink);
  p.text(button.left_center() + vec2(30.0, 0.0), Align2::LEFT_CENTER, "Dismiss", FontId::new(12.0, FontFamily::Proportional), ink);
  if resp.clicked() {
    actions.push(FeedAction::DismissFailed(job.job_token.clone()));
  }
  let footer = bottom_gradient(ui, rect, 56.0, 153);
  let text = footer.shrink2(vec2(12.0, 10.0));
  let galley = clamp_lines(ui, &job.prompt, 12.0, theme::fade(Color32::WHITE, 0.7), text.width(), 1);
  ui.painter().galley(pos2(text.left(), text.bottom() - 30.0), galley, Color32::WHITE);
  model_chip(ui, pos2(text.left(), text.bottom() - 12.0), job.model_id.as_deref().unwrap_or_default(), names, 10.0, theme::fade(Color32::WHITE, 0.4));
}

#[allow(clippy::too_many_arguments)]
fn item_card(ui: &mut Ui, view: &FeedView<'_>, rect: Rect, item: &FeedItem, cache: &mut MediaCache, ratios: &mut RatioCache, audio: &mut AudioPlayer, names: &dyn ModelNames, actions: &mut Vec<FeedAction>) {
  let resp = ui.interact(rect, view.id.with(("item", &item.token)), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
  // The pointer may be on an action button (or the audio player) rather than the card itself.
  let hovered = resp.hovered() || ui.rect_contains_pointer(rect);
  let is_audio = item.kind == MediaKind::Audio;
  if is_audio {
    audio_face(ui, view, rect, item, audio);
  } else {
    visual_face(ui, view, rect, item, cache, ratios);
  }
  let selected = view.selected.contains(&item.token);
  let ring = if selected {
    Some(Stroke::new(2.0, theme::ACCENT_400))
  } else if hovered {
    Some(Stroke::new(2.0, theme::fade(theme::ACCENT_400, 0.6)))
  } else if view.last_viewed == Some(item.token.as_str()) {
    Some(Stroke::new(2.0, theme::fade(theme::ACCENT_400, 0.5)))
  } else {
    None
  };
  if let Some(stroke) = ring {
    ui.painter().rect_stroke(rect, theme::RADIUS, stroke, egui::StrokeKind::Inside);
  }
  if view.selecting {
    let chip = Rect::from_min_size(rect.min + vec2(8.0, 8.0), vec2(20.0, 20.0));
    let (fill, border) = if selected { (theme::ACCENT_400, theme::ACCENT_400) } else { (Color32::from_black_alpha(102), theme::fade(Color32::WHITE, 0.6)) };
    ui.painter().rect(chip, theme::RADIUS, fill, Stroke::new(1.0, border), egui::StrokeKind::Inside);
    if selected {
      icons::paint(ui.painter(), chip.shrink(4.0), Icon::Check, Color32::WHITE);
    }
  }
  if view.last_viewed == Some(item.token.as_str()) {
    let galley = widgets::caps(ui, "Last viewed", 10.0, theme::medium(), 0.5, theme::fade(Color32::WHITE, 0.8));
    let badge = Rect::from_min_size(pos2(rect.right() - 8.0 - galley.size().x - 26.0, rect.top() + 8.0), vec2(galley.size().x + 26.0, 18.0));
    let p = ui.painter();
    p.rect_filled(badge, theme::RADIUS, Color32::from_black_alpha(178));
    icons::paint(p, Rect::from_center_size(badge.left_center() + vec2(11.0, 0.0), vec2(11.0, 11.0)), Icon::Eye, theme::fade(Color32::WHITE, 0.8));
    p.galley(pos2(badge.left() + 20.0, badge.center().y - galley.size().y / 2.0), galley, Color32::WHITE);
  }
  let mut action_clicked = false;
  if hovered && !view.selecting {
    // Audio keeps its player at the bottom, so its chips and actions go on top.
    let band = edge_fade(ui, rect, 56.0, 178, is_audio);
    let chip_y = if is_audio { band.top() + 18.0 } else { band.bottom() - 18.0 };
    let mut x = band.left() + 8.0;
    x = chip(ui, pos2(x, chip_y), Some(kind_icon(item.kind)), None, item.kind.label());
    if let Some(model) = item.model_id.as_deref() {
      chip(ui, pos2(x + 6.0, chip_y), None, Some(&names.creator(model)), &truncate(&names.display_name(model), 16));
    }
    let buttons = item_actions(view, item, None);
    let pill = Rect::from_min_size(pos2(band.right() - 8.0 - 8.0 - 28.0 * buttons.len() as f32, chip_y - 18.0), vec2(8.0 + 28.0 * buttons.len() as f32, 36.0));
    ui.painter().rect_filled(pill, 0.0, Color32::from_black_alpha(153));
    let mut child = ui.new_child(egui::UiBuilder::new().max_rect(pill.shrink(4.0)).layout(egui::Layout::left_to_right(egui::Align::Center)));
    child.spacing_mut().item_spacing.x = 0.0;
    for (icon, tip, action) in buttons {
      if widgets::overlay_icon(&mut child, icon, tip).clicked() {
        actions.push(action);
        action_clicked = true;
      }
    }
  }
  if resp.clicked() && !action_clicked {
    actions.push(if view.selecting { FeedAction::ToggleSelect(item.token.clone()) } else { FeedAction::Open(item.token.clone()) });
  }
}

/// An image or video card's face: the thumbnail (or animated preview) and a video's play badge.
fn visual_face(ui: &mut Ui, view: &FeedView<'_>, rect: Rect, item: &FeedItem, cache: &mut MediaCache, ratios: &mut RatioCache) {
  ui.painter().rect_filled(rect, theme::RADIUS, theme::fade(theme::CONTROLS, 0.4));
  // Videos play their animated preview when previews are on (the still shows while it loads).
  let animated = item.animated.as_deref().filter(|_| view.autoplay && item.kind == MediaKind::Video).map(|u| cache.get_animated(ui.ctx(), u));
  let lookup = match animated {
    Some(Lookup::Ready(t)) => Some(Lookup::Ready(t)),
    _ => item.thumbnail.as_deref().map(|u| cache.get(ui.ctx(), u)),
  };
  match lookup {
    Some(Lookup::Ready(t)) => {
      let size = t.size_vec2();
      if size.x > 0.0 && !ratios.0.contains_key(&item.token) {
        ratios.0.insert(item.token.clone(), size.y / size.x);
      }
      egui::Image::new(&t).uv(cover_uv_for(size, rect.size())).corner_radius(theme::RADIUS).paint_at(ui, rect);
    },
    Some(Lookup::Loading) => shimmer(ui, rect),
    _ => icons::paint(ui.painter(), Rect::from_center_size(rect.center(), vec2(28.0, 28.0)), kind_icon(item.kind), theme::FAINT),
  }
  if item.kind == MediaKind::Video && !(view.autoplay && item.animated.is_some()) {
    let badge = Rect::from_center_size(rect.center(), vec2(40.0, 40.0));
    ui.painter().circle_filled(badge.center(), 20.0, Color32::from_black_alpha(110));
    icons::paint(ui.painter(), badge.shrink(12.0).translate(vec2(1.5, 0.0)), Icon::Play, theme::fade(Color32::WHITE, 0.9));
  }
}

/// An audio card's face (`GalleryCard`'s audio branch, a square tile): the title, a music note
/// and the waveform player along the bottom.
fn audio_face(ui: &mut Ui, view: &FeedView<'_>, rect: Rect, item: &FeedItem, audio: &mut AudioPlayer) {
  let mut mesh = Mesh::default();
  let (top, bottom) = (theme::fade(theme::ACCENT, 0.14), theme::fade(theme::CONTROLS, 0.6));
  mesh.colored_vertex(rect.left_top(), top);
  mesh.colored_vertex(rect.right_top(), top);
  mesh.colored_vertex(rect.right_bottom(), bottom);
  mesh.colored_vertex(rect.left_bottom(), bottom);
  mesh.add_triangle(0, 1, 2);
  mesh.add_triangle(0, 2, 3);
  ui.painter().add(mesh);
  // Clear of the selection checkbox when selecting.
  let inset = if view.selecting { 36.0 } else { 12.0 };
  let title = item.prompt_token.as_deref().and_then(|t| view.prompts.get(t)).cloned().unwrap_or_else(|| fallback_title(item));
  let galley = clamp_lines(ui, &title, 13.0, theme::fade(Color32::WHITE, 0.85), rect.width() - inset - 12.0, 2);
  ui.painter().galley(pos2(rect.left() + inset, rect.top() + 12.0), galley, Color32::WHITE);
  waveform::music_tile(ui, Rect::from_center_size(rect.center() - vec2(0.0, 12.0), vec2(48.0, 48.0)), true);
  let bar = Rect::from_min_max(pos2(rect.left() + 12.0, rect.bottom() - 56.0), pos2(rect.right() - 12.0, rect.bottom() - 12.0));
  let mut child = ui.new_child(egui::UiBuilder::new().max_rect(bar));
  waveform::player(&mut child, view.id.with(("player", &item.token)), audio, &item.full_url, item.duration_secs, false);
}

/// The hover actions for an item: copy prompt (list rows, when the text is known), recreate,
/// make video, share and download. Audio only shares and downloads (`Audio v1`).
fn item_actions<'a>(view: &FeedView<'_>, item: &FeedItem, prompt: Option<&String>) -> Vec<(Icon, &'a str, FeedAction)> {
  let mut buttons = Vec::new();
  if let Some(text) = prompt {
    buttons.push((Icon::Copy, "Copy prompt", FeedAction::CopyPrompt(text.clone())));
  }
  if item.prompt_token.is_some() && item.kind != MediaKind::Audio {
    buttons.push((Icon::RotateCw, "Recreate", FeedAction::Recreate(item.token.clone())));
  }
  if view.make_video && item.kind == MediaKind::Image {
    buttons.push((Icon::Video, "Make Video", FeedAction::MakeVideo(item.token.clone())));
  }
  buttons.push((Icon::Link, "Share", FeedAction::Share(item.token.clone())));
  buttons.push((Icon::Download, "Download", FeedAction::Download(item.token.clone())));
  buttons
}

/// What an item is called without its prompt: its title, else "Audio Generation" and the like.
fn fallback_title(item: &FeedItem) -> String {
  item.title.clone().unwrap_or_else(|| format!("{} Generation", item.kind.label()))
}

fn kind_icon(kind: MediaKind) -> Icon {
  match kind {
    MediaKind::Image => Icon::Image,
    MediaKind::Video => Icon::Video,
    MediaKind::Audio => Icon::Music,
  }
}

fn pending_row(ui: &mut Ui, rect: Rect, job: &PendingJob, now: i64, names: &dyn ModelNames) {
  let thumb = Rect::from_min_size(rect.min + vec2(0.0, 12.0), vec2(LIST_THUMB, LIST_THUMB));
  ui.painter().rect_filled(thumb, theme::RADIUS, Color32::from_white_alpha(8));
  shimmer(ui, thumb);
  icons::paint_spinner(ui, Rect::from_center_size(thumb.center(), vec2(22.0, 22.0)), theme::fade(Color32::WHITE, 0.25));
  let (progress, label) = pending_status(job, now);
  let x = thumb.right() + 16.0;
  let w = rect.right() - x;
  let prompt = if job.prompt.is_empty() { "Generating\u{2026}" } else { job.prompt.as_str() };
  let galley = clamp_lines(ui, prompt, 14.0, theme::INK, w, 2);
  let gh = galley.size().y;
  ui.painter().galley(pos2(x, thumb.top()), galley, theme::INK);
  let meta_y = thumb.top() + gh + 14.0;
  let mx = model_chip(ui, pos2(x, meta_y), job.model_id.as_deref().unwrap_or_default(), names, 12.0, theme::MUTED);
  if job.batch_count > 1 {
    ui.painter().text(pos2(mx + 8.0, meta_y), Align2::LEFT_CENTER, format!("\u{b7} {} {}", job.batch_count, job.kind.plural()), FontId::new(12.0, FontFamily::Proportional), theme::MUTED);
  }
  let bar = Rect::from_min_size(pos2(x, meta_y + 16.0), vec2(w.min(320.0), 4.0));
  widgets::progress_bar(ui.painter(), bar, progress as f32 / 100.0);
  ui.painter().text(pos2(bar.right() + 10.0, bar.center().y), Align2::LEFT_CENTER, format!("{progress}% \u{b7} {label}"), FontId::new(11.0, FontFamily::Monospace), theme::FAINT);
  row_divider(ui, rect);
}

fn failed_row(ui: &mut Ui, id: Id, rect: Rect, job: &FailedJob, names: &dyn ModelNames, actions: &mut Vec<FeedAction>) {
  let thumb = Rect::from_min_size(rect.min + vec2(0.0, 12.0), vec2(LIST_THUMB, LIST_THUMB));
  ui.painter().rect_filled(thumb, theme::RADIUS, Color32::from_rgba_unmultiplied(239, 68, 68, 26));
  icons::paint(ui.painter(), Rect::from_center_size(thumb.center(), vec2(24.0, 24.0)), Icon::AlertCircle, theme::BAD);
  let x = thumb.right() + 16.0;
  let w = rect.right() - x - 100.0;
  let galley = clamp_lines(ui, &job.prompt, 14.0, theme::INK, w, 2);
  let gh = galley.size().y;
  ui.painter().galley(pos2(x, thumb.top()), galley, theme::INK);
  ui.painter().text(pos2(x, thumb.top() + gh + 14.0), Align2::LEFT_CENTER, &job.reason, FontId::new(12.0, theme::medium()), theme::BAD);
  if let Some(msg) = job.message.as_deref().filter(|m| *m != job.reason) {
    let g = clamp_lines(ui, msg, 11.0, theme::fade(theme::BAD, 0.6), w, 2);
    ui.painter().galley(pos2(x, thumb.top() + gh + 24.0), g, Color32::WHITE);
  }
  model_chip(ui, pos2(x, thumb.bottom() - 8.0), job.model_id.as_deref().unwrap_or_default(), names, 12.0, theme::FAINT);
  let button = Rect::from_min_size(pos2(rect.right() - 92.0, thumb.top()), vec2(92.0, 28.0));
  let resp = ui.interact(button, id.with(("dismiss-row", &job.job_token)), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
  ui.painter().rect_filled(button, theme::RADIUS, if resp.hovered() { theme::WASH_HOVER } else { theme::WASH });
  ui.painter().text(button.center(), Align2::CENTER_CENTER, "Dismiss", FontId::new(12.0, FontFamily::Proportional), theme::MUTED);
  if resp.clicked() {
    actions.push(FeedAction::DismissFailed(job.job_token.clone()));
  }
  row_divider(ui, rect);
}

#[allow(clippy::too_many_arguments)]
fn item_row(ui: &mut Ui, view: &FeedView<'_>, rect: Rect, item: &FeedItem, cache: &mut MediaCache, audio: &mut AudioPlayer, names: &dyn ModelNames, now: i64, actions: &mut Vec<FeedAction>) {
  let resp = ui.interact(rect, view.id.with(("row", &item.token)), Sense::click());
  let hovered = resp.hovered();
  if hovered {
    ui.painter().rect_filled(rect.expand2(vec2(8.0, 0.0)), 0.0, Color32::from_white_alpha(6));
  }
  let thumb = Rect::from_min_size(rect.min + vec2(0.0, 12.0), vec2(LIST_THUMB, LIST_THUMB));
  ui.painter().rect_filled(thumb, theme::RADIUS, theme::fade(theme::CONTROLS, 0.4));
  let is_audio = item.kind == MediaKind::Audio;
  if is_audio {
    waveform::music_tile(ui, thumb, false);
  } else if let Some(Lookup::Ready(t)) = item.thumbnail.as_deref().map(|u| cache.get(ui.ctx(), u)) {
    egui::Image::new(&t).uv(crate::prompt_box::deck::cover_uv(t.size_vec2())).corner_radius(theme::RADIUS).paint_at(ui, thumb);
  }
  if view.selected.contains(&item.token) {
    ui.painter().rect_stroke(thumb, theme::RADIUS, Stroke::new(2.0, theme::ACCENT_400), egui::StrokeKind::Inside);
  }
  let x = thumb.right() + 16.0;
  let w = rect.right() - x - 140.0;
  let prompt = item.prompt_token.as_deref().and_then(|t| view.prompts.get(t));
  match prompt {
    Some(text) => {
      // Audio keeps room for its player under the text.
      let g = clamp_lines(ui, text, 14.0, theme::INK, w, if is_audio { 2 } else { 3 });
      ui.painter().galley(pos2(x, thumb.top()), g, theme::INK);
    },
    None if item.prompt_token.is_some() => {
      for (i, frac) in [1.0, 0.7].iter().enumerate() {
        ui.painter().rect_filled(Rect::from_min_size(pos2(x, thumb.top() + 4.0 + i as f32 * 20.0), vec2(w * frac, 12.0)), CornerRadius::same(2), theme::WASH);
      }
    },
    None => {
      ui.painter().text(pos2(x, thumb.top() + 8.0), Align2::LEFT_CENTER, fallback_title(item), FontId::new(14.0, FontFamily::Proportional), theme::MUTED);
    },
  }
  if is_audio {
    let mut child = ui.new_child(egui::UiBuilder::new().max_rect(Rect::from_min_size(pos2(x, thumb.top() + 44.0), vec2(w.min(LIST_PLAYER_MAX), 32.0))));
    waveform::player(&mut child, view.id.with(("row-player", &item.token)), audio, &item.full_url, item.duration_secs, true);
  }
  let meta_y = thumb.bottom() - 10.0;
  let mut mx = x;
  if let Some(model) = item.model_id.as_deref() {
    mx = model_chip(ui, pos2(x, meta_y), model, names, 12.0, theme::MUTED);
    ui.painter().text(pos2(mx + 6.0, meta_y), Align2::LEFT_CENTER, format!("\u{b7} {}", item.kind.label()), FontId::new(12.0, FontFamily::Proportional), theme::MUTED);
  }
  let _ = mx;
  ui.painter().text(pos2(rect.right(), thumb.top() + 8.0), Align2::RIGHT_CENTER, time_ago(item.created_at, now), FontId::new(11.0, FontFamily::Proportional), theme::FAINT);
  let mut action_clicked = false;
  if hovered && !view.selecting {
    let buttons = item_actions(view, item, prompt);
    let bar = Rect::from_min_size(pos2(rect.right() - 28.0 * buttons.len() as f32, thumb.bottom() - 28.0), vec2(28.0 * buttons.len() as f32, 28.0));
    let mut child = ui.new_child(egui::UiBuilder::new().max_rect(bar).layout(egui::Layout::left_to_right(egui::Align::Center)));
    child.spacing_mut().item_spacing.x = 0.0;
    for (icon, tip, action) in buttons {
      if widgets::overlay_icon(&mut child, icon, tip).clicked() {
        actions.push(action);
        action_clicked = true;
      }
    }
  }
  if resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked() && !action_clicked {
    actions.push(if view.selecting { FeedAction::ToggleSelect(item.token.clone()) } else { FeedAction::Open(item.token.clone()) });
  }
  row_divider(ui, rect);
}

fn row_divider(ui: &Ui, rect: Rect) {
  ui.painter().hline(rect.x_range(), rect.bottom() - 0.5, Stroke::new(1.0, Color32::from_white_alpha(10)));
}

/// A small dark chip: an icon (or a creator logo) and a label. Returns its right edge.
fn chip(ui: &Ui, left_center: egui::Pos2, icon: Option<Icon>, creator: Option<&str>, label: &str) -> f32 {
  let galley = ui.painter().layout_no_wrap(label.to_owned(), FontId::new(12.0, theme::medium()), theme::fade(Color32::WHITE, 0.9));
  let lead = if icon.is_some() || creator.is_some() { 16.0 } else { 0.0 };
  let rect = Rect::from_min_size(pos2(left_center.x, left_center.y - 12.0), vec2(20.0 + lead + galley.size().x, 24.0));
  let p = ui.painter();
  p.rect_filled(rect, 0.0, Color32::from_black_alpha(153));
  let icon_rect = Rect::from_center_size(pos2(rect.left() + 16.0, rect.center().y), vec2(11.0, 11.0));
  if let Some(icon) = icon {
    icons::paint(p, icon_rect, icon, theme::fade(Color32::WHITE, 0.9));
  } else if let Some(creator) = creator {
    let tex = creator_icons::texture(ui.ctx(), creator);
    egui::Image::new(&tex).tint(theme::fade(Color32::WHITE, 0.9)).paint_at(ui, icon_rect.expand(0.5));
  }
  p.galley(pos2(rect.left() + 10.0 + lead, rect.center().y - galley.size().y / 2.0), galley, Color32::WHITE);
  rect.right()
}

/// A creator logo followed by the model's name. Returns the right edge.
fn model_chip(ui: &Ui, left_center: egui::Pos2, model_id: &str, names: &dyn ModelNames, size: f32, color: Color32) -> f32 {
  if model_id.is_empty() {
    return left_center.x;
  }
  let icon_rect = Rect::from_center_size(pos2(left_center.x + size / 2.0 + 1.0, left_center.y), vec2(size + 2.0, size + 2.0));
  let tex = creator_icons::texture(ui.ctx(), &names.creator(model_id));
  egui::Image::new(&tex).tint(color).paint_at(ui, icon_rect);
  let r = ui.painter().text(pos2(icon_rect.right() + 6.0, left_center.y), Align2::LEFT_CENTER, names.display_name(model_id), FontId::new(size, theme::medium()), color);
  r.right()
}

/// Darkens the bottom of `rect` (`bg-gradient-to-t from-black/70`), returning the faded band.
fn bottom_gradient(ui: &Ui, rect: Rect, height: f32, alpha: u8) -> Rect {
  edge_fade(ui, rect, height, alpha, false)
}

/// Darkens `rect` toward its top or bottom edge over `height`, returning the faded band.
fn edge_fade(ui: &Ui, rect: Rect, height: f32, alpha: u8, top_edge: bool) -> Rect {
  let band = if top_edge { Rect::from_min_max(rect.min, pos2(rect.right(), (rect.top() + height).min(rect.bottom()))) } else { Rect::from_min_max(pos2(rect.left(), (rect.bottom() - height).max(rect.top())), rect.max) };
  let mut mesh = Mesh::default();
  let (clear, dark) = (Color32::TRANSPARENT, Color32::from_black_alpha(alpha));
  let (top, bottom) = if top_edge { (dark, clear) } else { (clear, dark) };
  mesh.colored_vertex(band.left_top(), top);
  mesh.colored_vertex(band.right_top(), top);
  mesh.colored_vertex(band.right_bottom(), bottom);
  mesh.colored_vertex(band.left_bottom(), bottom);
  mesh.add_triangle(0, 1, 2);
  mesh.add_triangle(0, 2, 3);
  ui.painter().add(mesh);
  band
}

/// The sweeping highlight over loading tiles (`.animate-shimmer`).
fn shimmer(ui: &Ui, rect: Rect) {
  let t = (ui.input(|i| i.time) / 1.5).fract() as f32;
  let x = rect.left() - rect.width() + t * rect.width() * 3.0;
  let band = Rect::from_min_max(pos2(x, rect.top()), pos2(x + rect.width(), rect.bottom())).intersect(rect);
  if band.width() > 0.0 {
    let mut mesh = Mesh::default();
    let (edge, mid) = (Color32::TRANSPARENT, Color32::from_white_alpha(20));
    let cx = (x + rect.width() / 2.0).clamp(band.left(), band.right());
    for (px, c) in [(band.left(), edge), (cx, mid), (band.right(), edge)] {
      mesh.colored_vertex(pos2(px, band.top()), c);
      mesh.colored_vertex(pos2(px, band.bottom()), c);
    }
    mesh.add_triangle(0, 1, 2);
    mesh.add_triangle(1, 2, 3);
    mesh.add_triangle(2, 3, 4);
    mesh.add_triangle(3, 4, 5);
    ui.painter().add(mesh);
  }
  ui.ctx().request_repaint();
}

/// Lays out `text` wrapped to `width`, keeping at most `max_lines` lines (with an ellipsis).
fn clamp_lines(ui: &Ui, text: &str, size: f32, color: Color32, width: f32, max_lines: usize) -> std::sync::Arc<egui::Galley> {
  let mut job = egui::text::LayoutJob::simple(text.to_owned(), FontId::new(size, FontFamily::Proportional), color, width);
  job.wrap.max_rows = max_lines;
  job.wrap.break_anywhere = false;
  ui.painter().layout_job(job)
}

fn truncate(s: &str, max: usize) -> String {
  if s.chars().count() <= max {
    s.to_owned()
  } else {
    format!("{}\u{2026}", s.chars().take(max - 1).collect::<String>())
  }
}

/// The UV rect that crops a texture of `size` to fill `target` (`object-cover`).
fn cover_uv_for(size: egui::Vec2, target: egui::Vec2) -> Rect {
  if size.x <= 0.0 || size.y <= 0.0 || target.x <= 0.0 || target.y <= 0.0 {
    return Rect::from_min_max(pos2(0.0, 0.0), pos2(1.0, 1.0));
  }
  let (src, dst) = (size.y / size.x, target.y / target.x);
  if src > dst {
    let f = dst / src;
    Rect::from_min_max(pos2(0.0, (1.0 - f) / 2.0), pos2(1.0, (1.0 + f) / 2.0))
  } else {
    let f = src / dst;
    Rect::from_min_max(pos2((1.0 - f) / 2.0, 0.0), pos2((1.0 + f) / 2.0, 1.0))
  }
}
