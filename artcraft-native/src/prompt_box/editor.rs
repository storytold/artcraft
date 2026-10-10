//! The prompt text field: auto-grows to ~4 lines then scrolls, expands or resizes on demand,
//! highlights `@Image1`-style mentions and offers them in an autocomplete dropdown, and shows a
//! length counter when the model has a limit.

use egui::text::{CCursor, CCursorRange, LayoutJob};
use egui::{Align2, Color32, FontFamily, FontId, Id, Key, KeyboardShortcut, Modifiers, Order, Rect, Sense, Stroke, TextBuffer, TextFormat, Ui, pos2, vec2};

use crate::theme;
use crate::ui::icons::{self, Icon};

/// `text-md`.
const FONT_SIZE: f32 = 16.0;
/// `min-h-[2.5em]`.
const MIN_HEIGHT: f32 = FONT_SIZE * 2.5;
/// `max-h-[5.5em]` while collapsed.
const COLLAPSED_MAX_HEIGHT: f32 = FONT_SIZE * 5.5;
/// `max-h-[500px]`.
const MAX_HEIGHT: f32 = 500.0;
/// `pr-8`: room for the fullscreen button.
const RIGHT_GUTTER: f32 = 32.0;

const IMAGE_COLORS: [Color32; 5] = [Color32::from_rgb(96, 165, 250), Color32::from_rgb(251, 146, 60), Color32::from_rgb(167, 139, 250), Color32::from_rgb(52, 211, 153), Color32::from_rgb(251, 113, 133)];
const VIDEO_COLORS: [Color32; 3] = [Color32::from_rgb(250, 204, 21), Color32::from_rgb(245, 158, 11), Color32::from_rgb(74, 222, 128)];
const AUDIO_COLORS: [Color32; 2] = [Color32::from_rgb(192, 132, 252), Color32::from_rgb(232, 121, 249)];
/// Teal, emerald, sky.
const CHARACTER_COLORS: [Color32; 3] = [Color32::from_rgb(45, 212, 191), Color32::from_rgb(34, 197, 94), Color32::from_rgb(14, 165, 233)];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MentionKind {
  Image,
  Video,
  Audio,
  Character,
}

/// Something the prompt can reference by name, e.g. `@Image2`.
#[derive(Clone, Debug)]
pub struct MentionItem {
  pub label: String,
  pub kind: MentionKind,
  /// The 1-based index within its kind (picks the colour).
  pub index: usize,
  /// Media cache key of a thumbnail, if there is one.
  pub preview: Option<String>,
  /// The character this mention names (several can share a name).
  pub token: Option<String>,
}

impl MentionItem {
  pub fn color(&self) -> Color32 {
    let i = self.index.saturating_sub(1);
    match self.kind {
      MentionKind::Image => IMAGE_COLORS[i % IMAGE_COLORS.len()],
      MentionKind::Video => VIDEO_COLORS[i % VIDEO_COLORS.len()],
      MentionKind::Audio => AUDIO_COLORS[i % AUDIO_COLORS.len()],
      MentionKind::Character => CHARACTER_COLORS[i % CHARACTER_COLORS.len()],
    }
  }
}

/// Per-editor UI state that outlives a frame.
#[derive(Default)]
pub struct EditorState {
  /// The chevron's "expanded" mode: a tall, fixed-height field.
  pub expanded: bool,
  /// A height the user dragged the resize grip to.
  pub manual_height: Option<f32>,
  mention: Option<MentionQuery>,
  /// Focus the field on the next frame (autofocus, after inserting a mention, after closing
  /// fullscreen).
  pub focus_requested: bool,
}

struct MentionQuery {
  /// Char index of the `@`.
  anchor: usize,
  /// What's typed after the `@` (without it).
  filter: String,
  selected: usize,
}

pub struct EditorOptions<'a> {
  pub id: Id,
  pub placeholder: &'a str,
  pub enter_to_generate: bool,
  pub mentions: &'a [MentionItem],
  /// `Some` shows an `n / max` counter; `Some(None)` shows `n / ∞`.
  pub max_length: Option<Option<usize>>,
  /// Fill a fixed height (fullscreen mode) instead of auto-growing.
  pub fixed_height: Option<f32>,
  /// Draw the fullscreen button in the top right.
  pub fullscreen_button: bool,
  /// Draw the resize grip in the bottom right.
  pub resizable: bool,
}

