//! The characters dialog (`CharactersModal`): pick a saved character to mention it in the prompt,
//! make a new one from a reference image, rename or re-describe one, or delete it.

use std::path::PathBuf;
use std::sync::Arc;

use egui::{Align2, Color32, FontId, Id, Rect, Sense, Stroke, Ui, pos2, vec2};

use crate::backend::UploadedMedia;
use crate::backend::media_cache::{Lookup, MediaCache};
use crate::backend::wire::Character;
use crate::prompt_box::deck::cover_uv;
use crate::prompt_box::refs::{RefKind, RefMedia, RefStatus};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

const COLUMNS: usize = 4;
const GAP: f32 = 12.0;

#[derive(Clone, PartialEq)]
enum View {
  List,
  Edit(String),
  Create,
}

pub struct CharactersModal {
  view: View,
  confirm_delete: Option<(String, String)>,
  name: String,
  description: String,
  image: Option<RefMedia>,
}

/// Something only the app can do for the dialog.
#[derive(Debug)]
pub enum CharactersAction {
  Close,
  /// Mention this character in the prompt.
  Select {
    token: String,
    name: String,
  },
  Upload {
    ref_id: u64,
    path: PathBuf,
  },
  Create {
    image_token: String,
    name: String,
    description: Option<String>,
  },
  Edit {
    token: String,
    name: String,
    description: String,
  },
  Delete {
    token: String,
    name: String,
  },
  Preview(String),
  Toast(String),
}

impl CharactersModal {
  pub fn new() -> Self {
    Self { view: View::List, confirm_delete: None, name: String::new(), description: String::new(), image: None }
  }

  /// The reference image being uploaded for a new character, if `ref_id` is it.
  pub fn apply_upload(&mut self, ref_id: u64, result: Result<UploadedMedia, String>) -> Option<Result<(), String>> {
    let image = self.image.as_mut().filter(|i| i.id == ref_id)?;
    Some(match result {
      Ok(media) => {
        image.status = RefStatus::Ready;
        image.token = Some(media.token);
        image.full_url = media.full_url;
        Ok(())
      },
      Err(err) => {
        self.image = None;
        Err(err)
      },
    })
  }

  pub fn show(&mut self, ctx: &egui::Context, characters: &[Character], pending: &[String], cache: &mut MediaCache) -> Vec<CharactersAction> {
    let mut actions = Vec::new();
    let width = (ctx.content_rect().width() - 80.0).min(760.0);
    let close = widgets::modal(ctx, Id::new("characters"), width, |ui| match self.view.clone() {
      View::List => self.list(ui, characters, pending, cache, &mut actions),
      View::Edit(token) => match characters.iter().find(|c| c.token == token) {
        Some(c) => self.edit(ui, c, cache, &mut actions),
        None => self.view = View::List,
      },
      View::Create => self.create(ui, cache, &mut actions),
    });
    if close && self.confirm_delete.is_none() {
      actions.push(CharactersAction::Close);
    }
    if let Some((token, name)) = self.confirm_delete.clone() {
      let mut choice = None;
      let dismissed = widgets::modal(ctx, Id::new("character-delete"), 420.0, |ui| {
        ui.label(widgets::heading("Delete character?", 20.0));
        ui.add_space(8.0);
        ui.label(egui::RichText::new(format!("\u{201c}{name}\u{201d} will be removed from your characters.")).color(theme::MUTED));
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
      if dismissed || choice.is_some() {
        self.confirm_delete = None;
      }
      if choice == Some(true) {
        actions.push(CharactersAction::Delete { token, name });
      }
    }
    actions
  }

  fn header(&mut self, ui: &mut Ui, title: &str, back: bool, actions: &mut Vec<CharactersAction>) {
    ui.horizontal(|ui| {
      if back && widgets::ghost(ui, Icon::ChevronLeft, None, "Back", false).clicked() {
        self.view = View::List;
      }
      ui.label(widgets::heading(title, 22.0));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if widgets::ghost(ui, Icon::X, None, "Close", false).clicked() {
          actions.push(CharactersAction::Close);
        }
      });
    });
    ui.add_space(12.0);
  }

