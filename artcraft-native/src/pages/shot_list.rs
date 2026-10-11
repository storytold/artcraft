//! Shot List: a local board of shots for a scene or short. Titles, duration, camera, status and
//! notes live in `~/Artcraft/shot_list.json`. Nothing is sent anywhere.

use std::fs;
use std::path::{Path, PathBuf};

use egui::{Align2, Color32, FontId, Id, Rect, Sense, Ui, pos2, vec2};
use log::warn;
use serde::{Deserialize, Serialize};

use crate::theme;
use crate::ui::icons::Icon;
use crate::ui::widgets;

const STORE_NAME: &str = "shot_list.json";
const MAX_TITLE: usize = 120;
const MAX_TEXT: usize = 4_000;

/// How far a shot has come.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ShotStatus {
  #[default]
  Idea,
  Ready,
  Shooting,
  Done,
}

impl ShotStatus {
  pub const ALL: [ShotStatus; 4] = [ShotStatus::Idea, ShotStatus::Ready, ShotStatus::Shooting, ShotStatus::Done];

  pub fn label(self) -> &'static str {
    match self {
      ShotStatus::Idea => "Idea",
      ShotStatus::Ready => "Ready",
      ShotStatus::Shooting => "Shooting",
      ShotStatus::Done => "Done",
    }
  }
}

/// One row on the board.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Shot {
  pub id: String,
  pub title: String,
  pub description: String,
  pub duration_secs: u32,
  pub camera: String,
  pub status: ShotStatus,
}

impl Shot {
  pub fn new(title: impl Into<String>) -> Self {
    Self { id: uuid::Uuid::new_v4().to_string(), title: title.into(), description: String::new(), duration_secs: 0, camera: String::new(), status: ShotStatus::Idea }
  }
}

/// The document written to disk.
#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct ShotListDoc {
  #[serde(default)]
  pub shots: Vec<Shot>,
}

impl ShotListDoc {
  pub fn add(&mut self, title: impl Into<String>) -> String {
    let shot = Shot::new(title);
    let id = shot.id.clone();
    self.shots.push(shot);
    id
  }

  pub fn remove(&mut self, id: &str) -> bool {
    let before = self.shots.len();
    self.shots.retain(|s| s.id != id);
    self.shots.len() != before
  }

  pub fn get_mut(&mut self, id: &str) -> Option<&mut Shot> {
    self.shots.iter_mut().find(|s| s.id == id)
  }

  pub fn move_by(&mut self, id: &str, delta: i32) -> bool {
    let Some(i) = self.shots.iter().position(|s| s.id == id) else {
      return false;
    };
    let j = i as i32 + delta;
    if j < 0 || j as usize >= self.shots.len() {
      return false;
    }
    self.shots.swap(i, j as usize);
    true
  }

  pub fn filtered(&self, query: &str, status: Option<ShotStatus>) -> Vec<&Shot> {
    let q = query.trim().to_lowercase();
    self
      .shots
      .iter()
      .filter(|s| status.is_none_or(|st| s.status == st))
      .filter(|s| {
        if q.is_empty() {
          return true;
        }
        s.title.to_lowercase().contains(&q) || s.description.to_lowercase().contains(&q) || s.camera.to_lowercase().contains(&q)
      })
      .collect()
  }

  /// A padded Markdown table, newest order as stored.
  pub fn to_markdown(&self) -> String {
    let mut rows: Vec<[String; 6]> = Vec::with_capacity(self.shots.len() + 1);
    rows.push(["#".into(), "Title".into(), "Duration".into(), "Camera".into(), "Status".into(), "Description".into()]);
    for (i, shot) in self.shots.iter().enumerate() {
      rows.push([(i + 1).to_string(), shot.title.clone(), format_duration(shot.duration_secs), shot.camera.clone(), shot.status.label().to_owned(), one_line(&shot.description)]);
    }
    pad_table(&rows)
  }

  pub fn load(path: &Path) -> Result<Self, String> {
    let text = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
  }

  pub fn save(&self, path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
      fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
    fs::write(path, text).map_err(|e| e.to_string())
  }
}

/// The Studio › Shot List page.
pub struct ShotListPage {
  path: PathBuf,
  doc: ShotListDoc,
  selected: Option<String>,
  query: String,
  filter: Option<ShotStatus>,
  dirty: bool,
  notice: Option<String>,
}

