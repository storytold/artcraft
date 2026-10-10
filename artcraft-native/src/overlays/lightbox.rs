//! The lightbox (`lightbox-modal`): the media large on black, prev/next through the feed, and a
//! side column with the prompt, details and actions.

use egui::{Align2, Color32, FontId, Id, Key, Rect, Sense, Ui, pos2, vec2};

use crate::backend::media_cache::{Lookup, MediaCache};
use crate::backend::video::{self, VideoPlayer};
use crate::backend::wire::Prompt;
use crate::feed::grid::ModelNames;
use crate::feed::types::{FeedItem, MediaKind};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::{creator_icons, widgets};

const SIDE_WIDTH: f32 = 280.0;

pub struct Lightbox {
  pub kind: MediaKind,
  pub token: String,
  confirm_delete: bool,
  prompt_expanded: bool,
  /// The in-app player for videos (when FFmpeg is installed).
  player: Option<VideoPlayer>,
}

#[derive(Debug, PartialEq)]
pub enum LightboxAction {
  Close,
  Navigate(String),
  Recreate,
  MakeVideo,
  Download,
  Share,
  Delete,
  CopyPrompt(String),
  Play(String),
}

impl Lightbox {
  pub fn new(kind: MediaKind, token: String) -> Self {
    Self { kind, token, confirm_delete: false, prompt_expanded: false, player: None }
  }

  pub fn show(&mut self, ctx: &egui::Context, item: &FeedItem, order: &[String], prompt: Option<&Prompt>, names: &dyn ModelNames, cache: &mut MediaCache) -> Vec<LightboxAction> {
    let mut actions = Vec::new();
    let screen = ctx.content_rect();
    let size = vec2((screen.width() - 80.0).min(1200.0), (screen.height() - 80.0).min(760.0));
    let index = order.iter().position(|t| *t == item.token);
    let prev = index.and_then(|i| i.checked_sub(1)).map(|i| order[i].clone());
    let next = index.and_then(|i| order.get(i + 1)).cloned();

    let typing = ctx.memory(|m| m.focused().is_some());
    if !typing && !self.confirm_delete {
      let (left, right) = ctx.input(|i| (i.key_pressed(Key::ArrowLeft) || i.key_pressed(Key::ArrowUp), i.key_pressed(Key::ArrowRight) || i.key_pressed(Key::ArrowDown)));
      if let (true, Some(t)) = (left, &prev) {
        actions.push(LightboxAction::Navigate(t.clone()));
      }
      if let (true, Some(t)) = (right, &next) {
        actions.push(LightboxAction::Navigate(t.clone()));
      }
    }

    let close = widgets::modal(ctx, Id::new("lightbox"), size.x, |ui| {
      ui.set_height(size.y - 32.0);
      ui.horizontal_top(|ui| {
        let media_rect = Rect::from_min_size(ui.cursor().min, vec2(ui.available_width() - SIDE_WIDTH - 16.0, size.y - 32.0));
        ui.allocate_rect(media_rect, Sense::hover());
        self.media(ui, media_rect, item, cache, &prev, &next, &mut actions);
        ui.add_space(16.0);
        ui.vertical(|ui| {
          ui.set_width(SIDE_WIDTH);
          self.side(ui, item, prompt, names, cache, &mut actions);
        });
      });
    });
    if close && !self.confirm_delete {
      actions.push(LightboxAction::Close);
    }
    if self.confirm_delete {
      self.confirm(ctx, &mut actions);
    }
    actions
  }