#[derive(Default)]
pub struct EditorOutput {
  pub submit: bool,
  pub open_fullscreen: bool,
  pub focused: bool,
  /// A mention the user picked from the dropdown: (label, character token).
  pub picked: Option<(String, Option<String>)>,
}

/// Draws the editor in the available width.
pub fn show(ui: &mut Ui, prompt: &mut String, state: &mut EditorState, opts: &EditorOptions<'_>, thumbnails: &mut dyn FnMut(&Ui, &str) -> Option<egui::TextureHandle>) -> EditorOutput {
  let mut out = EditorOutput::default();
  let id = opts.id;
  let had_focus = ui.memory(|m| m.has_focus(id));
  let filtered = filtered_mentions(state, opts.mentions);

  // Keys the field mustn't see: dropdown navigation, and Enter when it generates.
  if had_focus {
    if !filtered.is_empty() {
      out.picked = handle_dropdown_keys(ui, id, prompt, state, &filtered);
    } else if opts.enter_to_generate && consume_plain_enter(ui) {
      out.submit = true;
    }
  }

  let width = ui.available_width();
  let height = editor_height(ui, state, opts);
  let (outer, _) = ui.allocate_exact_size(vec2(width, height.unwrap_or(MIN_HEIGHT)), Sense::hover());
  let text_width = (width - RIGHT_GUTTER).max(40.0);

  let mentions = opts.mentions;
  let mut layouter = |ui: &Ui, buf: &dyn TextBuffer, wrap_width: f32| {
    let mut job = highlight(buf.as_str(), mentions);
    job.wrap.max_width = wrap_width;
    ui.fonts_mut(|f| f.layout_job(job))
  };

  let return_key = if opts.enter_to_generate { KeyboardShortcut::new(Modifiers::SHIFT, Key::Enter) } else { KeyboardShortcut::new(Modifiers::NONE, Key::Enter) };
  let max_h = height.unwrap_or(COLLAPSED_MAX_HEIGHT);
  let mut child = ui.new_child(egui::UiBuilder::new().max_rect(Rect::from_min_size(outer.min, vec2(width, max_h))));
  let scroll = egui::ScrollArea::vertical().id_salt(id.with("scroll")).max_height(max_h).auto_shrink([false, true]);
  let scroll = if height.is_some() { scroll.min_scrolled_height(max_h) } else { scroll };
  let output = scroll
    .show(&mut child, |ui| {
      let min_h = height.unwrap_or(MIN_HEIGHT);
      egui::TextEdit::multiline(prompt).id(id).frame(egui::Frame::NONE).font(FontId::new(FONT_SIZE, FontFamily::Proportional)).hint_text(egui::RichText::new(opts.placeholder).color(theme::MUTED).size(FONT_SIZE)).desired_width(text_width).desired_rows(1).min_size(vec2(text_width, min_h)).return_key(return_key).layouter(&mut layouter).show(ui)
    })
    .inner;
  let used_h = child.min_rect().height().clamp(MIN_HEIGHT, max_h);
  // Grow the reserved space to what the field actually used (auto-grow).
  if height.is_none() && used_h > outer.height() {
    ui.allocate_exact_size(vec2(width, used_h - outer.height()), Sense::hover());
  }
  let field_rect = Rect::from_min_size(outer.min, vec2(width, if height.is_some() { max_h } else { used_h }));

  if state.focus_requested {
    state.focus_requested = false;
    ui.memory_mut(|m| m.request_focus(id));
    let end = CCursor::new(prompt.chars().count());
    let mut st = output.state.clone();
    st.cursor.set_char_range(Some(CCursorRange::one(end)));
    st.store(ui.ctx(), id);
  }
  out.focused = output.response.response.has_focus();

  if output.response.response.changed() || (out.focused && output.cursor_range.is_some()) {
    update_mention_query(state, prompt, output.cursor_range, opts.mentions);
  }
  if !out.focused && !had_focus {
    state.mention = None;
  }

  if opts.fullscreen_button {
    let button = Rect::from_min_size(pos2(field_rect.right() - 24.0, field_rect.top()), vec2(24.0, 24.0));
    let resp = ui.interact(button, id.with("fullscreen"), Sense::click()).on_hover_text("Focus mode").on_hover_cursor(egui::CursorIcon::PointingHand);
    let p = ui.painter();
    p.rect_filled(button, theme::RADIUS, if resp.hovered() { theme::WASH_HOVER } else { theme::WASH });
    icons::paint(p, button.shrink(6.0), Icon::Maximize, if resp.hovered() { theme::INK } else { theme::DIM });
    out.open_fullscreen = resp.clicked();
  }

  if opts.resizable {
    resize_grip(ui, id, field_rect, state);
  }

  if let Some(limit) = opts.max_length {
    let count = prompt.chars().count();
    let over = limit.is_some_and(|max| count > max);
    let text = match limit {
      Some(max) => format!("{count} / {max}"),
      None => format!("{count} / \u{221e}"),
    };
    let color = if over { Color32::from_rgb(0xef, 0x44, 0x44) } else { theme::FAINT };
    ui.painter().text(pos2(field_rect.right() - 16.0, field_rect.bottom() + 4.0), Align2::RIGHT_BOTTOM, text, FontId::new(10.0, FontFamily::Monospace), color);
  }

  if !filtered.is_empty() && out.focused {
    if let Some(picked) = mention_dropdown(ui, id, field_rect, prompt, state, &filtered, thumbnails) {
      out.picked = Some(picked);
    }
  }
  out
}