  fn list(&mut self, ui: &mut Ui, characters: &[Character], pending: &[String], cache: &mut MediaCache, actions: &mut Vec<CharactersAction>) {
    self.header(ui, "Characters", false, actions);
    let tile = (ui.available_width() - GAP * (COLUMNS - 1) as f32) / COLUMNS as f32;
    let max_h = ui.ctx().content_rect().height() * 0.6;
    egui::ScrollArea::vertical().max_height(max_h).auto_shrink([false, true]).show(ui, |ui| {
      let total = 1 + pending.len() + characters.len();
      let rows = total.div_ceil(COLUMNS);
      let origin = ui.cursor().min;
      ui.allocate_exact_size(vec2(ui.available_width(), rows as f32 * (tile + 30.0 + GAP)), Sense::hover());
      let cell = |i: usize| Rect::from_min_size(origin + vec2((i % COLUMNS) as f32 * (tile + GAP), (i / COLUMNS) as f32 * (tile + 30.0 + GAP)), vec2(tile, tile));
      // "Create New" first.
      let create = cell(0);
      let resp = ui.interact(create, Id::new("character-create"), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
      resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, "Create New"));
      ui.painter().rect_filled(create, theme::RADIUS, theme::fade(theme::CONTROLS, if resp.hovered() { 0.7 } else { 0.4 }));
      icons::dashed_rect(ui.painter(), create.shrink(1.0), Stroke::new(1.5, theme::LINE_DASHED), 5.0, 4.0);
      icons::paint(ui.painter(), Rect::from_center_size(create.center() - vec2(0.0, 10.0), vec2(22.0, 22.0)), Icon::Plus, theme::INK);
      ui.painter().text(create.center() + vec2(0.0, 16.0), Align2::CENTER_CENTER, "Create New", FontId::new(13.0, theme::medium()), theme::INK);
      if resp.clicked() {
        self.name.clear();
        self.description.clear();
        self.image = None;
        self.view = View::Create;
      }
      for (i, name) in pending.iter().enumerate() {
        let r = cell(1 + i);
        ui.painter().rect_filled(r, theme::RADIUS, theme::WASH);
        icons::paint_spinner(ui, Rect::from_center_size(r.center(), vec2(24.0, 24.0)), theme::MUTED);
        caption(ui, r, name, "Creating...");
      }
      for (i, c) in characters.iter().enumerate() {
        let r = cell(1 + pending.len() + i);
        let resp = ui.interact(r, Id::new(("character", &c.token)), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
        resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, &c.name));
        thumbnail(ui, r, c.avatar_url().as_deref(), cache);
        if resp.hovered() {
          ui.painter().rect_stroke(r, theme::RADIUS, Stroke::new(2.0, theme::fade(theme::ACCENT_400, 0.7)), egui::StrokeKind::Inside);
        }
        caption(ui, r, &c.name, "");
        let mut clicked_tool = false;
        if ui.rect_contains_pointer(r) {
          let tools = Rect::from_min_size(pos2(r.right() - 64.0, r.top() + 6.0), vec2(58.0, 28.0));
          ui.painter().rect_filled(tools, theme::RADIUS, Color32::from_black_alpha(160));
          let mut child = ui.new_child(egui::UiBuilder::new().max_rect(tools.shrink(1.0)).layout(egui::Layout::left_to_right(egui::Align::Center)));
          child.spacing_mut().item_spacing.x = 0.0;
          if widgets::overlay_icon(&mut child, Icon::Pencil, "Edit character").clicked() {
            self.name = c.name.clone();
            self.description = c.maybe_description.clone().unwrap_or_default();
            self.view = View::Edit(c.token.clone());
            clicked_tool = true;
          }
          if widgets::overlay_icon(&mut child, Icon::Trash, "Delete character").clicked() {
            self.confirm_delete = Some((c.token.clone(), c.name.clone()));
            clicked_tool = true;
          }
        }
        if resp.clicked() && !clicked_tool {
          actions.push(CharactersAction::Select { token: c.token.clone(), name: c.name.clone() });
        }
      }
    });
  }

  fn edit(&mut self, ui: &mut Ui, c: &Character, cache: &mut MediaCache, actions: &mut Vec<CharactersAction>) {
    self.header(ui, "Edit Character", true, actions);
    ui.horizontal_top(|ui| {
      ui.vertical(|ui| {
        let (r, _) = ui.allocate_exact_size(vec2(240.0, 240.0), Sense::hover());
        thumbnail(ui, r, c.full_url().or_else(|| c.avatar_url()).as_deref(), cache);
        if let Some(url) = c.full_url() {
          if ui.add(egui::Button::new(egui::RichText::new("View full size").size(12.0).color(theme::ACCENT_INK)).frame(false)).clicked() {
            actions.push(CharactersAction::Preview(url));
          }
        }
      });
      ui.add_space(16.0);
      ui.vertical(|ui| {
        fields(ui, &mut self.name, &mut self.description);
        ui.add_space(16.0);
        ui.horizontal(|ui| {
          if widgets::button(ui, None, "Save", widgets::Kind::Primary, 0.0, theme::CONTROL_H).clicked() {
            if self.name.trim().is_empty() {
              actions.push(CharactersAction::Toast("Name cannot be empty".to_owned()));
            } else {
              actions.push(CharactersAction::Edit { token: c.token.clone(), name: self.name.trim().to_owned(), description: self.description.trim().to_owned() });
              self.view = View::List;
            }
          }
          if widgets::button(ui, None, "Cancel", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
            self.view = View::List;
          }
        });
      });
    });
  }

  fn create(&mut self, ui: &mut Ui, cache: &mut MediaCache, actions: &mut Vec<CharactersAction>) {
    self.header(ui, "New Character", true, actions);
    ui.horizontal_top(|ui| {
      ui.vertical(|ui| {
        widgets::hud(ui, "Reference", theme::FAINT);
        ui.add_space(6.0);
        let (r, resp) = ui.allocate_exact_size(vec2(240.0, 240.0), Sense::click());
        match &self.image {
          Some(img) => {
            thumbnail(ui, r, img.preview.as_deref(), cache);
            if img.status == RefStatus::Uploading {
              ui.painter().rect_filled(r, theme::RADIUS, Color32::from_black_alpha(110));
              icons::paint_spinner(ui, Rect::from_center_size(r.center(), vec2(28.0, 28.0)), Color32::WHITE);
            }
          },
          None => {
            ui.painter().rect_filled(r, theme::RADIUS, theme::fade(theme::CONTROLS, if resp.hovered() { 0.7 } else { 0.4 }));
            icons::dashed_rect(ui.painter(), r.shrink(1.0), Stroke::new(1.5, theme::LINE_DASHED), 5.0, 4.0);
            icons::paint(ui.painter(), Rect::from_center_size(r.center() - vec2(0.0, 12.0), vec2(24.0, 24.0)), Icon::Upload, theme::INK);
            ui.painter().text(r.center() + vec2(0.0, 18.0), Align2::CENTER_CENTER, "Upload reference image", FontId::new(13.0, theme::medium()), theme::INK);
          },
        }
        if resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
          if let Some(path) = crate::pages::common::pick_files(&[RefKind::Image], false).into_iter().next() {
            match std::fs::read(&path) {
              Ok(bytes) => {
                let mut img = RefMedia::uploading(RefKind::Image, None);
                let key = format!("local://{}", img.id);
                cache.insert_bytes(ui.ctx(), &key, Arc::from(bytes));
                img.preview = Some(key);
                actions.push(CharactersAction::Upload { ref_id: img.id, path });
                self.image = Some(img);
              },
              Err(err) => actions.push(CharactersAction::Toast(format!("Failed to upload {}: {err}", crate::pages::common::file_name(&path)))),
            }
          }
        }
      });
      ui.add_space(16.0);
      ui.vertical(|ui| {
        fields(ui, &mut self.name, &mut self.description);
        ui.add_space(16.0);
        let uploading = self.image.as_ref().is_some_and(|i| i.status == RefStatus::Uploading);
        ui.horizontal(|ui| {
          if ui.add_enabled_ui(!uploading, |ui| widgets::button(ui, Some(Icon::Sparkles), "Create", widgets::Kind::Primary, 0.0, theme::CONTROL_H)).inner.clicked() {
            match (self.name.trim(), self.image.as_ref().and_then(|i| i.token.clone())) {
              ("", _) => actions.push(CharactersAction::Toast("Please enter a character name".to_owned())),
              (_, None) => actions.push(CharactersAction::Toast("Please upload a reference image".to_owned())),
              (name, Some(image_token)) => {
                let description = Some(self.description.trim().to_owned()).filter(|d| !d.is_empty());
                actions.push(CharactersAction::Create { image_token, name: name.to_owned(), description });
                self.view = View::List;
              },
            }
          }
          if widgets::button(ui, None, "Cancel", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
            self.view = View::List;
          }
        });
      });
    });
  }
}