impl ShotListPage {
  pub fn new(data_root: &Path) -> Self {
    let path = data_root.join(STORE_NAME);
    let (doc, notice) = match ShotListDoc::load(&path) {
      Ok(doc) => (doc, None),
      Err(_) if !path.exists() => (ShotListDoc::default(), None),
      Err(err) => (ShotListDoc::default(), Some(format!("Couldn't read the shot list: {err}"))),
    };
    let selected = doc.shots.first().map(|s| s.id.clone());
    Self { path, doc, selected, query: String::new(), filter: None, dirty: false, notice }
  }

  pub fn ui(&mut self, ui: &mut Ui) {
    ui.add_space(8.0);
    ui.horizontal(|ui| {
      ui.add_space(20.0);
      ui.vertical(|ui| {
        ui.set_width((ui.available_width() - 16.0).max(240.0));
        self.toolbar(ui);
        if let Some(notice) = &self.notice {
          ui.add_space(8.0);
          ui.label(egui::RichText::new(notice).color(theme::BAD).size(13.0));
        }
        ui.add_space(12.0);
        let height = (ui.available_height() - 12.0).max(220.0);
        ui.horizontal(|ui| {
          ui.set_height(height);
          let list_w = (ui.available_width() * 0.38).clamp(220.0, 420.0);
          ui.vertical(|ui| {
            ui.set_width(list_w);
            ui.set_min_height(height);
            self.list_pane(ui);
          });
          ui.add_space(16.0);
          ui.vertical(|ui| {
            ui.set_width(ui.available_width());
            ui.set_min_height(height);
            self.editor_pane(ui);
          });
        });
      });
    });
    if self.dirty {
      self.persist();
    }
  }

  fn toolbar(&mut self, ui: &mut Ui) {
    ui.horizontal(|ui| {
      ui.spacing_mut().item_spacing.x = 8.0;
      if widgets::button(ui, Some(Icon::Plus), "New Shot", widgets::Kind::Primary, 0.0, 36.0).clicked() {
        self.add_shot();
      }
      ui.add_enabled_ui(!self.doc.shots.is_empty(), |ui| {
        if widgets::button(ui, Some(Icon::Download), "Export Markdown", widgets::Kind::Secondary, 0.0, 36.0).clicked() {
          self.export_markdown();
        }
      });
      ui.add_space(12.0);
      let mut query = std::mem::take(&mut self.query);
      ui.add(egui::TextEdit::singleline(&mut query).desired_width(220.0).hint_text("Search shots").id(Id::new("shot-list-search")));
      self.query = query;
      ui.add_space(8.0);
      self.filter_chips(ui);
    });
  }

  fn filter_chips(&mut self, ui: &mut Ui) {
    if chip(ui, "All", self.filter.is_none()).clicked() {
      self.filter = None;
    }
    for status in ShotStatus::ALL {
      if chip(ui, status.label(), self.filter == Some(status)).clicked() {
        self.filter = if self.filter == Some(status) { None } else { Some(status) };
      }
    }
  }

  fn list_pane(&mut self, ui: &mut Ui) {
    egui::Frame::new().fill(theme::WASH).stroke(theme::hairline()).inner_margin(egui::Margin::same(8)).show(ui, |ui| {
      ui.set_min_height(ui.available_height());
      ui.set_width(ui.available_width());
      let visible: Vec<String> = self.doc.filtered(&self.query, self.filter).into_iter().map(|s| s.id.clone()).collect();
      if visible.is_empty() {
        ui.centered_and_justified(|ui| {
          ui.label(egui::RichText::new(if self.doc.shots.is_empty() { "No shots yet. Add one to start a board." } else { "No shots match this search." }).color(theme::MUTED));
        });
        return;
      }
      egui::ScrollArea::vertical().id_salt("shot-list-rows").auto_shrink([false, false]).show(ui, |ui| {
        ui.set_width(ui.available_width());
        for id in visible {
          if let Some(shot) = self.doc.shots.iter().find(|s| s.id == id) {
            let selected = self.selected.as_deref() == Some(id.as_str());
            if shot_row(ui, shot, selected).clicked() {
              self.selected = Some(id);
            }
            ui.add_space(4.0);
          }
        }
      });
    });
  }