  #[allow(clippy::too_many_arguments)]
  fn media(&mut self, ui: &mut Ui, rect: Rect, item: &FeedItem, cache: &mut MediaCache, prev: &Option<String>, next: &Option<String>, actions: &mut Vec<LightboxAction>) {
    if item.kind == MediaKind::Video && video::ffmpeg_available() {
      if self.player.as_ref().is_none_or(|p| p.url() != item.full_url) {
        self.player = Some(VideoPlayer::new(&item.full_url));
      }
      let poster = match item.thumbnail.as_deref().map(|u| cache.get(ui.ctx(), u)) {
        Some(Lookup::Ready(t)) => Some(t),
        _ => None,
      };
      if let Some(player) = &mut self.player {
        player.ui(ui, rect, poster.as_ref());
      }
      self.nav_buttons(ui, rect, prev, next, actions);
      return;
    }
    self.player = None;
    ui.painter().rect_filled(rect, 0.0, Color32::BLACK);
    let url = if item.kind == MediaKind::Image { Some(item.full_url.as_str()) } else { item.thumbnail.as_deref() };
    match url.map(|u| cache.get(ui.ctx(), u)) {
      Some(Lookup::Ready(texture)) => {
        let fit = fit_inside(texture.size_vec2(), rect.shrink(8.0).size());
        egui::Image::new(&texture).paint_at(ui, Rect::from_center_size(rect.center(), fit));
      },
      Some(Lookup::Loading) => {
        // Show the thumbnail while the full image loads.
        if let Some(Lookup::Ready(t)) = item.thumbnail.as_deref().map(|u| cache.get(ui.ctx(), u)) {
          let fit = fit_inside(t.size_vec2(), rect.shrink(8.0).size());
          egui::Image::new(&t).paint_at(ui, Rect::from_center_size(rect.center(), fit));
        }
        icons::paint_spinner(ui, Rect::from_center_size(rect.center(), vec2(32.0, 32.0)), theme::MUTED);
      },
      _ => {
        ui.painter().text(rect.center(), Align2::CENTER_CENTER, "Image not available", FontId::new(14.0, egui::FontFamily::Proportional), theme::FAINT);
      },
    }
    if item.kind == MediaKind::Video {
      let play = Rect::from_center_size(rect.center(), vec2(72.0, 72.0));
      let resp = ui.interact(play, Id::new(("lightbox-play", &item.token)), Sense::click()).on_hover_text("Play in your video player").on_hover_cursor(egui::CursorIcon::PointingHand);
      ui.painter().circle_filled(play.center(), 36.0, Color32::from_black_alpha(if resp.hovered() { 200 } else { 150 }));
      icons::paint(ui.painter(), play.shrink(22.0).translate(vec2(3.0, 0.0)), Icon::Play, Color32::WHITE);
      if resp.clicked() {
        actions.push(LightboxAction::Play(item.full_url.clone()));
      }
    }
    self.nav_buttons(ui, rect, prev, next, actions);
  }

  /// Previous / next arrows at the media's sides (shown while hovering it).
  fn nav_buttons(&self, ui: &mut Ui, rect: Rect, prev: &Option<String>, next: &Option<String>, actions: &mut Vec<LightboxAction>) {
    let hovering = ui.rect_contains_pointer(rect);
    for (target, left, tip) in [(prev, true, "Previous item"), (next, false, "Next item")] {
      let Some(token) = target else {
        continue;
      };
      let x = if left { rect.left() + 28.0 } else { rect.right() - 28.0 };
      let button = Rect::from_center_size(pos2(x, rect.center().y), vec2(40.0, 40.0));
      let resp = ui.interact(button, Id::new(("lightbox-nav", tip)), Sense::click()).on_hover_text(tip).on_hover_cursor(egui::CursorIcon::PointingHand);
      if hovering || resp.hovered() {
        ui.painter().circle_filled(button.center(), 20.0, Color32::from_black_alpha(if resp.hovered() { 210 } else { 140 }));
        icons::paint(ui.painter(), button.shrink(11.0), if left { Icon::ChevronLeft } else { Icon::ChevronRight }, Color32::WHITE);
      }
      if resp.clicked() {
        actions.push(LightboxAction::Navigate(token.clone()));
      }
    }
  }

