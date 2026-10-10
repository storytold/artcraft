//! The embedded model selector (`ClassyModelSelector variant="embedded"`): a pill with the
//! maker's logo and the model's name, opening "Select Model". Long lists group by family, each
//! family opening a flyout of its variants on hover.

use egui::{Align2, Id, Order, Popup, Rect, Ui, pos2};

use crate::models::{self, ModelInfo};
use crate::prompt_box::pickers;
use crate::ui::widgets::{self, Leading, RowLead};
use crate::ui::{creator_icons, icons};

const PANEL_WIDTH: f32 = 280.0;
const FLYOUT_WIDTH: f32 = 300.0;

/// Draws the selector; returns the id of a newly picked model.
pub fn model_selector(ui: &mut Ui, id: Id, models: &[ModelInfo], selected: Option<&ModelInfo>, show_badges: bool) -> Option<String> {
  let popup_id = ui.make_persistent_id(id).with("popup");
  let open = Popup::is_id_open(ui.ctx(), popup_id);
  let label = selected.map_or("Select model", |m| m.name.as_str());
  let logo = selected.map(|m| creator_icons::texture(ui.ctx(), &m.creator));
  let resp = ui.push_id(id, |ui| {
    ui.set_max_width(192.0 + 40.0);
    match &logo {
      Some(t) => widgets::pill(ui, Leading::Logo(t), label, open),
      None => widgets::pill(ui, Leading::Icon(icons::Icon::Sparkles), label, open),
    }
  });
  let resp = resp.inner.on_hover_text("Model");
  let mut picked = None;
  let hovered_family_id = id.with("family");
  pickers::popover(&resp, popup_id, |ui| {
    ui.set_width(PANEL_WIDTH);
    widgets::menu_header(ui, "Select Model");
    let max_h = ui.ctx().content_rect().height() * 0.6;
    egui::ScrollArea::vertical().max_height(max_h).auto_shrink([false, true]).show(ui, |ui| match models::grouped(models) {
      Some(families) => {
        let mut hovered: Option<String> = ui.data(|d| d.get_temp(hovered_family_id));
        for family in &families {
          let contains_selected = selected.is_some_and(|s| family.models.iter().any(|m| m.id == s.id));
          let first = family.models[0];
          let tex = creator_icons::texture(ui.ctx(), &first.creator);
          let subtitle = if contains_selected { selected.map(|s| s.name.as_str()) } else { None };
          let is_open = hovered.as_deref() == Some(family.name.as_str());
          if family.models.len() == 1 {
            let row = widgets::menu_row(ui, RowLead::Logo(&tex), &first.name, non_empty(&first.description), contains_selected, false, false);
            if row.hovered() {
              hovered = None;
            }
            if row.clicked() {
              picked = Some(first.id.clone());
            }
            continue;
          }
          let row = widgets::menu_row(ui, RowLead::Logo(&tex), &family.name, subtitle, false, true, is_open);
          if row.hovered() || row.clicked() {
            hovered = Some(family.name.clone());
          }
          if hovered.as_deref() == Some(family.name.as_str()) {
            if let Some(id) = flyout(ui, id, row.rect, &family.name, &family.models, selected, show_badges) {
              picked = Some(id);
            }
          }
        }
        ui.data_mut(|d| d.insert_temp(hovered_family_id, hovered));
      },
      None => {
        for m in models {
          if model_row(ui, m, selected, show_badges) {
            picked = Some(m.id.clone());
          }
        }
      },
    });
  });
  if picked.is_some() {
    Popup::close_id(ui.ctx(), popup_id);
    ui.data_mut(|d| d.remove::<Option<String>>(hovered_family_id));
  }
  picked.filter(|p| selected.is_none_or(|s| &s.id != p))
}

/// A family's variants, to the right of its row.
fn flyout(ui: &Ui, id: Id, row: Rect, family: &str, list: &[&ModelInfo], selected: Option<&ModelInfo>, show_badges: bool) -> Option<String> {
  let mut picked = None;
  egui::Area::new(id.with(("flyout", family))).order(Order::Tooltip).pivot(Align2::LEFT_TOP).fixed_pos(pos2(row.right() + 10.0, row.top() - 32.0)).show(ui.ctx(), |ui| {
    widgets::popover_frame().show(ui, |ui| {
      ui.set_width(FLYOUT_WIDTH);
      widgets::menu_header(ui, family);
      for m in list {
        if model_row(ui, m, selected, show_badges) {
          picked = Some(m.id.clone());
        }
      }
    });
  });
  picked
}

/// One model: logo tile, name, description (and capability badges for video).
fn model_row(ui: &mut Ui, m: &ModelInfo, selected: Option<&ModelInfo>, show_badges: bool) -> bool {
  let tex = creator_icons::texture(ui.ctx(), &m.creator);
  let is_selected = selected.is_some_and(|s| s.id == m.id);
  let badges = if show_badges { capability_badges(m) } else { String::new() };
  let subtitle = match (m.description.is_empty(), badges.is_empty()) {
    (true, true) => None,
    (false, true) => Some(m.description.clone()),
    (true, false) => Some(badges),
    (false, false) => Some(format!("{} \u{b7} {badges}", m.description)),
  };
  widgets::menu_row(ui, RowLead::Logo(&tex), &m.name, subtitle.as_deref(), is_selected, false, false).clicked()
}

/// The video picker's capability badges ("Audio Support", "Start/End", "Reference").
fn capability_badges(m: &ModelInfo) -> String {
  let mut badges = Vec::new();
  if m.sound_toggle {
    badges.push("Audio Support");
  }
  if m.start_frame && m.end_frame {
    badges.push("Start/End");
  }
  if m.supports_reference_mode() {
    badges.push("Reference");
  }
  badges.join(" \u{b7} ")
}

fn non_empty(s: &str) -> Option<&str> {
  (!s.is_empty()).then_some(s)
}
