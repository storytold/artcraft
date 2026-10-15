//! The embedded model selector (`ClassyModelSelector variant="embedded"`): a pill with the
//! maker's logo and the model's name, opening "Select Model". Long lists group by family, each
//! family opening a flyout of its variants on hover. Models that run on more than one provider
//! show the provider's logo, and hovering them opens "Select Provider".

use std::collections::HashMap;

use egui::{Align2, Id, Order, Popup, Rect, Stroke, Ui, pos2, vec2};

use crate::backend::providers::Provider;
use crate::models::{self, ModelInfo};
use crate::prompt_box::pickers;
use crate::theme;
use crate::ui::widgets::{self, Leading, RowLead};
use crate::ui::{creator_icons, icons};

const PANEL_WIDTH: f32 = 280.0;
const FLYOUT_WIDTH: f32 = 300.0;
const PROVIDER_FLYOUT_WIDTH: f32 = 220.0;
/// Hovering a model this long opens its providers (`providerTooltipDelayMs`).
const PROVIDER_DELAY_SECS: f64 = 0.3;

/// What was picked: a model, and the provider when one was chosen with it.
pub type Pick = (String, Option<Provider>);

/// Draws the selector; returns a newly picked model (and provider). `providers` is the page's
/// provider choice per model (`None` where providers can't be chosen).
pub fn model_selector(ui: &mut Ui, id: Id, models: &[ModelInfo], selected: Option<&ModelInfo>, show_badges: bool, providers: Option<&HashMap<String, Provider>>) -> Option<Pick> {
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
  let rows = Rows { id, selected, show_badges, providers };
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
            let (row_hovered, pick) = rows.row(ui, first);
            if row_hovered {
              hovered = None;
            }
            if pick.is_some() {
              picked = pick;
            }
            continue;
          }
          let row = widgets::menu_row(ui, RowLead::Logo(&tex), &family.name, subtitle, false, true, is_open);
          if row.hovered() || row.clicked() {
            hovered = Some(family.name.clone());
          }
          if hovered.as_deref() == Some(family.name.as_str()) {
            if let Some(pick) = rows.family_flyout(ui, row.rect, &family.name, &family.models) {
              picked = Some(pick);
            }
          }
        }
        ui.data_mut(|d| d.insert_temp(hovered_family_id, hovered));
      },
      None => {
        for m in models {
          if let (_, Some(pick)) = rows.row(ui, m) {
            picked = Some(pick);
          }
        }
      },
    });
  });
  if picked.is_some() {
    Popup::close_id(ui.ctx(), popup_id);
    ui.data_mut(|d| {
      d.remove::<Option<String>>(hovered_family_id);
      d.remove::<Option<(String, f64)>>(id.with("provider-hover"));
    });
  }
  picked.filter(|(model, provider)| provider.is_some() || selected.is_none_or(|s| &s.id != model))
}

/// What every row needs to know.
struct Rows<'a> {
  id: Id,
  selected: Option<&'a ModelInfo>,
  show_badges: bool,
  providers: Option<&'a HashMap<String, Provider>>,
}

impl Rows<'_> {
  /// A family's variants, to the right of its row.
  fn family_flyout(&self, ui: &Ui, row: Rect, family: &str, list: &[&ModelInfo]) -> Option<Pick> {
    let mut picked = None;
    egui::Area::new(self.id.with(("flyout", family))).order(Order::Tooltip).pivot(Align2::LEFT_TOP).fixed_pos(pos2(row.right() + 10.0, row.top() - 32.0)).show(ui.ctx(), |ui| {
      widgets::popover_frame().show(ui, |ui| {
        ui.set_width(FLYOUT_WIDTH);
        widgets::menu_header(ui, family);
        for m in list {
          if let (_, Some(pick)) = self.row(ui, m) {
            picked = Some(pick);
          }
        }
      });
    });
    picked
  }

  /// One model: logo tile, name, description (and capability badges for video), and the
  /// provider chip and flyout for models with a choice. Returns whether the row is hovered, and
  /// a pick.
  fn row(&self, ui: &mut Ui, m: &ModelInfo) -> (bool, Option<Pick>) {
    let tex = creator_icons::texture(ui.ctx(), &m.creator);
    let is_selected = self.selected.is_some_and(|s| s.id == m.id);
    let badges = if self.show_badges { capability_badges(m) } else { String::new() };
    let subtitle = match (m.description.is_empty(), badges.is_empty()) {
      (true, true) => None,
      (false, true) => Some(m.description.clone()),
      (true, false) => Some(badges),
      (false, false) => Some(format!("{} \u{b7} {badges}", m.description)),
    };
    let allowed = Provider::for_model(&m.id);
    let Some(picks) = self.providers.filter(|_| allowed.len() > 1) else {
      let row = widgets::menu_row(ui, RowLead::Logo(&tex), &m.name, subtitle.as_deref(), is_selected, false, false);
      if row.hovered() {
        ui.data_mut(|d| d.remove::<Option<(String, f64)>>(self.id.with("provider-hover")));
      }
      return (row.hovered(), row.clicked().then(|| (m.id.clone(), None)));
    };
    let current = Provider::resolve(&m.id, picks.get(&m.id).copied());
    let hover_id = self.id.with("provider-hover");
    let now = ui.input(|i| i.time);
    let hovered: Option<(String, f64)> = ui.data(|d| d.get_temp(hover_id)).flatten();
    let open = hovered.as_ref().is_some_and(|(id, since)| *id == m.id && now - since >= PROVIDER_DELAY_SECS);
    let row = widgets::menu_row(ui, RowLead::Logo(&tex), &m.name, subtitle.as_deref(), false, false, open);
    provider_chip(ui, row.rect, current, is_selected);
    if row.hovered() && hovered.as_ref().is_none_or(|(id, _)| *id != m.id) {
      ui.data_mut(|d| d.insert_temp(hover_id, Some((m.id.clone(), now))));
    }
    if row.hovered() && !open {
      ui.ctx().request_repaint_after(std::time::Duration::from_secs_f64(PROVIDER_DELAY_SECS));
    }
    let mut picked = row.clicked().then(|| (m.id.clone(), None));
    if open {
      if let Some(provider) = provider_flyout(ui, self.id.with(("providers", &m.id)), row.rect, allowed, current) {
        picked = Some((m.id.clone(), Some(provider)));
      }
    }
    (row.hovered(), picked)
  }
}

