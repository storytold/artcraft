//! The prompt box shared by the create pages (`PromptBox` in the webapp): the reference deck or
//! keyframe slots beside the prompt, a toolbar of page-specific pickers, clear-all, the credit
//! cost and the generate button; plus drag & drop, pasted images and the focus-mode modal.

pub mod deck;
pub mod editor;
pub mod model_selector;
pub mod pickers;
pub mod refs;
#[cfg(test)]
mod ui_tests;

use std::path::PathBuf;

use egui::{Align2, Color32, FontId, Id, Rect, Sense, Stroke, Ui, pos2, vec2};

use crate::backend::media_cache::MediaCache;
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;
use deck::{DeckAction, DeckLimits};
use editor::{EditorOptions, EditorState, MentionItem};
use refs::{RefKind, References};

/// The box's widest (`max-w-5xl`).
pub const MAX_WIDTH: f32 = 1024.0;

/// What sits left of the prompt.
pub enum DeckMode {
  None,
  /// The fanned reference deck.
  References(DeckLimits),
  /// First (and maybe last) frame slots.
  Keyframes {
    show_last: bool,
    library: bool,
  },
}

/// The page's settings for one frame of the box.
pub struct PromptBoxProps<'a> {
  pub id: Id,
  pub placeholder: &'a str,
  pub enter_to_generate: bool,
  pub mentions: &'a [MentionItem],
  /// `Some` shows the length counter (`Some(None)` = unlimited).
  pub max_length: Option<Option<usize>>,
  pub deck: DeckMode,
  /// Which kinds a drop or paste may add right now.
  pub accepts: &'a [RefKind],
  /// The cost of generating, when known.
  pub credits: Option<u64>,
  pub generate_enabled: bool,
  pub generating: bool,
  /// Shown on the generate button.
  pub generate_tooltip: &'a str,
  /// A red note left of the generate button ("Starting frame required").
  pub warning: Option<&'a str>,
  /// An info strip above the prompt.
  pub banner: Option<&'a str>,
  /// Something clear-all also clears besides the prompt and references (the audio style).
  pub extra_input: bool,
}

/// Where a page draws into the box.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Slot {
  /// Rows above the prompt (the audio box's references).
  AbovePrompt,
  /// Rows below the prompt (the audio box's style).
  BelowPrompt,
  /// The toolbar's left: the model selector and pickers.
  ToolbarLeft,
  /// The toolbar's right, before clear-all: the count picker.
  ToolbarRight,
}

/// Something the page should do.
#[derive(Debug)]
pub enum PromptBoxAction {
  Generate,
  Deck(DeckAction),
  ClearAll,
  DroppedFiles(Vec<PathBuf>),
  PastedImage(Vec<u8>),
  /// A mention picked from the dropdown: (label, character token).
  MentionPicked(String, Option<String>),
}

/// UI state that outlives a frame.
#[derive(Default)]
pub struct PromptBoxState {
  pub editor: EditorState,
  pub fullscreen: bool,
  confirm_clear: bool,
  focused: bool,
}

/// Draws the box in `ui` (which should be as wide as the box). `slots` draws the page's parts
/// into each [`Slot`]; the toolbar's left may be drawn twice in a frame (box and focus mode), each
/// under its own id.
pub fn show(ui: &mut Ui, prompt: &mut String, refs: &References, state: &mut PromptBoxState, props: &PromptBoxProps<'_>, cache: &mut MediaCache, slots: &mut dyn FnMut(&mut Ui, Slot)) -> Vec<PromptBoxAction> {
  let mut actions = Vec::new();
  let frame = egui::Frame::new().fill(theme::fade(theme::CONTROLS, 0.95)).stroke(Stroke::new(1.0, if state.focused { theme::ACCENT } else { theme::LINE })).corner_radius(theme::RADIUS).inner_margin(16);
  let response = frame.show(ui, |ui| {
    if let Some(banner) = props.banner {
      info_banner(ui, banner);
    }
    ui.horizontal_top(|ui| {
      ui.spacing_mut().item_spacing.x = 12.0;
      deck_widget(ui, props, refs, cache, false, &mut actions);
      ui.vertical(|ui| {
        slots(ui, Slot::AbovePrompt);
        let out = editor_ui(ui, prompt, state, props, cache, None);
        state.focused = out.focused;
        if out.submit {
          actions.push(PromptBoxAction::Generate);
        }
        if let Some((label, token)) = out.picked {
          actions.push(PromptBoxAction::MentionPicked(label, token));
        }
        if out.open_fullscreen {
          state.fullscreen = true;
        }
        slots(ui, Slot::BelowPrompt);
      });
    });
    ui.add_space(14.0);
    ui.horizontal(|ui| {
      ui.spacing_mut().item_spacing.x = 8.0;
      slots(ui, Slot::ToolbarLeft);
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        ui.spacing_mut().item_spacing.x = 6.0;
        generate_cluster(ui, props, &mut actions);
        clear_all_button(ui, prompt, refs, state, props.extra_input, &mut actions);
        slots(ui, Slot::ToolbarRight);
        if let Some(warning) = props.warning {
          warning_label(ui, warning);
        }
      });
    });
  });
  let rect = response.response.rect;
  expand_toggle(ui, props.id, rect, state);
  drop_target(ui, props, rect, &mut actions);
  paste_images(ui, props, &mut actions);
  if state.fullscreen {
    focus_mode(ui.ctx(), prompt, refs, state, props, cache, slots, &mut actions);
  }
  if state.confirm_clear {
    confirm_clear(ui.ctx(), props.id, state, &mut actions);
  }
  actions
}

