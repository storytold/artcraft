//! Toolbar pickers both create pages use, each shown only when the model offers a choice.

use egui::{Id, Ui};

use crate::i18n;
use crate::models::{self, ModelInfo};
use crate::prompt_box::pickers::{self, OptionLead, PickOption, Trigger};
use crate::ui::icons::Icon;
use crate::ui::widgets::Leading;

/// The aspect ratio picker (`AspectRatioPicker`). `current` is the effective value.
pub fn aspect_ratio(ui: &mut Ui, id: Id, model: &ModelInfo, current: &str) -> Option<String> {
  if model.aspect_ratios.is_empty() {
    return None;
  }
  let options: Vec<PickOption<String>> = model.aspect_ratios.iter().map(|v| PickOption::new(v.clone(), models::aspect_label(v)).lead(aspect_lead(v))).collect();
  let lead = match models::aspect_proportion(current) {
    Some(ratio) => Leading::Aspect(Some(ratio)),
    None => Leading::Icon(Icon::Wand),
  };
  let title = i18n::t("Aspect Ratio");
  pickers::option_picker(ui, id, Trigger::Pill(lead), title, title, &current.to_owned(), &options)
}

fn aspect_lead(value: &str) -> OptionLead {
  match models::aspect_proportion(value) {
    Some(ratio) => OptionLead::Aspect(Some(ratio)),
    None => OptionLead::Icon(Icon::Wand),
  }
}

/// The resolution picker (`ResolutionPicker`), its pill captioned SD or HD.
pub fn resolution(ui: &mut Ui, id: Id, model: &ModelInfo, current: &str) -> Option<String> {
  if model.resolutions.is_empty() {
    return None;
  }
  let options: Vec<PickOption<String>> = model.resolutions.iter().map(|v| PickOption::new(v.clone(), models::resolution_label(v))).collect();
  let caption = if models::resolution_is_hd(current) { "HD" } else { "SD" };
  let title = i18n::t("Resolution");
  pickers::option_picker(ui, id, Trigger::Pill(Leading::Caption(caption)), title, title, &current.to_owned(), &options)
}

/// The quality picker (`QualityPicker`).
pub fn quality(ui: &mut Ui, id: Id, model: &ModelInfo, current: &str) -> Option<String> {
  if model.qualities.is_empty() {
    return None;
  }
  let options: Vec<PickOption<String>> = model.qualities.iter().map(|v| PickOption::new(v.clone(), models::quality_label(v))).collect();
  let title = i18n::t("Quality");
  pickers::option_picker(ui, id, Trigger::Pill(Leading::Icon(Icon::Gem)), title, title, &current.to_owned(), &options)
}

/// The number of generations (`GenerationCountPicker`): a quiet copy-icon button.
pub fn count(ui: &mut Ui, id: Id, model: &ModelInfo, current: u16, noun: &str) -> Option<u16> {
  let options: Vec<PickOption<u16>> = model.batch_options().into_iter().map(|n| PickOption::new(n, n.to_string())).collect();
  let tip = i18n::t("Number of generations");
  if options.len() <= 1 {
    ui.add_enabled_ui(false, |ui| crate::ui::widgets::ghost(ui, Icon::Copy, Some(&current.to_string()), tip, false));
    return None;
  }
  let header = match noun {
    "images" => i18n::t("No. of images"),
    "videos" => i18n::t("No. of videos"),
    _ => tip,
  };
  pickers::option_picker(ui, id, Trigger::Ghost(Icon::Copy), header, tip, &current, &options)
}