  fn editor_pane(&mut self, ui: &mut Ui) {
    egui::Frame::new().fill(theme::WASH).stroke(theme::hairline()).inner_margin(egui::Margin::same(18)).show(ui, |ui| {
      ui.set_min_height(ui.available_height());
      ui.set_width(ui.available_width());
      let Some(id) = self.selected.clone() else {
        ui.centered_and_justified(|ui| {
          ui.label(egui::RichText::new("Select a shot, or add a new one.").color(theme::MUTED));
        });
        return;
      };
      let Some(index) = self.doc.shots.iter().position(|s| s.id == id) else {
        ui.label(egui::RichText::new("That shot is gone.").color(theme::MUTED));
        return;
      };
      let total = self.doc.shots.len();
      ui.horizontal(|ui| {
        ui.label(widgets::heading("Shot", 28.0));
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
          ui.spacing_mut().item_spacing.x = 6.0;
          if widgets::ghost(ui, Icon::Trash, None, "Delete shot", false).clicked() {
            self.delete_selected();
          }
          ui.add_enabled_ui(index + 1 < total, |ui| {
            if widgets::ghost(ui, Icon::ChevronDown, None, "Move down", false).clicked() {
              self.doc.move_by(&id, 1);
              self.dirty = true;
            }
          });
          ui.add_enabled_ui(index > 0, |ui| {
            if widgets::ghost(ui, Icon::ChevronUp, None, "Move up", false).clicked() {
              self.doc.move_by(&id, -1);
              self.dirty = true;
            }
          });
        });
      });
      if self.selected.as_deref() != Some(id.as_str()) {
        return;
      }
      let Some(shot) = self.doc.get_mut(&id) else {
        return;
      };
      ui.add_space(12.0);
      widgets::hud(ui, "Title", theme::FAINT);
      ui.add_space(4.0);
      let title = ui.add(egui::TextEdit::singleline(&mut shot.title).desired_width(ui.available_width()).hint_text("Wide shot of the hall").char_limit(MAX_TITLE));
      if title.changed() {
        self.dirty = true;
      }
      ui.add_space(12.0);
      ui.horizontal(|ui| {
        ui.vertical(|ui| {
          ui.set_width(140.0);
          widgets::hud(ui, "Duration (sec)", theme::FAINT);
          ui.add_space(4.0);
          if ui.add(egui::DragValue::new(&mut shot.duration_secs).range(0..=600).speed(1.0).suffix(" s")).changed() {
            self.dirty = true;
          }
        });
        ui.add_space(16.0);
        ui.vertical(|ui| {
          ui.set_width((ui.available_width() - 16.0).max(80.0));
          widgets::hud(ui, "Camera", theme::FAINT);
          ui.add_space(4.0);
          if ui.add(egui::TextEdit::singleline(&mut shot.camera).desired_width(ui.available_width()).hint_text("35mm, tracking left").char_limit(MAX_TITLE)).changed() {
            self.dirty = true;
          }
        });
      });
      ui.add_space(12.0);
      widgets::hud(ui, "Status", theme::FAINT);
      ui.add_space(6.0);
      ui.horizontal(|ui| {
        let current = shot.status;
        for status in ShotStatus::ALL {
          if chip(ui, status.label(), current == status).clicked() {
            shot.status = status;
            self.dirty = true;
          }
        }
      });
      ui.add_space(12.0);
      widgets::hud(ui, "Description", theme::FAINT);
      ui.add_space(4.0);
      let desc = ui.add(egui::TextEdit::multiline(&mut shot.description).desired_width(ui.available_width()).desired_rows(8).hint_text("What happens in this shot.").char_limit(MAX_TEXT));
      if desc.changed() {
        self.dirty = true;
      }
    });
  }

  fn add_shot(&mut self) {
    let n = self.doc.shots.len() + 1;
    let id = self.doc.add(format!("Shot {n}"));
    self.selected = Some(id);
    self.dirty = true;
  }

  fn delete_selected(&mut self) {
    let Some(id) = self.selected.clone() else {
      return;
    };
    let idx = self.doc.shots.iter().position(|s| s.id == id);
    self.doc.remove(&id);
    self.selected = idx.and_then(|i| if i < self.doc.shots.len() { Some(self.doc.shots[i].id.clone()) } else { self.doc.shots.last().map(|s| s.id.clone()) });
    self.dirty = true;
  }

  fn export_markdown(&self) {
    let name = "shot-list.md";
    if let Some(path) = rfd::FileDialog::new().set_file_name(name).save_file() {
      if let Err(err) = fs::write(&path, self.doc.to_markdown()) {
        warn!("Couldn't export shot list: {err}");
      }
    }
  }

  fn persist(&mut self) {
    match self.doc.save(&self.path) {
      Ok(()) => {
        self.dirty = false;
        self.notice = None;
      },
      Err(err) => self.notice = Some(format!("Couldn't save the shot list: {err}")),
    }
  }
}