/// Whether the prompt exceeds `limit` characters.
pub fn is_over_limit(prompt: &str, limit: Option<usize>) -> bool {
  limit.is_some_and(|max| prompt.chars().count() > max)
}

/// The height the field takes: `None` auto-grows (collapsed), `Some` is fixed.
fn editor_height(ui: &Ui, state: &EditorState, opts: &EditorOptions<'_>) -> Option<f32> {
  if let Some(h) = opts.fixed_height {
    return Some(h);
  }
  if let Some(h) = state.manual_height {
    return Some(h.clamp(MIN_HEIGHT, MAX_HEIGHT));
  }
  // `clamp(120px, calc(100vh - 700px), 500px)`.
  state.expanded.then(|| (ui.ctx().content_rect().height() - 700.0).clamp(120.0, MAX_HEIGHT))
}

/// Consumes a plain (unshifted) Enter press; returns whether there was one.
fn consume_plain_enter(ui: &Ui) -> bool {
  ui.input_mut(|i| {
    let before = i.events.len();
    i.events.retain(|e| !matches!(e, egui::Event::Key { key: Key::Enter, pressed: true, modifiers, .. } if !modifiers.shift && !modifiers.command && !modifiers.alt));
    before != i.events.len()
  })
}

fn handle_dropdown_keys(ui: &Ui, id: Id, prompt: &mut String, state: &mut EditorState, filtered: &[&MentionItem]) -> Option<(String, Option<String>)> {
  let n = filtered.len();
  let (down, up, accept, escape) = ui.input_mut(|i| (i.consume_key(Modifiers::NONE, Key::ArrowDown), i.consume_key(Modifiers::NONE, Key::ArrowUp), i.consume_key(Modifiers::NONE, Key::Enter) || i.consume_key(Modifiers::NONE, Key::Tab), i.consume_key(Modifiers::NONE, Key::Escape)));
  let query = state.mention.as_mut()?;
  if down {
    query.selected = (query.selected + 1) % n;
  }
  if up {
    query.selected = (query.selected + n - 1) % n;
  }
  if escape {
    state.mention = None;
    return None;
  }
  if !accept {
    return None;
  }
  let item = filtered[query.selected.min(n - 1)];
  insert_mention(ui.ctx(), id, prompt, state, &item.label);
  Some((item.label.clone(), item.token.clone()))
}

/// Opens, updates or closes the dropdown from the text before the cursor.
fn update_mention_query(state: &mut EditorState, prompt: &str, cursor: Option<CCursorRange>, mentions: &[MentionItem]) {
  // Keep the highlighted row while the same query stays open (arrow keys move it).
  let previous = state.mention.take();
  if mentions.is_empty() {
    return;
  }
  let Some(cursor) = cursor else {
    return;
  };
  let at = cursor.primary.index.0;
  let before: String = prompt.chars().take(at).collect();
  let Some(anchor_byte) = before.rfind('@') else {
    return;
  };
  let after = &before[anchor_byte + 1..];
  if after.contains(char::is_whitespace) {
    return;
  }
  let anchor = before[..anchor_byte].chars().count();
  let selected = previous.filter(|q| q.anchor == anchor && q.filter == after).map_or(0, |q| q.selected);
  state.mention = Some(MentionQuery { anchor, filter: after.to_owned(), selected });
}