fn editor_ui(ui: &mut Ui, prompt: &mut String, state: &mut PromptBoxState, props: &PromptBoxProps<'_>, cache: &mut MediaCache, fixed_height: Option<f32>) -> editor::EditorOutput {
  let fullscreen = fixed_height.is_some();
  let opts = EditorOptions { id: if fullscreen { props.id.with("focus-editor") } else { props.id.with("editor") }, placeholder: props.placeholder, enter_to_generate: props.enter_to_generate, mentions: props.mentions, max_length: if fullscreen { None } else { props.max_length }, fixed_height, fullscreen_button: !fullscreen, resizable: !fullscreen };
  let ctx = ui.ctx().clone();
  editor::show(ui, prompt, &mut state.editor, &opts, &mut |_, key| match cache.get(&ctx, key) {
    crate::backend::media_cache::Lookup::Ready(t) => Some(t),
    _ => None,
  })
}

fn deck_widget(ui: &mut Ui, props: &PromptBoxProps<'_>, refs: &References, cache: &mut MediaCache, always_expanded: bool, actions: &mut Vec<PromptBoxAction>) {
  let deck_actions = match &props.deck {
    DeckMode::None => Vec::new(),
    DeckMode::References(limits) => deck::reference_deck(ui, props.id.with(("deck", always_expanded)), refs, limits, cache, always_expanded),
    DeckMode::Keyframes { show_last, library } => deck::keyframe_cards(ui, props.id.with(("keyframes", always_expanded)), refs, *show_last, *library, cache),
  };
  actions.extend(deck_actions.into_iter().map(PromptBoxAction::Deck));
}

/// The coins + cost and the round generate button (`GenerateIconButton`).
fn generate_cluster(ui: &mut Ui, props: &PromptBoxProps<'_>, actions: &mut Vec<PromptBoxAction>) {
  if widgets::generate_button(ui, props.generate_enabled && !props.generating, props.generating, props.generate_tooltip).clicked() {
    actions.push(PromptBoxAction::Generate);
  }
  if let Some(credits) = props.credits {
    let ink = theme::fade(theme::INK, if props.generate_enabled { 0.8 } else { 0.4 });
    let galley = ui.painter().layout_no_wrap(credits.to_string(), FontId::new(13.0, theme::semibold()), ink);
    let (rect, resp) = ui.allocate_exact_size(vec2(galley.size().x + 22.0, 36.0), Sense::hover());
    icons::paint(ui.painter(), Rect::from_center_size(pos2(rect.left() + 7.0, rect.center().y), vec2(14.0, 14.0)), Icon::Coins, ink);
    ui.painter().galley(pos2(rect.left() + 20.0, rect.center().y - galley.size().y / 2.0), galley, ink);
    resp.on_hover_text(format!("{credits} credit{} cost", if credits == 1 { "" } else { "s" }));
  }
}

/// The eraser button and the hairline after it (`PromptClearAllButton`).
fn clear_all_button(ui: &mut Ui, prompt: &mut String, refs: &References, state: &mut PromptBoxState, extra_input: bool, actions: &mut Vec<PromptBoxAction>) {
  let (rule, _) = ui.allocate_exact_size(vec2(1.0, 20.0), Sense::hover());
  ui.painter().rect_filled(rule, 0.0, theme::fade(theme::INK, 0.15));
  let clearable = !prompt.is_empty() || !refs.is_empty() || extra_input;
  let resp = ui.add_enabled_ui(clearable, |ui| widgets::ghost(ui, Icon::Eraser, None, "Clear all", false)).inner;
  if resp.clicked() {
    if refs.is_empty() {
      prompt.clear();
      actions.push(PromptBoxAction::ClearAll);
    } else {
      state.confirm_clear = true;
    }
  }
}