fn shot_row(ui: &mut Ui, shot: &Shot, selected: bool) -> egui::Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), 56.0), Sense::click());
  let hovered = resp.hovered();
  let fill = if selected {
    theme::WASH_SELECTED
  } else if hovered {
    theme::WASH_HOVER
  } else {
    Color32::TRANSPARENT
  };
  ui.painter().rect_filled(rect, theme::RADIUS, fill);
  if selected {
    ui.painter().rect_filled(Rect::from_min_size(pos2(rect.left(), rect.top() + 10.0), vec2(2.0, 36.0)), 0.0, Color32::WHITE);
  }
  let title = if shot.title.trim().is_empty() { "Untitled shot" } else { shot.title.trim() };
  ui.painter().text(pos2(rect.left() + 14.0, rect.center().y - 8.0), Align2::LEFT_CENTER, title, FontId::new(14.0, theme::medium()), theme::INK);
  let sub = format!("{} · {}", shot.status.label(), format_duration(shot.duration_secs));
  ui.painter().text(pos2(rect.left() + 14.0, rect.center().y + 10.0), Align2::LEFT_CENTER, sub, FontId::new(12.0, egui::FontFamily::Proportional), theme::MUTED);
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, title));
  resp.on_hover_cursor(egui::CursorIcon::PointingHand)
}

fn chip(ui: &mut Ui, label: &str, on: bool) -> egui::Response {
  let galley = ui.painter().layout_no_wrap(label.to_owned(), FontId::new(12.5, theme::medium()), theme::INK);
  let (rect, resp) = ui.allocate_exact_size(vec2(galley.size().x + 18.0, 28.0), Sense::click());
  let fill = if on {
    theme::WASH_SELECTED
  } else if resp.hovered() {
    theme::WASH_HOVER
  } else {
    theme::WASH
  };
  ui.painter().rect(rect, theme::RADIUS, fill, theme::hairline(), egui::StrokeKind::Inside);
  ui.painter().galley(rect.center() - galley.size() / 2.0, galley, theme::INK);
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, label));
  resp.on_hover_cursor(egui::CursorIcon::PointingHand)
}

pub fn format_duration(secs: u32) -> String {
  format!("{}:{:02}", secs / 60, secs % 60)
}

