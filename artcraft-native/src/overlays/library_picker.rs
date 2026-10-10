//! "Pick from library" (`GalleryModal mode="select"`): the user's images, videos or audio in a
//! grid, choosing up to the free reference slots.

use std::collections::HashSet;

use egui::{Align2, Color32, FontId, Id, Rect, Sense, Stroke, pos2, vec2};

use crate::backend::media_cache::{Lookup, MediaCache};
use crate::backend::wire::MediaFile;
use crate::feed::types::MediaKind;
use crate::prompt_box::deck::cover_uv;
use crate::prompt_box::refs::{ImageSlot, RefKind, RefMedia};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

const TILE_GAP: f32 = 8.0;
const COLUMNS: usize = 5;

pub struct LibraryPicker {
  pub kind: RefKind,
  pub slot: ImageSlot,
  /// Which page asked (the picked media goes back there).
  pub page: MediaKind,
  pub max: usize,
  pub items: Vec<MediaFile>,
  pub loading: bool,
  pub has_more: bool,
  pub next_page: u32,
  /// Already attached: shown but not selectable.
  pub attached: HashSet<String>,
  selected: Vec<String>,
}

#[derive(Debug)]
pub enum PickerAction {
  Close,
  Confirm(Vec<RefMedia>),
  LoadMore,
}

impl LibraryPicker {
  pub fn new(kind: RefKind, slot: ImageSlot, page: MediaKind, max: usize, attached: HashSet<String>) -> Self {
    Self { kind, slot, page, max: max.max(1), items: Vec::new(), loading: false, has_more: true, next_page: 0, attached, selected: Vec::new() }
  }

  /// The library's media class filter for this picker.
  pub fn media_class(&self) -> &'static str {
    match self.kind {
      RefKind::Image => "image",
      RefKind::Video => "video",
      RefKind::Audio => "audio",
    }
  }

  pub fn apply_page(&mut self, page: u32, files: Vec<MediaFile>, total_pages: u32) {
    self.loading = false;
    if page != self.next_page {
      return;
    }
    for f in files {
      if !self.items.iter().any(|i| i.token == f.token) {
        self.items.push(f);
      }
    }
    self.next_page = page + 1;
    self.has_more = self.next_page < total_pages;
  }

  pub fn show(&mut self, ctx: &egui::Context, cache: &mut MediaCache) -> Vec<PickerAction> {
    let mut actions = Vec::new();
    let screen = ctx.content_rect();
    let width = (screen.width() - 80.0).min(960.0);
    let height = (screen.height() - 120.0).min(680.0);
    let noun = match self.kind {
      RefKind::Image => "images",
      RefKind::Video => "videos",
      RefKind::Audio => "audio",
    };
    let close = widgets::modal(ctx, Id::new("library-picker"), width, |ui| {
      ui.horizontal(|ui| {
        ui.label(widgets::heading("Pick from library", 22.0));
        ui.add_space(8.0);
        widgets::hud(ui, noun, theme::MUTED);
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
            actions.push(PickerAction::Close);
          }
        });
      });
      ui.add_space(10.0);
      let grid_h = height - 120.0;
      egui::ScrollArea::vertical().max_height(grid_h).min_scrolled_height(grid_h).auto_shrink([false, false]).show_viewport(ui, |ui, viewport| {
        let w = ui.available_width();
        let tile = (w - TILE_GAP * (COLUMNS - 1) as f32) / COLUMNS as f32;
        let rows = self.items.len().div_ceil(COLUMNS);
        let total = rows as f32 * (tile + TILE_GAP);
        let origin = ui.min_rect().min;
        ui.allocate_exact_size(vec2(w, total + 48.0), Sense::hover());
        let mut toggled = None;
        for (i, item) in self.items.iter().enumerate() {
          let local = Rect::from_min_size(pos2((i % COLUMNS) as f32 * (tile + TILE_GAP), (i / COLUMNS) as f32 * (tile + TILE_GAP)), vec2(tile, tile));
          if !local.intersects(viewport.expand(tile)) {
            continue;
          }
          let rect = local.translate(origin.to_vec2());
          let attached = self.attached.contains(&item.token);
          let order = self.selected.iter().position(|t| *t == item.token);
          if tile_ui(ui, rect, item, self.kind, attached, order, cache) {
            toggled = Some(item.token.clone());
          }
        }
        if let Some(token) = toggled {
          self.toggle(token);
        }
        if self.items.is_empty() && !self.loading && !self.has_more {
          ui.painter().text(origin + vec2(w / 2.0, 80.0), Align2::CENTER_CENTER, format!("No {noun} in your library yet"), FontId::new(14.0, egui::FontFamily::Proportional), theme::MUTED);
        }
        if self.loading {
          icons::paint_spinner(ui, Rect::from_center_size(origin + vec2(w / 2.0, total + 24.0), vec2(24.0, 24.0)), theme::MUTED);
        } else if self.has_more && viewport.max.y + 300.0 >= total {
          actions.push(PickerAction::LoadMore);
        }
      });
      ui.add_space(12.0);
      ui.horizontal(|ui| {
        widgets::hud(ui, &format!("{}/{} selected", self.selected.len(), self.max), theme::MUTED);
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          let any = !self.selected.is_empty();
          if ui.add_enabled_ui(any, |ui| widgets::button(ui, None, "Use selected", widgets::Kind::Primary, 0.0, theme::CONTROL_H)).inner.clicked() {
            actions.push(PickerAction::Confirm(self.picks()));
          }
          if ui.add_enabled_ui(any, |ui| widgets::button(ui, None, "Deselect all", widgets::Kind::Secondary, 0.0, theme::CONTROL_H)).inner.clicked() {
            self.selected.clear();
          }
        });
      });
    });
    if close {
      actions.push(PickerAction::Close);
    }
    actions
  }

  fn toggle(&mut self, token: String) {
    if let Some(i) = self.selected.iter().position(|t| *t == token) {
      self.selected.remove(i);
    } else if self.max == 1 {
      self.selected = vec![token];
    } else if self.selected.len() < self.max {
      self.selected.push(token);
    }
  }

  fn picks(&self) -> Vec<RefMedia> {
    self.selected.iter().filter_map(|t| self.items.iter().find(|i| i.token == *t)).map(|f| RefMedia::from_library(self.kind, f.token.clone(), f.media_links.thumbnail(256), Some(f.media_links.cdn_url.clone()), f.maybe_duration_millis.map_or(0.0, |ms| ms as f32 / 1000.0))).collect()
  }
}