  fn side(&mut self, ui: &mut Ui, item: &FeedItem, prompt: Option<&Prompt>, names: &dyn ModelNames, cache: &mut MediaCache, actions: &mut Vec<LightboxAction>) {
    ui.horizontal(|ui| {
      widgets::hud(ui, item.kind.label(), theme::MUTED);
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
          actions.push(LightboxAction::Close);
        }
      });
    });
    ui.add_space(8.0);
    let text = prompt.and_then(|p| p.maybe_positive_prompt.clone()).filter(|t| !t.is_empty());
    ui.horizontal(|ui| {
      widgets::hud(ui, "Prompt", theme::FAINT);
      if let Some(t) = &text {
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          if ui.add(egui::Button::new(egui::RichText::new("Copy").size(11.0)).frame(false)).on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
            actions.push(LightboxAction::CopyPrompt(t.clone()));
          }
        });
      }
    });
    match (&text, item.prompt_token.is_some(), prompt.is_some()) {
      (Some(t), _, _) => {
        let mut job = egui::text::LayoutJob::simple(t.clone(), FontId::new(13.0, egui::FontFamily::Proportional), theme::INK, ui.available_width());
        if !self.prompt_expanded {
          job.wrap.max_rows = 4;
        }
        let galley = ui.painter().layout_job(job);
        let clipped = galley.elided;
        ui.label(galley);
        if clipped || self.prompt_expanded {
          let label = if self.prompt_expanded { "Hide" } else { "See all" };
          if ui.add(egui::Button::new(egui::RichText::new(label).size(11.5).color(theme::ACCENT_INK)).frame(false)).clicked() {
            self.prompt_expanded = !self.prompt_expanded;
          }
        }
      },
      (None, true, false) => {
        let (rect, _) = ui.allocate_exact_size(vec2(16.0, 16.0), Sense::hover());
        icons::paint_spinner(ui, rect, theme::FAINT);
      },
      _ => {
        ui.label(egui::RichText::new("No prompt").size(13.0).color(theme::FAINT));
      },
    }
    ui.add_space(14.0);
    widgets::hud(ui, "Information", theme::FAINT);
    ui.add_space(4.0);
    if let Some(model) = item.model_id.as_deref() {
      info_row(ui, "Model", |ui| {
        let tex = creator_icons::texture(ui.ctx(), &names.creator(model));
        ui.add(egui::Image::new(&tex).tint(theme::INK).fit_to_exact_size(vec2(13.0, 13.0)));
        ui.label(egui::RichText::new(names.display_name(model)).size(12.5));
      });
    }
    if let Some(p) = prompt {
      if let Some(ar) = &p.maybe_aspect_ratio {
        info_row(ui, "Aspect Ratio", |ui| {
          ui.label(egui::RichText::new(crate::models::aspect_label(ar)).size(12.5));
        });
      }
      if let Some(res) = &p.maybe_resolution {
        info_row(ui, "Resolution", |ui| {
          ui.label(egui::RichText::new(crate::models::resolution_label(res)).size(12.5));
        });
      }
    }
    if let Some(d) = item.duration_secs {
      info_row(ui, "Duration", |ui| {
        ui.label(egui::RichText::new(format!("{d:.1}s")).size(12.5));
      });
    }
    if let Some(Lookup::Ready(t)) = (item.kind == MediaKind::Image).then(|| cache.get(ui.ctx(), &item.full_url)) {
      let s = t.size();
      info_row(ui, "Size", |ui| {
        ui.label(egui::RichText::new(format!("{} \u{d7} {}", s[0], s[1])).size(12.5));
      });
    }
    if let Some(created) = chrono::DateTime::from_timestamp(item.created_at, 0) {
      let local = created.with_timezone(&chrono::Local);
      info_row(ui, "Created", |ui| {
        ui.label(egui::RichText::new(local.format("%b %-d, %Y %-I:%M:%S %p").to_string()).size(12.5));
      });
    }

    ui.add_space(16.0);
    let w = (ui.available_width() - 8.0) / 2.0;
    if item.prompt_token.is_some() && widgets::button(ui, Some(Icon::RotateCw), "Recreate", widgets::Kind::Primary, ui.available_width(), theme::CONTROL_H).clicked() {
      actions.push(LightboxAction::Recreate);
    }
    ui.horizontal_wrapped(|ui| {
      ui.spacing_mut().item_spacing = vec2(8.0, 8.0);
      if item.kind == MediaKind::Image && widgets::button(ui, Some(Icon::Video), "Make Video", widgets::Kind::Accent, w, theme::CONTROL_H).clicked() {
        actions.push(LightboxAction::MakeVideo);
      }
      if widgets::button(ui, Some(Icon::Download), "Download", widgets::Kind::Secondary, w, theme::CONTROL_H).clicked() {
        actions.push(LightboxAction::Download);
      }
      if widgets::button(ui, Some(Icon::Link), "Share", widgets::Kind::Secondary, w, theme::CONTROL_H).clicked() {
        actions.push(LightboxAction::Share);
      }
      if widgets::button(ui, Some(Icon::Trash), "Delete", widgets::Kind::Danger, w, theme::CONTROL_H).clicked() {
        self.confirm_delete = true;
      }
    });
  }

  fn confirm(&mut self, ctx: &egui::Context, actions: &mut Vec<LightboxAction>) {
    let mut choice = None;
    let close = widgets::modal(ctx, Id::new("lightbox-delete"), 420.0, |ui| {
      ui.label(widgets::heading("Delete this media?", 20.0));
      ui.add_space(8.0);
      ui.label(egui::RichText::new("This will permanently remove the media from your library. This action cannot be undone.").color(theme::MUTED));
      ui.add_space(16.0);
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if widgets::button(ui, None, "Delete", widgets::Kind::Danger, 0.0, theme::CONTROL_H).clicked() {
          choice = Some(true);
        }
        if widgets::button(ui, None, "Cancel", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
          choice = Some(false);
        }
      });
    });
    if close || choice.is_some() {
      self.confirm_delete = false;
    }
    if choice == Some(true) {
      actions.push(LightboxAction::Delete);
    }
  }
}

fn info_row(ui: &mut Ui, label: &str, value: impl FnOnce(&mut Ui)) {
  ui.horizontal(|ui| {
    let (rect, _) = ui.allocate_exact_size(vec2(96.0, 20.0), Sense::hover());
    ui.painter().text(rect.left_center(), Align2::LEFT_CENTER, label, FontId::new(12.0, egui::FontFamily::Proportional), theme::MUTED);
    value(ui);
  });
}

/// The largest size with `content`'s aspect that fits in `bounds`.
pub fn fit_inside(content: egui::Vec2, bounds: egui::Vec2) -> egui::Vec2 {
  if content.x <= 0.0 || content.y <= 0.0 {
    return bounds;
  }
  let scale = (bounds.x / content.x).min(bounds.y / content.y);
  content * scale
}