fn filtered_mentions<'a>(state: &EditorState, mentions: &'a [MentionItem]) -> Vec<&'a MentionItem> {
  let Some(query) = &state.mention else {
    return Vec::new();
  };
  let needle = format!("@{}", query.filter).to_lowercase();
  mentions.iter().filter(|m| m.label.to_lowercase().contains(&needle)).collect()
}

/// Replaces `@filter` before the cursor with `label` and a space, and puts the cursor after it.
fn insert_mention(ctx: &egui::Context, id: Id, prompt: &mut String, state: &mut EditorState, label: &str) {
  let Some(query) = state.mention.take() else {
    return;
  };
  let chars: Vec<char> = prompt.chars().collect();
  let end = (query.anchor + 1 + query.filter.chars().count()).min(chars.len());
  let before: String = chars[..query.anchor].iter().collect();
  let after: String = chars[end..].iter().collect();
  *prompt = format!("{before}{label} {after}");
  if let Some(mut st) = egui::TextEdit::load_state(ctx, id) {
    st.cursor.set_char_range(Some(CCursorRange::one(CCursor::new(query.anchor + label.chars().count() + 1))));
    st.store(ctx, id);
  }
}

fn mention_dropdown(ui: &Ui, id: Id, field: Rect, prompt: &mut String, state: &mut EditorState, filtered: &[&MentionItem], thumbnails: &mut dyn FnMut(&Ui, &str) -> Option<egui::TextureHandle>) -> Option<(String, Option<String>)> {
  let selected = state.mention.as_ref().map_or(0, |q| q.selected);
  let row_h = 44.0;
  let h = 28.0 + row_h * filtered.len() as f32;
  let rect = Rect::from_min_size(pos2(field.left(), field.top() - h - 4.0), vec2(256.0, h));
  let mut picked = None;
  let mut hovered = None;
  egui::Area::new(id.with("mentions")).order(Order::Foreground).fixed_pos(rect.min).show(ui.ctx(), |ui| {
    let p = ui.painter();
    p.rect(rect, theme::RADIUS, theme::CONTROLS, theme::hairline(), egui::StrokeKind::Inside);
    p.text(pos2(rect.left() + 12.0, rect.top() + 14.0), Align2::LEFT_CENTER, "MENTIONS", FontId::new(11.0, theme::mono_bold()), theme::fade(theme::INK, 0.5));
    for (i, item) in filtered.iter().enumerate() {
      let row = Rect::from_min_size(pos2(rect.left(), rect.top() + 28.0 + row_h * i as f32), vec2(rect.width(), row_h));
      let resp = ui.interact(row, id.with(("mention", i)), Sense::click());
      resp.widget_info(|| egui::WidgetInfo::selected(egui::WidgetType::Button, true, i == selected, &item.label));
      if resp.hovered() {
        hovered = Some(i);
      }
      let p = ui.painter();
      if i == selected {
        p.rect_filled(row, 0.0, theme::WASH_HOVER);
      }
      let tile = Rect::from_min_size(pos2(row.left() + 12.0, row.center().y - 16.0), vec2(32.0, 32.0));
      p.rect(tile, 0.0, theme::fade(Color32::BLACK, 0.2), theme::hairline(), egui::StrokeKind::Inside);
      match item.preview.as_deref().and_then(|key| thumbnails(ui, key)) {
        Some(tex) => {
          egui::Image::new(&tex).maintain_aspect_ratio(false).paint_at(ui, tile.shrink(1.0));
        },
        None => {
          let icon = match item.kind {
            MentionKind::Image => Icon::Image,
            MentionKind::Video => Icon::Video,
            MentionKind::Audio => Icon::Music,
            MentionKind::Character => Icon::User,
          };
          icons::paint(ui.painter(), tile.shrink(9.0), icon, theme::fade(Color32::WHITE, 0.6));
        },
      }
      ui.painter().text(pos2(tile.right() + 10.0, row.center().y), Align2::LEFT_CENTER, &item.label, FontId::new(14.0, theme::medium()), item.color());
      if resp.clicked() {
        picked = Some((item.label.clone(), item.token.clone()));
      }
    }
  });
  if let (Some(i), Some(q)) = (hovered, state.mention.as_mut()) {
    q.selected = i;
  }
  if let Some((label, _)) = &picked {
    insert_mention(ui.ctx(), id, prompt, state, label);
    ui.memory_mut(|m| m.request_focus(id));
  }
  picked
}