fn confirm_clear(ctx: &egui::Context, id: Id, state: &mut PromptBoxState, actions: &mut Vec<PromptBoxAction>) {
  let mut choice = None;
  let resp = widgets::modal(ctx, id.with("confirm-clear"), 420.0, |ui| {
    ui.label(widgets::heading("Clear all?", 20.0));
    ui.add_space(8.0);
    ui.label(egui::RichText::new("This clears the prompt and also removes the attached references.").color(theme::MUTED));
    ui.add_space(16.0);
    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
      if widgets::button(ui, None, "Clear all", widgets::Kind::Danger, 0.0, theme::CONTROL_H).clicked() {
        choice = Some(true);
      }
      if widgets::button(ui, None, "Cancel", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
        choice = Some(false);
      }
    });
  });
  if resp || choice.is_some() {
    state.confirm_clear = false;
  }
  if choice == Some(true) {
    actions.push(PromptBoxAction::ClearAll);
  }
}

/// The chevron centred on the box's bottom edge that toggles the tall editor.
fn expand_toggle(ui: &mut Ui, id: Id, rect: Rect, state: &mut PromptBoxState) {
  let button = Rect::from_center_size(pos2(rect.center().x, rect.bottom() - 6.0), vec2(38.0, 16.0));
  let resp = ui.interact(button, id.with("expand"), Sense::click()).on_hover_text(if state.editor.expanded { "Collapse" } else { "Expand" }).on_hover_cursor(egui::CursorIcon::PointingHand);
  let ink = theme::fade(Color32::WHITE, if resp.hovered() { 0.9 } else { 0.3 });
  icons::paint(ui.painter(), Rect::from_center_size(button.center(), vec2(12.0, 12.0)), if state.editor.expanded { Icon::ChevronUp } else { Icon::ChevronDown }, ink);
  if resp.clicked() {
    state.editor.expanded = !state.editor.expanded;
    state.editor.manual_height = None;
  }
}

fn warning_label(ui: &mut Ui, text: &str) {
  let pulse = (ui.input(|i| i.time) * 2.0).sin() as f32 * 0.25 + 0.75;
  ui.label(egui::RichText::new(text).size(12.0).color(theme::BAD));
  let (rect, _) = ui.allocate_exact_size(vec2(14.0, 14.0), Sense::hover());
  icons::paint(ui.painter(), rect, Icon::Info, theme::fade(theme::BAD, pulse));
  ui.ctx().request_repaint_after(std::time::Duration::from_millis(50));
}

fn info_banner(ui: &mut Ui, text: &str) {
  egui::Frame::new().fill(theme::fade(theme::ACCENT, 0.12)).stroke(Stroke::new(1.0, theme::fade(theme::ACCENT, 0.35))).corner_radius(theme::RADIUS).inner_margin(egui::Margin::symmetric(10, 6)).show(ui, |ui| {
    ui.horizontal(|ui| {
      icons::icon(ui, Icon::Info, 14.0, theme::ACCENT_INK);
      ui.label(egui::RichText::new(text).size(12.5).color(theme::INK));
    });
  });
  ui.add_space(10.0);
}

/// Files dragged over the window: an overlay on the box, and the drop when released.
fn drop_target(ui: &mut Ui, props: &PromptBoxProps<'_>, rect: Rect, actions: &mut Vec<PromptBoxAction>) {
  let (hovered, dropped) = ui.input(|i| (i.raw.hovered_files.clone(), i.raw.dropped_files.clone()));
  if !dropped.is_empty() {
    let paths: Vec<PathBuf> = dropped.iter().map(|f| f.path().to_path_buf()).filter(|p| !p.as_os_str().is_empty()).collect();
    if !paths.is_empty() {
      actions.push(PromptBoxAction::DroppedFiles(paths));
    }
    return;
  }
  if hovered.is_empty() {
    return;
  }
  let kinds: Vec<Option<RefKind>> = hovered.iter().map(|f| f.path.as_deref().and_then(RefKind::from_path)).collect();
  // Without paths (some platforms) we can't tell yet: assume it fits.
  let accepted = kinds.iter().all(|k| k.is_none() || k.is_some_and(|k| props.accepts.contains(&k))) && !props.accepts.is_empty();
  let keyframes = matches!(props.deck, DeckMode::Keyframes { .. });
  let p = ui.ctx().layer_painter(egui::LayerId::new(egui::Order::Foreground, props.id.with("drop-overlay")));
  p.rect_filled(rect, theme::RADIUS, theme::fade(theme::CONTROLS, 0.85));
  let border = if accepted { theme::fade(Color32::WHITE, 0.6) } else { theme::fade(theme::BAD, 0.8) };
  icons::dashed_rect(&p, rect.shrink(1.0), Stroke::new(2.0, border), 6.0, 4.0);
  let chip = Rect::from_center_size(rect.center() - vec2(0.0, 22.0), vec2(36.0, 36.0));
  p.rect(chip, theme::RADIUS, theme::CONTROLS, theme::hairline(), egui::StrokeKind::Inside);
  icons::paint(&p, chip.shrink(9.0), if accepted { Icon::Image } else { Icon::AlertCircle }, if accepted { theme::INK } else { theme::BAD });
  let names: Vec<&str> = props
    .accepts
    .iter()
    .map(|k| match k {
      RefKind::Image => "Images",
      RefKind::Video => "Videos",
      RefKind::Audio => "Audio",
    })
    .collect();
  let (title, subtitle) = if !accepted {
    ("That file type isn't supported".to_owned(), format!("Accepts {} files", names.join(", ").to_lowercase()))
  } else if keyframes {
    ("Drop to set your frames".to_owned(), "Frames".to_owned())
  } else {
    ("Drop to add references".to_owned(), names.join(", "))
  };
  p.text(rect.center() + vec2(0.0, 10.0), Align2::CENTER_CENTER, title, FontId::new(14.0, theme::semibold()), theme::INK);
  p.text(rect.center() + vec2(0.0, 28.0), Align2::CENTER_CENTER, subtitle, FontId::new(12.0, egui::FontFamily::Proportional), theme::MUTED);
}