/// The name and description inputs shared by create and edit.
fn fields(ui: &mut Ui, name: &mut String, description: &mut String) {
  widgets::hud(ui, "Character name", theme::FAINT);
  ui.add_space(4.0);
  input_frame(ui, |ui| ui.add(egui::TextEdit::singleline(name).frame(egui::Frame::NONE).desired_width(f32::INFINITY).hint_text(egui::RichText::new("Character name").color(theme::FAINT))));
  ui.add_space(10.0);
  widgets::hud(ui, "Description", theme::FAINT);
  ui.add_space(4.0);
  input_frame(ui, |ui| ui.add(egui::TextEdit::multiline(description).frame(egui::Frame::NONE).desired_width(f32::INFINITY).desired_rows(4).hint_text(egui::RichText::new("Description...").color(theme::FAINT))));
}

fn input_frame(ui: &mut Ui, add: impl FnOnce(&mut Ui) -> egui::Response) {
  egui::Frame::new().fill(theme::SUNKEN).stroke(theme::hairline()).corner_radius(theme::RADIUS).inner_margin(egui::Margin::symmetric(10, 8)).show(ui, |ui| add(ui));
}

fn thumbnail(ui: &Ui, rect: Rect, url: Option<&str>, cache: &mut MediaCache) {
  ui.painter().rect_filled(rect, theme::RADIUS, theme::WASH);
  match url.map(|u| cache.get(ui.ctx(), u)) {
    Some(Lookup::Ready(t)) => {
      egui::Image::new(&t).uv(cover_uv(t.size_vec2())).corner_radius(theme::RADIUS).paint_at(ui, rect);
    },
    Some(Lookup::Loading) => icons::paint_spinner(ui, Rect::from_center_size(rect.center(), vec2(20.0, 20.0)), theme::FAINT),
    _ => icons::paint(ui.painter(), Rect::from_center_size(rect.center(), vec2(28.0, 28.0)), Icon::User, theme::FAINT),
  }
}