/// The three-line grip that resizes the field (`.promptbox-resize-wrap::after`).
fn resize_grip(ui: &mut Ui, id: Id, field: Rect, state: &mut EditorState) {
  let grip = Rect::from_min_size(pos2(field.right() - 12.0, field.bottom() - 12.0), vec2(12.0, 12.0));
  let resp = ui.interact(grip, id.with("grip"), Sense::drag()).on_hover_cursor(egui::CursorIcon::ResizeVertical);
  if resp.dragged() {
    let current = state.manual_height.unwrap_or(field.height());
    state.manual_height = Some((current + resp.drag_delta().y).clamp(MIN_HEIGHT, MAX_HEIGHT));
    state.expanded = false;
  }
  let ink = theme::fade(Color32::WHITE, if resp.hovered() || resp.dragged() { 0.8 } else { 0.5 });
  let p = ui.painter();
  let c = grip.right_bottom() - vec2(2.0, 2.0);
  for k in [3.0, 6.0, 9.0] {
    p.line_segment([c - vec2(k, 0.0), c - vec2(0.0, k)], Stroke::new(1.0, ink));
  }
}

/// The prompt as a layout job with each known mention coloured and bold.
fn highlight(text: &str, mentions: &[MentionItem]) -> LayoutJob {
  let plain = TextFormat { font_id: FontId::new(FONT_SIZE, FontFamily::Proportional), color: theme::INK, ..Default::default() };
  let mut job = LayoutJob::default();
  if mentions.is_empty() || !text.contains('@') {
    job.append(text, 0.0, plain);
    return job;
  }
  let mut sorted: Vec<&MentionItem> = mentions.iter().collect();
  sorted.sort_by_key(|m| std::cmp::Reverse(m.label.len()));
  let bytes = text.as_bytes();
  let (mut start, mut i) = (0, 0);
  while i < text.len() {
    let hit = (bytes[i] == b'@').then(|| sorted.iter().find(|m| text.get(i..i + m.label.len()).is_some_and(|s| s.eq_ignore_ascii_case(&m.label)))).flatten();
    match hit {
      Some(m) => {
        job.append(&text[start..i], 0.0, plain.clone());
        let end = i + m.label.len();
        job.append(&text[i..end], 0.0, TextFormat { font_id: FontId::new(FONT_SIZE, theme::semibold()), color: m.color(), ..Default::default() });
        start = end;
        i = end;
      },
      None => i += text[i..].chars().next().map_or(1, char::len_utf8),
    }
  }
  job.append(&text[start..], 0.0, plain);
  job
}

/// `@Name` mentions for characters (newest first), coloured by position.
pub fn character_mentions<'a>(characters: impl Iterator<Item = (&'a str, &'a str, Option<String>)>) -> Vec<MentionItem> {
  characters.enumerate().map(|(i, (name, token, avatar))| MentionItem { label: format!("@{name}"), kind: MentionKind::Character, index: i + 1, preview: avatar, token: Some(token.to_owned()) }).collect()
}

/// Mention labels for `n` items of `kind` (`@Image1`, `@Image2`, …).
pub fn mention_items(kind: MentionKind, previews: impl Iterator<Item = Option<String>>) -> Vec<MentionItem> {
  let name = match kind {
    MentionKind::Image => "Image",
    MentionKind::Video => "Video",
    MentionKind::Audio => "Audio",
    MentionKind::Character => "Character",
  };
  previews.enumerate().map(|(i, preview)| MentionItem { label: format!("@{name}{}", i + 1), kind, index: i + 1, preview, token: None }).collect()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn colours_known_mentions_case_insensitively() {
    let mentions = mention_items(MentionKind::Image, [None, None].into_iter());
    let job = highlight("put @image2 next to @Image1, not @Image3", &mentions);
    let coloured: Vec<&str> = job.sections.iter().filter(|s| s.format.color != theme::INK).map(|s| &job.text[s.byte_range.start.0..s.byte_range.end.0]).collect();
    assert_eq!(coloured, ["@image2", "@Image1"]);
    assert_eq!(mentions[1].color(), IMAGE_COLORS[1]);
  }

  #[test]
  fn counts_characters_not_bytes_for_the_limit() {
    assert!(!is_over_limit("\u{65e5}\u{672c}\u{8a9e}", Some(3)));
    assert!(is_over_limit("\u{65e5}\u{672c}\u{8a9e}!", Some(3)));
    assert!(!is_over_limit("anything", None));
  }
}