/// Ctrl/Cmd+V with an image on the clipboard. egui only forwards text pastes, so this watches for
/// the V key's release and reads the image itself.
fn paste_images(ui: &mut Ui, props: &PromptBoxProps<'_>, actions: &mut Vec<PromptBoxAction>) {
  if props.accepts.is_empty() {
    return;
  }
  let released = ui.input(|i| i.events.iter().any(|e| matches!(e, egui::Event::Key { key: egui::Key::V, pressed: false, modifiers, .. } if modifiers.command)));
  if !released {
    return;
  }
  let Ok(mut clipboard) = arboard::Clipboard::new() else {
    return;
  };
  let Ok(image) = clipboard.get_image() else {
    return;
  };
  let Some(rgba) = image::RgbaImage::from_raw(image.width as u32, image.height as u32, image.bytes.into_owned()) else {
    return;
  };
  let mut png = Vec::new();
  if image::DynamicImage::ImageRgba8(rgba).write_to(&mut std::io::Cursor::new(&mut png), image::ImageFormat::Png).is_ok() {
    actions.push(PromptBoxAction::PastedImage(png));
  }
}

/// Focus mode: a large editor in a modal, with the deck and toolbar at hand.
#[allow(clippy::too_many_arguments)]
fn focus_mode(ctx: &egui::Context, prompt: &mut String, refs: &References, state: &mut PromptBoxState, props: &PromptBoxProps<'_>, cache: &mut MediaCache, slots: &mut dyn FnMut(&mut Ui, Slot), actions: &mut Vec<PromptBoxAction>) {
  let height = ctx.content_rect().height() * 0.7;
  let mut done = false;
  let closed = widgets::modal(ctx, props.id.with("focus-mode"), 896.0, |ui| {
    ui.set_height(height);
    ui.label(widgets::heading("Prompt", 22.0));
    ui.add_space(10.0);
    let editor_h = (height - 160.0 - if refs.is_empty() { 0.0 } else { 80.0 }).max(120.0);
    let out = editor_ui(ui, prompt, state, props, cache, Some(editor_h));
    if out.submit {
      actions.push(PromptBoxAction::Generate);
    }
    if let Some(limit) = props.max_length {
      let count = prompt.chars().count();
      let over = editor::is_over_limit(prompt, limit);
      let text = limit.map_or_else(|| format!("{count} / \u{221e}"), |max| format!("{count} / {max}"));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Min), |ui| {
        ui.label(egui::RichText::new(text).size(11.0).monospace().color(if over { Color32::from_rgb(0xef, 0x44, 0x44) } else { theme::FAINT }));
      });
    }
    ui.push_id("focus-deck", |ui| deck_widget(ui, props, refs, cache, true, actions));
    ui.add_space(12.0);
    ui.horizontal(|ui| {
      ui.push_id("focus-toolbar", |ui| ui.horizontal(|ui| slots(ui, Slot::ToolbarLeft)));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if widgets::button(ui, None, "Done", widgets::Kind::Primary, 0.0, theme::CONTROL_H).clicked() {
          done = true;
        }
        ui.push_id("focus-clear", |ui| clear_all_button(ui, prompt, refs, state, props.extra_input, actions));
      });
    });
  });
  if closed || done {
    state.fullscreen = false;
    state.editor.focus_requested = true;
  }
}