/// One square tile; returns whether it was clicked (and is selectable).
fn tile_ui(ui: &mut egui::Ui, rect: Rect, item: &MediaFile, kind: RefKind, attached: bool, order: Option<usize>, cache: &mut MediaCache) -> bool {
  let resp = ui.interact(rect, Id::new(("picker-tile", &item.token)), if attached { Sense::hover() } else { Sense::click() });
  let p = ui.painter();
  p.rect_filled(rect, 0.0, theme::fade(theme::CONTROLS, 0.6));
  match item.media_links.thumbnail(256).map(|u| cache.get(ui.ctx(), &u)) {
    Some(Lookup::Ready(t)) => {
      let image = egui::Image::new(&t).uv(cover_uv(t.size_vec2()));
      let image = if attached { image.tint(Color32::from_gray(90)) } else { image };
      image.paint_at(ui, rect);
    },
    _ => {
      let icon = match kind {
        RefKind::Image => Icon::Image,
        RefKind::Video => Icon::Video,
        RefKind::Audio => Icon::Music,
      };
      icons::paint(ui.painter(), Rect::from_center_size(rect.center(), vec2(26.0, 26.0)), icon, theme::FAINT);
    },
  }
  if let Some(ms) = item.maybe_duration_millis.filter(|_| kind != RefKind::Image) {
    let strip = Rect::from_min_max(pos2(rect.left(), rect.bottom() - 18.0), rect.max);
    ui.painter().rect_filled(strip, 0.0, Color32::from_black_alpha(178));
    ui.painter().text(strip.center(), Align2::CENTER_CENTER, format!("{:.0}s", ms as f32 / 1000.0), FontId::new(11.0, theme::semibold()), Color32::WHITE);
  }
  let p = ui.painter();
  if attached {
    p.text(rect.center(), Align2::CENTER_CENTER, "Attached", FontId::new(11.0, theme::semibold()), theme::fade(Color32::WHITE, 0.7));
  } else if let Some(i) = order {
    p.rect_stroke(rect, 0.0, Stroke::new(2.0, theme::ACCENT_400), egui::StrokeKind::Inside);
    let chip = Rect::from_min_size(rect.min + vec2(8.0, 8.0), vec2(22.0, 22.0));
    p.rect_filled(chip, theme::RADIUS, theme::ACCENT_400);
    p.text(chip.center(), Align2::CENTER_CENTER, (i + 1).to_string(), FontId::new(11.0, theme::semibold()), Color32::WHITE);
  } else if resp.hovered() {
    p.rect_stroke(rect, 0.0, Stroke::new(2.0, theme::fade(theme::ACCENT_400, 0.6)), egui::StrokeKind::Inside);
  }
  !attached && resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}