/// The provider's logo on a chip at the row's right; on the brand blue for the selected model.
fn provider_chip(ui: &Ui, row: Rect, provider: Provider, selected: bool) {
  let chip = Rect::from_center_size(pos2(row.right() - 22.0, row.center().y), vec2(26.0, 20.0));
  let fill = if selected { theme::fade(theme::ACCENT, 0.6) } else { theme::WASH };
  ui.painter().rect_filled(chip, theme::RADIUS, fill);
  let tex = creator_icons::texture(ui.ctx(), provider.icon());
  egui::Image::new(&tex).tint(theme::INK).paint_at(ui, Rect::from_center_size(chip.center(), vec2(12.0, 12.0)));
}

/// "Select Provider" (`ProviderTooltipContent`), to the right of a model's row.
fn provider_flyout(ui: &Ui, id: Id, row: Rect, allowed: &[Provider], current: Provider) -> Option<Provider> {
  let mut picked = None;
  egui::Area::new(id).order(Order::Tooltip).pivot(Align2::LEFT_TOP).fixed_pos(pos2(row.right() + 10.0, row.top() - 32.0)).show(ui.ctx(), |ui| {
    widgets::popover_frame().show(ui, |ui| {
      ui.set_width(PROVIDER_FLYOUT_WIDTH);
      widgets::menu_header(ui, "Select Provider");
      for &provider in allowed {
        let tex = creator_icons::texture(ui.ctx(), provider.icon());
        let selected = provider == current;
        let resp = widgets::menu_row(ui, RowLead::SmallLogo(&tex), provider.label(), None, selected, false, false);
        if selected {
          ui.painter().vline(resp.rect.left() + 1.5, resp.rect.y_range(), Stroke::new(3.0, theme::ACCENT));
        }
        if resp.clicked() {
          picked = Some(provider);
        }
      }
    });
  });
  picked
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

/// The provider submenu headlessly (egui_kittest).
#[cfg(test)]
mod tests {
  use egui_kittest::Harness;
  use egui_kittest::kittest::Queryable;

  use super::*;

  struct State {
    models: Vec<ModelInfo>,
    picks: HashMap<String, Provider>,
    picked: Vec<Pick>,
    fonts_ready: bool,
  }

  #[test]
  fn hovering_a_model_offers_its_providers() {
    let mut harness = build();
    harness.get_by_label("Seedream 4").click();
    harness.run();
    let row = harness.get_all_by_label("Nano Banana Pro").last().expect("the model's row");
    row.hover();
    for _ in 0..4 {
      harness.step();
    }
    harness.run();
    assert!(harness.query_by_label("ArtCraft").is_some(), "the submenu lists the providers");
    harness.get_by_label("FAL").click();
    harness.run();
    assert_eq!(harness.state().picked, vec![("nano_banana_pro".to_owned(), Some(Provider::Fal))]);
  }

  #[test]
  fn models_without_a_choice_have_no_submenu() {
    let mut harness = build();
    harness.get_by_label("Seedream 4").click();
    harness.run();
    harness.get_all_by_label("Seedream 4").last().expect("row").hover();
    for _ in 0..4 {
      harness.step();
    }
    harness.run();
    assert!(harness.query_by_label("FAL").is_none(), "no provider list");
  }

  fn build() -> Harness<'static, State> {
    let models = ["seedream_4", "nano_banana_pro"].iter().map(|id| ModelInfo { id: (*id).into(), name: models::display_name(id), creator: models::creator_for(id).into(), ..Default::default() }).collect();
    let state = State { models, picks: HashMap::new(), picked: Vec::new(), fonts_ready: false };
    let mut harness = Harness::builder().with_size(egui::vec2(1000.0, 700.0)).build_ui_state(
      |ui, s: &mut State| {
        if !s.fonts_ready {
          theme::apply(ui.ctx());
          s.fonts_ready = true;
          return;
        }
        ui.add_space(500.0);
        if let Some(pick) = model_selector(ui, Id::new("test-model"), &s.models, s.models.first(), false, Some(&s.picks)) {
          s.picked.push(pick);
        }
      },
      state,
    );
    harness.run();
    harness
  }
}