fn one_line(text: &str) -> String {
  text.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn pad_table(rows: &[[String; 6]]) -> String {
  let mut widths = [0usize; 6];
  for row in rows {
    for (i, cell) in row.iter().enumerate() {
      widths[i] = widths[i].max(cell.len());
    }
  }
  let mut out = String::from("# Shot List\n\n");
  for (r, row) in rows.iter().enumerate() {
    out.push('|');
    for (i, cell) in row.iter().enumerate() {
      out.push(' ');
      out.push_str(cell);
      out.push_str(&" ".repeat(widths[i] - cell.len()));
      out.push_str(" |");
    }
    out.push('\n');
    if r == 0 {
      out.push('|');
      for width in widths {
        out.push(' ');
        out.push_str(&"-".repeat(width));
        out.push_str(" |");
      }
      out.push('\n');
    }
  }
  out
}

#[cfg(test)]
mod tests {
  use super::*;
  use egui_kittest::Harness;
  use egui_kittest::kittest::Queryable;

  #[test]
  fn add_remove_and_reorder() {
    let mut doc = ShotListDoc::default();
    let a = doc.add("Hallway");
    let b = doc.add("Close-up");
    let c = doc.add("Exterior");
    assert_eq!(doc.shots.len(), 3);
    assert!(doc.move_by(&c, -1));
    let titles: Vec<_> = doc.shots.iter().map(|s| s.title.as_str()).collect();
    assert_eq!(titles, ["Hallway", "Exterior", "Close-up"]);
    assert!(!doc.move_by(&a, -1), "already first");
    assert!(doc.remove(&b));
    assert_eq!(doc.shots.len(), 2);
    assert!(!doc.remove("missing"));
  }

  #[test]
  fn filter_matches_title_notes_and_status() {
    let mut doc = ShotListDoc::default();
    doc.add("Hallway tracking");
    doc.shots[0].camera = "35mm".into();
    doc.shots[0].status = ShotStatus::Ready;
    doc.add("Close-up eyes");
    doc.shots[1].description = "wet pavement reflection".into();
    assert_eq!(doc.filtered("35mm", None).len(), 1);
    assert_eq!(doc.filtered("pavement", None).len(), 1);
    assert_eq!(doc.filtered("", Some(ShotStatus::Ready)).len(), 1);
    assert_eq!(doc.filtered("hallway", Some(ShotStatus::Idea)).len(), 0);
  }

  #[test]
  fn markdown_pads_columns() {
    let mut doc = ShotListDoc::default();
    doc.add("Hall");
    doc.shots[0].duration_secs = 8;
    doc.shots[0].camera = "wide".into();
    doc.shots[0].description = "she enters\nthe hall".into();
    let md = doc.to_markdown();
    assert!(md.starts_with("# Shot List\n\n"));
    assert!(md.contains("| Title"));
    assert!(md.contains("Hall"));
    assert!(md.contains("0:08"));
    assert!(md.contains("she enters the hall"));
    for line in md.lines().filter(|l| l.starts_with('|')) {
      assert_eq!(line.matches('|').count(), 7, "{line}");
    }
  }

  #[test]
  fn round_trips_through_json() {
    let dir = std::env::temp_dir().join(format!("artcraft-shot-list-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let path = dir.join("shot_list.json");
    let mut doc = ShotListDoc::default();
    doc.add("A");
    doc.shots[0].status = ShotStatus::Shooting;
    doc.save(&path).unwrap();
    let loaded = ShotListDoc::load(&path).unwrap();
    assert_eq!(loaded.shots[0].title, "A");
    assert_eq!(loaded.shots[0].status, ShotStatus::Shooting);
  }

  #[test]
  fn seeded_page_lists_titles() {
    let dir = std::env::temp_dir().join(format!("artcraft-shot-ui-seed-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let mut doc = ShotListDoc::default();
    doc.add("Hallway tracking");
    doc.add("Close-up, eyes");
    doc.save(&dir.join(STORE_NAME)).unwrap();
    let harness = build(ShotListPage::new(&dir));
    assert!(harness.query_by_label("Hallway tracking").is_some());
    assert!(harness.query_by_label("Close-up, eyes").is_some());
    assert!(harness.query_by_label("Title").is_some());
  }

  #[test]
  fn empty_page_offers_new_shot() {
    let dir = std::env::temp_dir().join(format!("artcraft-shot-ui-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let mut harness = build(ShotListPage::new(&dir));
    harness.get_by_label("New Shot").click();
    harness.run();
    assert_eq!(harness.state().page.doc.shots.len(), 1);
    assert_eq!(harness.state().page.doc.shots[0].title, "Shot 1");
    assert!(harness.query_by_label("Shot 1").is_some());
  }

  #[test]
  fn status_labels_and_clock() {
    assert_eq!(ShotStatus::ALL.map(ShotStatus::label), ["Idea", "Ready", "Shooting", "Done"]);
    assert_eq!(format_duration(125), "2:05");
    assert_eq!(format_duration(8), "0:08");
  }

  fn build(page: ShotListPage) -> Harness<'static, State> {
    let mut harness = Harness::builder().with_size(egui::vec2(1200.0, 800.0)).build_ui_state(
      |ui, s: &mut State| {
        if !s.fonts_ready {
          crate::theme::apply(ui.ctx());
          s.fonts_ready = true;
          return;
        }
        s.page.ui(ui);
      },
      State { page, fonts_ready: false },
    );
    harness.run();
    harness.run();
    harness
  }

  struct State {
    page: ShotListPage,
    fonts_ready: bool,
  }
}