/// The name under a tile (and a muted note after it).
fn caption(ui: &Ui, tile: Rect, name: &str, note: &str) {
  let y = tile.bottom() + 15.0;
  let galley = ui.painter().layout_no_wrap(name.to_owned(), FontId::new(13.0, theme::medium()), theme::INK);
  let w = galley.size().x.min(tile.width());
  ui.painter().with_clip_rect(Rect::from_min_size(pos2(tile.left(), y - 10.0), vec2(tile.width(), 20.0))).galley(pos2(tile.left(), y - galley.size().y / 2.0), galley, theme::INK);
  if !note.is_empty() {
    ui.painter().text(pos2(tile.left() + w + 6.0, y), Align2::LEFT_CENTER, note, FontId::new(11.5, egui::FontFamily::Proportional), theme::MUTED);
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use egui_kittest::Harness;
  use egui_kittest::kittest::Queryable;

  struct State {
    _rt: tokio::runtime::Runtime,
    cache: MediaCache,
    modal: CharactersModal,
    characters: Vec<Character>,
    actions: Vec<String>,
    fonts_ready: bool,
  }

  fn harness() -> Harness<'static, State> {
    let rt = tokio::runtime::Builder::new_current_thread().enable_all().build().expect("runtime");
    let cache = MediaCache::new(rt.handle().clone(), reqwest::Client::new());
    let characters = vec![Character { token: "c1".into(), name: "Mira".into(), ..Default::default() }];
    let state = State { _rt: rt, cache, modal: CharactersModal::new(), characters, actions: Vec::new(), fonts_ready: false };
    let mut harness = Harness::builder().with_size(egui::vec2(1000.0, 800.0)).build_ui_state(
      |ui, s: &mut State| {
        // The harness draws one frame while building: fonts are installed then, used from the next.
        if !s.fonts_ready {
          crate::theme::apply(ui.ctx());
          s.fonts_ready = true;
          return;
        }
        let actions = s.modal.show(ui.ctx(), &s.characters, &[], &mut s.cache);
        s.actions.extend(actions.iter().map(|a| format!("{a:?}")));
      },
      state,
    );
    harness.run();
    harness
  }

  #[test]
  fn picking_a_character_mentions_it() {
    let mut harness = harness();
    harness.get_by_label("Mira").click();
    harness.run();
    assert!(harness.state().actions.iter().any(|a| a.contains("Select") && a.contains("Mira")), "{:?}", harness.state().actions);
  }

  #[test]
  fn creating_needs_a_name_and_a_reference() {
    let mut harness = harness();
    harness.get_by_label("Create New").click();
    harness.run();
    harness.get_by_label("Create").click();
    harness.run();
    assert_eq!(harness.state().actions, [r#"Toast("Please enter a character name")"#]);
    harness.get_by_role(egui::accesskit::Role::TextInput).focus();
    harness.run();
    harness.get_by_role(egui::accesskit::Role::TextInput).type_text("Mira");
    harness.run();
    harness.get_by_label("Create").click();
    harness.run();
    assert_eq!(harness.state().actions.last().map(String::as_str), Some(r#"Toast("Please upload a reference image")"#));
  }
}
