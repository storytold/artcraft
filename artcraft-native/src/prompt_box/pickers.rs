//! Toolbar pickers: a pill (or quiet icon button) that opens a popover above it with a titled
//! option list, the duration slider, and on/off toggles.

use egui::{Popup, PopupCloseBehavior};
use egui::{Id, RectAlign, Response, Ui};

use crate::theme;
use crate::ui::icons::Icon;
use crate::ui::widgets::{self, Leading, RowLead};

/// What an option shows at its left.
#[derive(Clone, Debug, PartialEq)]
pub enum OptionLead {
  None,
  Icon(Icon),
  Aspect(Option<(f32, f32)>),
}

#[derive(Clone, Debug)]
pub struct PickOption<T> {
  pub value: T,
  pub label: String,
  pub subtitle: Option<String>,
  pub lead: OptionLead,
}

impl<T> PickOption<T> {
  pub fn new(value: T, label: impl Into<String>) -> Self {
    Self { value, label: label.into(), subtitle: None, lead: OptionLead::None }
  }

  pub fn lead(mut self, lead: OptionLead) -> Self {
    self.lead = lead;
    self
  }

  pub fn subtitle(mut self, subtitle: impl Into<String>) -> Self {
    self.subtitle = Some(subtitle.into());
    self
  }
}

/// How a picker's trigger looks.
pub enum Trigger<'a> {
  /// A toolbar pill with a lead and the selected label.
  Pill(Leading<'a>),
  /// A quiet 36 px icon button followed by the selected label (the count picker).
  Ghost(Icon),
}

/// A picker whose popover lists `options`; returns the newly chosen value.
pub fn option_picker<T: Clone + PartialEq>(ui: &mut Ui, id: Id, trigger: Trigger<'_>, title: &str, tooltip: &str, current: &T, options: &[PickOption<T>]) -> Option<T> {
  let selected = options.iter().find(|o| o.value == *current);
  let label = selected.map_or("", |o| o.label.as_str());
  // Scoped to the parent, so the same picker in the box and in focus mode stay separate.
  let popup_id = ui.make_persistent_id(id).with("popup");
  let open = Popup::is_id_open(ui.ctx(), popup_id);
  let resp = ui.push_id(id, |ui| match trigger {
    Trigger::Pill(lead) => widgets::pill(ui, lead, label, open),
    Trigger::Ghost(icon) => widgets::ghost(ui, icon, Some(label), tooltip, open),
  });
  let resp = resp.inner.on_hover_text(tooltip);
  let mut picked = None;
  popover(&resp, popup_id, |ui| {
    ui.set_min_width(180.0);
    widgets::menu_header(ui, title);
    for option in options {
      let lead = match option.lead {
        OptionLead::None => RowLead::None,
        OptionLead::Icon(icon) => RowLead::Icon(icon),
        OptionLead::Aspect(ratio) => RowLead::Aspect(ratio),
      };
      let is_selected = option.value == *current;
      if widgets::menu_row(ui, lead, &option.label, option.subtitle.as_deref(), is_selected, false, false).clicked() {
        picked = Some(option.value.clone());
      }
    }
  });
  if picked.is_some() {
    Popup::close_id(ui.ctx(), popup_id);
  }
  picked.filter(|v| v != current)
}

/// Opens a popover above `anchor` (toggled by clicking it) and fills it with `content`.
pub fn popover(anchor: &Response, popup_id: Id, content: impl FnOnce(&mut Ui)) {
  Popup::from_toggle_button_response(anchor).id(popup_id).align(RectAlign::TOP_START).align_alternatives(&[RectAlign::BOTTOM_START, RectAlign::TOP_END]).gap(6.0).frame(widgets::popover_frame()).close_behavior(PopupCloseBehavior::CloseOnClickOutside).show(|ui| {
    ui.spacing_mut().item_spacing.y = 2.0;
    content(ui);
  });
}

/// A toolbar pill that opens a popover of custom `content` above it.
pub fn popover_pill(ui: &mut Ui, id: Id, lead: Leading<'_>, label: &str, tooltip: &str, content: impl FnOnce(&mut Ui)) {
  let popup_id = ui.make_persistent_id(id).with("popup");
  let open = Popup::is_id_open(ui.ctx(), popup_id);
  let resp = ui.push_id(id, |ui| widgets::pill(ui, lead, label, open)).inner.on_hover_text(tooltip);
  popover(&resp, popup_id, content);
}

/// The duration popover: a clock pill reading `5s`, opening a 1-second-step slider between the
/// model's minimum and maximum. Returns the new value.
pub fn duration_picker(ui: &mut Ui, id: Id, current: u32, min: u32, max: u32) -> Option<u32> {
  let mut value = current;
  popover_pill(ui, id, Leading::Icon(Icon::Clock), &format!("{current}s"), "Duration", |ui| {
    ui.set_width(240.0);
    widgets::menu_header(ui, "Duration");
    ui.add_space(4.0);
    ui.horizontal(|ui| {
      ui.add_space(8.0);
      ui.style_mut().spacing.slider_width = 210.0;
      ui.add(egui::Slider::new(&mut value, min..=max).step_by(1.0).suffix("s").show_value(false));
    });
    ui.horizontal(|ui| {
      ui.add_space(8.0);
      ui.label(egui::RichText::new(format!("{min}s")).size(11.0).color(theme::FAINT));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        ui.add_space(8.0);
        ui.label(egui::RichText::new(format!("{max}s")).size(11.0).color(theme::FAINT));
        ui.centered_and_justified(|ui| {
          ui.label(egui::RichText::new(format!("{value}s")).size(13.0).family(theme::semibold()).color(theme::INK));
        });
      });
    });
  });
  (value != current).then_some(value)
}

/// An on/off toolbar toggle (sound): a pill that's highlighted while on.
pub fn toggle(ui: &mut Ui, id: Id, icon: Icon, label: &str, on: bool, tooltip: &str) -> bool {
  let resp = ui.push_id(id, |ui| widgets::pill(ui, Leading::Icon(icon), label, on)).inner.on_hover_text(tooltip);
  resp.clicked()
}
