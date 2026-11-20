//! Interface localization (`en` / `he`), legacy `iw` / BCP 47 normalization, and RTL helpers.
//!
//! `artcraft-native` builds against `egui 0.36`, which renders strings in literal glyph order
//! without UAX #9 BiDi reordering. Logical Hebrew strings from `i18n/he.tsv` are therefore
//! visually ordered for display via [`t`] and [`fmt`], while logical forms remain available via
//! [`tl`], [`logical_of`], and [`fmt_logical`] for AccessKit labels and line-wrapped paragraphs.

use std::collections::HashMap;
#[cfg(not(test))]
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::OnceLock;

const HEBREW_TSV: &str = include_str!("i18n/he.tsv");

/// Preference value that follows the operating system language.
pub const SYSTEM: &str = "system";
/// English catalog id (default).
pub const ENGLISH: &str = "en";
/// Hebrew catalog id (`עברית`, right-to-left).
pub const HEBREW: &str = "he";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum Lang {
  English = 0,
  Hebrew = 1,
}

impl Lang {
  pub const fn code(self) -> &'static str {
    match self {
      Lang::English => ENGLISH,
      Lang::Hebrew => HEBREW,
    }
  }

  pub const fn is_rtl(self) -> bool {
    matches!(self, Lang::Hebrew)
  }

  pub fn from_tag(tag: &str) -> Option<Lang> {
    let normalized = normalize_language_tag(tag);
    match normalized.split('-').next().unwrap_or("") {
      ENGLISH => Some(Lang::English),
      HEBREW => Some(Lang::Hebrew),
      _ => None,
    }
  }
}

/// A selectable language entry for Settings.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LanguageChoice {
  pub pref: &'static str,
  pub label: String,
}

#[cfg(not(test))]
static CURRENT: AtomicU8 = AtomicU8::new(0);

#[cfg(test)]
thread_local! {
  static TEST_CURRENT: std::cell::Cell<u8> = const { std::cell::Cell::new(0) };
}

pub fn set_current(lang: Lang) {
  #[cfg(not(test))]
  CURRENT.store(lang as u8, Ordering::Relaxed);
  #[cfg(test)]
  TEST_CURRENT.with(|cell| cell.set(lang as u8));
}

pub fn current() -> Lang {
  #[cfg(not(test))]
  let val = CURRENT.load(Ordering::Relaxed);
  #[cfg(test)]
  let val = TEST_CURRENT.with(std::cell::Cell::get);
  match val {
    1 => Lang::Hebrew,
    _ => Lang::English,
  }
}

/// Apply a saved or newly chosen language preference (`"system"`, `"en"`, `"he"`, or `"iw"`).
pub fn apply_preference(pref: &str) {
  set_current(resolve_preference(pref));
}

/// Whether Hebrew glyphs can render in this build (always on desktop; on `wasm32` only when
/// `CRAFT_FONTS_DIR` supplied `NotoSansHebrew-Regular.ttf` at compile time).
pub const fn hebrew_font_available() -> bool {
  cfg!(any(not(target_arch = "wasm32"), has_hebrew_craft_font))
}

/// Strip POSIX encoding/modifier suffixes, normalize separators to `-`, lowercase, reject `x-*`
/// private-use tags, and map legacy ISO 639-1 `iw` primary subtags to `he`.
pub fn normalize_language_tag(tag: &str) -> String {
  let base = tag.trim().split(['.', '@']).next().unwrap_or_default().replace('_', "-").to_ascii_lowercase();
  let mut parts = base.split('-').filter(|part| !part.is_empty());
  let Some(primary) = parts.next() else {
    return String::new();
  };
  if primary == "x" {
    return String::new();
  }
  let normalized_primary = if primary == "iw" { HEBREW } else { primary };
  let mut out = String::from(normalized_primary);
  for part in parts {
    out.push('-');
    out.push_str(part);
  }
  out
}

/// Whether `code` names a right-to-left language or ISO 15924 script (normalizing legacy `iw` to
/// `he`, ignoring private-use `x-*` tags, and inspecting the RFC 5646 script subtag after any
/// 3-letter `extlang` subtags).
pub fn is_rtl_code(code: &str) -> bool {
  let cleaned = code.trim().split(['.', '@']).next().unwrap_or_default().replace('_', "-").to_ascii_lowercase();
  let mut parts = cleaned.split('-').filter(|part| !part.is_empty());
  let Some(primary) = parts.next() else {
    return false;
  };
  if primary == "x" {
    return false;
  }
  let after_extlang = parts.find(|part| !(part.len() == 3 && part.bytes().all(|b| b.is_ascii_alphabetic())));
  if let Some(script) = after_extlang.filter(|part| part.len() == 4 && part.bytes().all(|b| b.is_ascii_alphabetic())) {
    return matches!(script, "arab" | "hebr" | "nkoo" | "rohg" | "syrc" | "thaa" | "yezi");
  }
  matches!(primary, "ar" | "ckb" | "dv" | "fa" | "he" | "iw" | "ps" | "sd" | "syr" | "ug" | "ur" | "yi")
}

/// Whether the active interface language uses right-to-left script direction.
pub fn is_rtl() -> bool {
  is_rtl_code(current().code())
}

/// Validate and normalize a saved or requested preference (`"system"`, `"en"`, `"he"`, `"iw"`).
pub fn validate_preference(pref: &str) -> Result<String, String> {
  let trimmed = pref.trim();
  if trimmed.is_empty() || trimmed.eq_ignore_ascii_case(SYSTEM) {
    return Ok(SYSTEM.into());
  }
  let normalized = normalize_language_tag(trimmed);
  match normalized.split('-').next().unwrap_or_default() {
    ENGLISH => Ok(ENGLISH.into()),
    HEBREW => Ok(HEBREW.into()),
    _ => Err(format!("unknown language {pref:?} (expected system, en, or he)")),
  }
}

/// Resolve POSIX locale env vars respecting precedence (`LC_ALL`, then `LC_MESSAGES`, then `LANG`),
/// checking only the highest-priority non-empty variable so an explicit override is never shadowed.
pub fn resolve_posix_env_hebrew(get: impl Fn(&str) -> Option<String>) -> bool {
  for var in ["LC_ALL", "LC_MESSAGES", "LANG"] {
    if let Some(val) = get(var) {
      let trimmed = val.trim();
      if !trimmed.is_empty() {
        return Lang::from_tag(trimmed) == Some(Lang::Hebrew);
      }
    }
  }
  false
}

/// Resolve a stored or requested preference to an active catalog language.
pub fn resolve_preference(pref: &str) -> Lang {
  let trimmed = pref.trim();
  if trimmed.is_empty() || trimmed.eq_ignore_ascii_case(SYSTEM) {
    return resolve_system_language();
  }
  match validate_preference(trimmed).as_deref() {
    Ok(HEBREW) if hebrew_font_available() => Lang::Hebrew,
    _ => Lang::English,
  }
}

fn resolve_system_language() -> Lang {
  if cfg!(test) || !hebrew_font_available() {
    return Lang::English;
  }
  if let Ok(val) = std::env::var("ARTCRAFT_LANG") {
    if Lang::from_tag(&val) == Some(Lang::Hebrew) {
      return Lang::Hebrew;
    }
    if !val.trim().is_empty() {
      return Lang::English;
    }
  }
  if resolve_posix_env_hebrew(|k| std::env::var(k).ok()) {
    return Lang::Hebrew;
  }
  Lang::English
}

/// Selectable language choices for Settings (in visual order for the active locale).
pub fn selectable_languages() -> Vec<LanguageChoice> {
  let mut choices = vec![LanguageChoice { pref: SYSTEM, label: t("System default").to_owned() }, LanguageChoice { pref: ENGLISH, label: "English".into() }];
  if hebrew_font_available() {
    choices.push(LanguageChoice { pref: HEBREW, label: visual_rtl("עברית") });
  }
  choices
}

/// Build the Settings language dropdown choices and selected index for `saved_pref`.
///
/// If `saved_pref` normalizes to Hebrew on a font-less build, appends an unavailable placeholder so
/// opening Settings without changes preserves `"he"` while selecting English switches to `"en"`.
pub fn language_choices_for(saved_pref: &str) -> (Vec<LanguageChoice>, usize) {
  language_choices_with(selectable_languages(), saved_pref)
}

fn language_choices_with(mut choices: Vec<LanguageChoice>, saved_pref: &str) -> (Vec<LanguageChoice>, usize) {
  let current = validate_preference(saved_pref).unwrap_or_else(|_| SYSTEM.into());
  if let Some(idx) = choices.iter().position(|c| c.pref == current) {
    return (choices, idx);
  }
  if current == HEBREW {
    let idx = choices.len();
    choices.push(LanguageChoice { pref: HEBREW, label: "Hebrew (unavailable)".into() });
    return (choices, idx);
  }
  let idx = choices.iter().position(|c| c.pref == SYSTEM).unwrap_or(0);
  (choices, idx)
}

struct HebrewCatalog {
  en_to_visual: HashMap<&'static str, &'static str>,
  en_to_logical: HashMap<&'static str, &'static str>,
  visual_to_logical: HashMap<&'static str, &'static str>,
}

fn hebrew_catalog() -> &'static HebrewCatalog {
  static CATALOG: OnceLock<HebrewCatalog> = OnceLock::new();
  CATALOG.get_or_init(|| {
    let mut en_to_visual = HashMap::new();
    let mut en_to_logical = HashMap::new();
    let mut visual_to_logical = HashMap::new();
    for line in HEBREW_TSV.lines() {
      if line.trim().is_empty() || line.starts_with('#') {
        continue;
      }
      let Some((key, logical)) = line.split_once('\t') else {
        continue;
      };
      if key.is_empty() || logical.trim().is_empty() {
        continue;
      }
      let visual_str = visual_rtl(logical);
      let visual: &'static str = if visual_str == logical { logical } else { Box::leak(visual_str.into_boxed_str()) };
      en_to_visual.insert(key, visual);
      en_to_logical.insert(key, logical);
      visual_to_logical.insert(visual, logical);
    }
    HebrewCatalog { en_to_visual, en_to_logical, visual_to_logical }
  })
}

/// Look up `key` in `lang`, returning visually-reordered RTL text for `egui 0.36` when Hebrew.
pub fn t_for(lang: Lang, key: &str) -> &str {
  match lang {
    Lang::English => key,
    Lang::Hebrew => hebrew_catalog().en_to_visual.get(key).copied().unwrap_or(key),
  }
}

/// Look up `key` in the active language (visually reordered when Hebrew).
pub fn t(key: &str) -> &str {
  t_for(current(), key)
}

/// Look up `key` in `lang` keeping logical text order (for AccessKit labels and line wrapping).
pub fn tl_for(lang: Lang, key: &str) -> &str {
  match lang {
    Lang::English => key,
    Lang::Hebrew => hebrew_catalog().en_to_logical.get(key).copied().unwrap_or(key),
  }
}

/// Look up `key` in the active language keeping logical text order.
pub fn tl(key: &str) -> &str {
  tl_for(current(), key)
}

/// Recover the logical string for an already-looked-up display string when Hebrew is active.
pub fn logical_of(shown: &str) -> &str {
  if is_rtl() {
    hebrew_catalog().visual_to_logical.get(shown).copied().unwrap_or(shown)
  } else {
    shown
  }
}

/// Fill `{name}` placeholders in `key` for `lang`, keeping logical text order.
pub fn fmt_logical_for(lang: Lang, key: &str, args: &[(&str, &str)]) -> String {
  let logical = match lang {
    Lang::English => key,
    Lang::Hebrew => {
      let cat = hebrew_catalog();
      cat.en_to_logical.get(key).or_else(|| cat.visual_to_logical.get(key)).copied().unwrap_or(key)
    },
  };
  fill_placeholders(logical, args)
}

/// Fill `{name}` placeholders in `key` for the active language, keeping logical text order.
pub fn fmt_logical(key: &str, args: &[(&str, &str)]) -> String {
  fmt_logical_for(current(), key, args)
}

/// Fill `{name}` placeholders in `key` for `lang`, then visually reorder once for `egui 0.36`.
pub fn fmt_for(lang: Lang, key: &str, args: &[(&str, &str)]) -> String {
  let out = fmt_logical_for(lang, key, args);
  if lang.is_rtl() {
    visual_rtl(&out)
  } else {
    out
  }
}

/// Fill `{name}` placeholders in `key` for the active language, visually reordered for `egui 0.36`.
pub fn fmt(key: &str, args: &[(&str, &str)]) -> String {
  fmt_for(current(), key, args)
}

fn fill_placeholders(template: &str, args: &[(&str, &str)]) -> String {
  let mut out = String::with_capacity(template.len());
  let mut rest = template;
  while let Some(open) = rest.find('{') {
    out.push_str(rest.get(..open).unwrap_or_default());
    let after_open = rest.get(open + 1..).unwrap_or_default();
    let Some(close) = after_open.find('}') else {
      out.push_str(rest.get(open..).unwrap_or_default());
      return out;
    };
    let key = after_open.get(..close).unwrap_or_default();
    if let Some((_, val)) = args.iter().find(|(k, _)| *k == key) {
      out.push_str(val);
    } else {
      out.push('{');
      out.push_str(key);
      out.push('}');
    }
    rest = after_open.get(close + 1..).unwrap_or_default();
  }
  out.push_str(rest);
  out
}

/// Wrap `logical` at `max_width` using `font_id`, then apply [`visual_rtl`] line-by-line so
/// multi-line RTL paragraphs keep natural top-to-bottom reading order in `egui 0.36`.
pub fn wrapped_visual_lines(ctx: &egui::Context, lang: Lang, logical: &str, font_id: &egui::FontId, max_width: f32) -> String {
  if !lang.is_rtl() || !logical.chars().any(is_rtl_script) {
    return logical.to_owned();
  }
  let mut out = String::with_capacity(logical.len());
  let mut first_row = true;
  for paragraph in logical.split('\n') {
    for row_logical in wrap_paragraph_logical(ctx, paragraph, font_id, max_width) {
      if !first_row {
        out.push('\n');
      }
      first_row = false;
      if row_logical.chars().any(is_rtl_script) {
        push_visual_rtl_line(row_logical, &mut out);
      } else {
        out.push_str(row_logical);
      }
    }
  }
  out
}

/// Render a wrapping label from an English catalog `key` (or pre-formatted logical text),
/// deferring visual RTL reordering until line breaks are measured.
pub fn wrapped_label(ui: &mut egui::Ui, key_or_logical: &str, style: impl FnOnce(egui::RichText) -> egui::RichText) -> egui::Response {
  let lang = current();
  let font_id = egui::TextStyle::Body.resolve(ui.style());
  let logical = if lang.is_rtl() {
    let cat = hebrew_catalog();
    cat.en_to_logical.get(key_or_logical).or_else(|| cat.visual_to_logical.get(key_or_logical)).copied().unwrap_or(key_or_logical)
  } else {
    key_or_logical
  };
  let needs_rtl_wrap = lang.is_rtl() && logical.chars().any(is_rtl_script);
  let shown = if needs_rtl_wrap { wrapped_visual_lines(ui.ctx(), lang, logical, &font_id, ui.available_width()) } else { logical.to_owned() };
  let rich = style(egui::RichText::new(shown).font(font_id));
  let resp = if needs_rtl_wrap { ui.add(egui::Label::new(rich).extend()) } else { ui.add(egui::Label::new(rich).wrap()) };
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Label, true, logical));
  resp
}

/// Render an explicit visual RTL label aligned to the right when Hebrew is active.
pub fn align_for_text(is_rtl: bool) -> egui::Align {
  if is_rtl {
    egui::Align::Max
  } else {
    egui::Align::Min
  }
}

fn wrap_paragraph_logical<'a>(ctx: &egui::Context, paragraph: &'a str, font_id: &egui::FontId, max_width: f32) -> Vec<&'a str> {
  if paragraph.is_empty() || !max_width.is_finite() {
    return vec![paragraph];
  }
  let max_w = max_width.max(1.0);
  let mut spans: Vec<(usize, usize)> = Vec::new();
  let mut in_word = false;
  let mut word_start = 0usize;
  for (idx, ch) in paragraph.char_indices() {
    if ch.is_whitespace() {
      if in_word {
        spans.push((word_start, idx));
        in_word = false;
      }
    } else if !in_word {
      word_start = idx;
      in_word = true;
    }
  }
  if in_word {
    spans.push((word_start, paragraph.len()));
  }
  let Some(&(mut line_start, mut line_end)) = spans.first() else {
    return vec![paragraph];
  };
  let mut rows = Vec::new();
  for &(span_start, span_end) in spans.iter().skip(1) {
    let candidate = &paragraph[line_start..span_end];
    let width = ctx.fonts_mut(|f| f.layout_no_wrap(candidate.to_owned(), font_id.clone(), Default::default()).rect.width());
    if width <= max_w {
      line_end = span_end;
    } else {
      rows.push(&paragraph[line_start..line_end]);
      line_start = span_start;
      line_end = span_end;
    }
  }
  rows.push(&paragraph[line_start..line_end]);
  rows
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum BidiClass {
  L,
  R,
  En,
  N,
}

fn is_rtl_script(c: char) -> bool {
  matches!(u32::from(c), 0x0590..=0x05FF | 0x0600..=0x065F | 0x066E..=0x08FF | 0xFB1D..=0xFDFF | 0xFE70..=0xFEFC | 0x1_0800..=0x1_0FFF | 0x1_E800..=0x1_EFFF)
}

fn is_bidi_digit(c: char) -> bool {
  c.is_ascii_digit() || matches!(u32::from(c), 0x0660..=0x0669 | 0x06F0..=0x06F9)
}

fn is_bidi_control(c: char) -> bool {
  matches!(c, '\u{061C}' | '\u{200E}' | '\u{200F}' | '\u{202A}'..='\u{202E}' | '\u{2066}'..='\u{2069}')
}

fn is_joiner(c: char) -> bool {
  matches!(c, '\u{200C}' | '\u{200D}')
}

fn mirrored(c: char) -> char {
  match c {
    '(' => ')',
    ')' => '(',
    '[' => ']',
    ']' => '[',
    '{' => '}',
    '}' => '{',
    '<' => '>',
    '>' => '<',
    '«' => '»',
    '»' => '«',
    other => other,
  }
}

fn bracket_close(open: char) -> Option<char> {
  match open {
    '(' => Some(')'),
    '[' => Some(']'),
    '{' => Some('}'),
    '<' => Some('>'),
    '«' => Some('»'),
    _ => None,
  }
}

fn is_closing_bracket(c: char) -> bool {
  matches!(c, ')' | ']' | '}' | '>' | '»')
}

const PLACEHOLDER_BASE: u32 = 0xE000;
const MAX_PLACEHOLDERS: usize = 64;

fn mask_placeholders(text: &str) -> (String, Vec<&str>) {
  let reserved = text.chars().any(|c| (PLACEHOLDER_BASE..PLACEHOLDER_BASE.saturating_add(MAX_PLACEHOLDERS as u32)).contains(&u32::from(c)));
  if reserved {
    return (text.to_owned(), Vec::new());
  }
  let mut masked = String::with_capacity(text.len());
  let mut names = Vec::new();
  let mut rest = text;
  while names.len() < MAX_PLACEHOLDERS {
    let Some(start) = rest.find('{') else {
      break;
    };
    let Some(len) = rest.get(start..).and_then(|s| s.find('}')) else {
      break;
    };
    let end = start.saturating_add(len).saturating_add(1);
    let (Some(before), Some(atom), Some(after)) = (rest.get(..start), rest.get(start..end), rest.get(end..)) else {
      break;
    };
    let Some(stand_in) = u32::try_from(names.len()).ok().and_then(|i| char::from_u32(PLACEHOLDER_BASE.saturating_add(i))) else {
      break;
    };
    masked.push_str(before);
    masked.push(stand_in);
    names.push(atom);
    rest = after;
  }
  masked.push_str(rest);
  (masked, names)
}

fn push_unmasked(out: &mut String, c: char, names: &[&str]) {
  let idx = u32::from(c).checked_sub(PLACEHOLDER_BASE).and_then(|i| usize::try_from(i).ok());
  if let Some(name) = idx.and_then(|i| names.get(i)) {
    out.push_str(name);
  } else {
    out.push(c);
  }
}

fn push_visual_rtl_line(line: &str, out: &mut String) {
  let (masked, names) = mask_placeholders(line);
  let chars: Vec<char> = masked.chars().filter(|c| !is_bidi_control(*c)).collect();
  if chars.is_empty() {
    return;
  }
  let len = chars.len();
  let mut cls: Vec<BidiClass> = chars
    .iter()
    .map(|&c| {
      let is_placeholder = (PLACEHOLDER_BASE..PLACEHOLDER_BASE.saturating_add(MAX_PLACEHOLDERS as u32)).contains(&u32::from(c));
      if is_rtl_script(c) {
        BidiClass::R
      } else if is_bidi_digit(c) {
        BidiClass::En
      } else if is_placeholder || c.is_alphabetic() || matches!(c, '\u{2318}' | '\u{21E7}' | '\u{2325}' | '\u{2303}' | '@') {
        BidiClass::L
      } else {
        BidiClass::N
      }
    })
    .collect();

  for i in 1..len.saturating_sub(1) {
    if cls.get(i) == Some(&BidiClass::N) && chars.get(i).is_some_and(|c| matches!(c, '.' | ',' | ':' | '/' | '-' | '+' | '_')) {
      if let (Some(prev), Some(next)) = (cls.get(i - 1).copied(), cls.get(i + 1).copied()) {
        if prev == BidiClass::En && next == BidiClass::En {
          if let Some(slot) = cls.get_mut(i) {
            *slot = BidiClass::En;
          }
        } else if matches!(prev, BidiClass::L | BidiClass::En) && matches!(next, BidiClass::L | BidiClass::En) {
          if let Some(slot) = cls.get_mut(i) {
            *slot = BidiClass::L;
          }
        }
      }
    }
  }

  for i in 0..len {
    let Some(&ch) = chars.get(i) else {
      continue;
    };
    if cls.get(i) != Some(&BidiClass::N) {
      continue;
    }
    let next_en = cls.get(i + 1) == Some(&BidiClass::En);
    let prev_en = i > 0 && cls.get(i - 1) == Some(&BidiClass::En);
    let prev_is_r = i > 0 && cls.get(i - 1) == Some(&BidiClass::R);
    let attach = match ch {
      '%' | '°' | '$' | '€' | '£' | '₪' => prev_en || next_en,
      '+' | '-' => next_en && !prev_is_r,
      _ => false,
    };
    if attach {
      if let Some(slot) = cls.get_mut(i) {
        *slot = BidiClass::En;
      }
    }
  }

  for i in (0..len.saturating_sub(1)).rev() {
    if cls.get(i) == Some(&BidiClass::N) && chars.get(i).is_some_and(|c| matches!(c, '/' | '.' | '~' | '\\')) && matches!(cls.get(i + 1), Some(BidiClass::L | BidiClass::En)) && (i == 0 || cls.get(i - 1) != Some(&BidiClass::R)) {
      if let Some(slot) = cls.get_mut(i) {
        *slot = BidiClass::L;
      }
    }
  }

  let mut stack: Vec<(usize, char)> = Vec::new();
  let mut pairs: Vec<(usize, usize)> = Vec::new();
  for (i, &c) in chars.iter().enumerate() {
    if cls.get(i) != Some(&BidiClass::N) {
      continue;
    }
    if let Some(close) = bracket_close(c) {
      if stack.len() < 63 {
        stack.push((i, close));
      }
    } else if is_closing_bracket(c) {
      if let Some(pos) = stack.iter().rposition(|(_, expected)| *expected == c) {
        let (open_idx, _) = stack.remove(pos);
        pairs.push((open_idx, i));
      }
    }
  }
  pairs.sort_by_key(|(open, _)| *open);
  for (open, close) in pairs {
    let inner = cls.get(open + 1..close).unwrap_or(&[]);
    let has_r = inner.contains(&BidiClass::R);
    let has_l = inner.iter().any(|c| matches!(c, BidiClass::L | BidiClass::En));
    let dir = if has_r {
      BidiClass::R
    } else if has_l {
      let prev_strong = cls.get(..open).unwrap_or(&[]).iter().rev().find(|c| **c != BidiClass::N).copied();
      if matches!(prev_strong, Some(BidiClass::L | BidiClass::En)) {
        BidiClass::L
      } else {
        BidiClass::R
      }
    } else {
      BidiClass::R
    };
    if let Some(s) = cls.get_mut(open) {
      *s = dir;
    }
    if let Some(s) = cls.get_mut(close) {
      *s = dir;
    }
  }

  for c in &mut cls {
    if *c == BidiClass::En {
      *c = BidiClass::L;
    }
  }
  let mut i = 0;
  while i < len {
    if cls.get(i) == Some(&BidiClass::N) {
      let start = i;
      while cls.get(i) == Some(&BidiClass::N) {
        i += 1;
      }
      let left_l = start > 0 && cls.get(start - 1) == Some(&BidiClass::L);
      let right_l = cls.get(i) == Some(&BidiClass::L);
      let resolved = if left_l && right_l { BidiClass::L } else { BidiClass::R };
      if let Some(slice) = cls.get_mut(start..i) {
        slice.fill(resolved);
      }
    } else {
      i += 1;
    }
  }

  let mut runs: Vec<(bool, usize, usize)> = Vec::new();
  let mut r_start = 0;
  while r_start < len {
    let rtl = cls.get(r_start) == Some(&BidiClass::R);
    let mut r_end = r_start + 1;
    while cls.get(r_end).is_some_and(|c| (*c == BidiClass::R) == rtl) {
      r_end += 1;
    }
    runs.push((rtl, r_start, r_end));
    r_start = r_end;
  }

  for (rtl, start, end) in runs.into_iter().rev() {
    let Some(slice) = chars.get(start..end) else {
      continue;
    };
    if rtl {
      let mut stretch: Vec<char> = Vec::new();
      for &c in slice.iter().rev() {
        if is_rtl_script(c) || is_joiner(c) {
          stretch.push(c);
        } else {
          for sc in stretch.drain(..).rev() {
            push_unmasked(out, sc, &names);
          }
          push_unmasked(out, mirrored(c), &names);
        }
      }
      for sc in stretch.drain(..).rev() {
        push_unmasked(out, sc, &names);
      }
    } else {
      for &c in slice {
        push_unmasked(out, c, &names);
      }
    }
  }
}

/// Rearrange `text` into visual right-to-left order for `egui 0.36` while keeping contiguous RTL
/// script stretches in logical order so `epaint` / `harfrust` shape glyphs cleanly.
pub fn visual_rtl(text: &str) -> String {
  if !text.chars().any(is_rtl_script) {
    return text.to_owned();
  }
  let mut out = String::with_capacity(text.len());
  for (idx, raw_line) in text.split('\n').enumerate() {
    if idx > 0 {
      out.push('\n');
    }
    let (line, cr) = raw_line.strip_suffix('\r').map_or((raw_line, false), |l| (l, true));
    push_visual_rtl_line(line, &mut out);
    if cr {
      out.push('\r');
    }
  }
  out
}

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use super::*;

  fn placeholders(s: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = s;
    while let Some(open) = rest.find('{') {
      let after = &rest[open + 1..];
      let Some(close) = after.find('}') else {
        break;
      };
      out.push(after[..close].to_owned());
      rest = &after[close + 1..];
    }
    out.sort();
    out
  }

  fn parsed_hebrew_rows() -> HashMap<String, String> {
    let mut map = HashMap::new();
    for (idx, line) in HEBREW_TSV.lines().enumerate() {
      if line.trim().is_empty() || line.starts_with('#') {
        continue;
      }
      let (k, v) = line.split_once('\t').unwrap_or_else(|| panic!("he.tsv:{}: missing tab", idx + 1));
      assert!(!k.is_empty() && !v.trim().is_empty(), "he.tsv:{}: empty column", idx + 1);
      assert!(!v.contains('\t'), "he.tsv:{}: extra tab", idx + 1);
      assert!(map.insert(k.to_owned(), v.to_owned()).is_none(), "he.tsv:{}: duplicate key {k:?}", idx + 1);
    }
    map
  }

  #[test]
  fn hebrew_catalog_parses_cleanly_with_matching_placeholders() {
    let rows = parsed_hebrew_rows();
    assert!(!rows.is_empty());
    for (k, v) in &rows {
      assert_eq!(placeholders(k), placeholders(v), "placeholder mismatch for key {k:?}");
    }
    assert_eq!(t_for(Lang::English, "Settings"), "Settings");
    assert_eq!(tl_for(Lang::Hebrew, "Settings"), "הגדרות");
    assert_eq!(t_for(Lang::Hebrew, "Settings"), "הגדרות");
  }

  #[test]
  fn legacy_iw_normalization_and_rtl_detection() {
    assert_eq!(normalize_language_tag("iw"), "he");
    assert_eq!(normalize_language_tag("iw-IL"), "he-il");
    assert_eq!(normalize_language_tag("iw_IL.UTF-8"), "he-il");
    assert_eq!(normalize_language_tag("he_IL@euro"), "he-il");
    assert_eq!(normalize_language_tag("x-he"), "");

    for rtl in ["he", "he-IL", "he_IL.UTF-8", "iw", "iw-IL", "en-Hebr", "zh-Arab-CN", "he-u-nu-latn", "ckb", "ku-Arab-IQ"] {
      assert!(is_rtl_code(rtl), "{rtl} should be RTL");
    }
    for ltr in ["", "en", "en-US", "x-he", "x-Arab", "en-x-he", "en-x-hebr", "he-Latn", "ar-Latn", "ku", "ku-Latn-TR", "en-u-ca-hebrew"] {
      assert!(!is_rtl_code(ltr), "{ltr} should be LTR");
    }

    assert_eq!(validate_preference("system"), Ok("system".into()));
    assert_eq!(validate_preference("en-US"), Ok("en".into()));
    assert_eq!(validate_preference("he-IL"), Ok("he".into()));
    assert_eq!(validate_preference("iw_IL.UTF-8"), Ok("he".into()));
    assert!(validate_preference("x-he").is_err());
  }

  #[test]
  fn posix_env_precedence_respects_lc_all_override() {
    let lc_all_override = |name: &str| match name {
      "LC_ALL" => Some("en_US.UTF-8".into()),
      "LANG" => Some("he_IL.UTF-8".into()),
      _ => None,
    };
    assert!(!resolve_posix_env_hebrew(lc_all_override));

    let lc_messages_hebrew = |name: &str| match name {
      "LC_ALL" => Some(String::new()),
      "LC_MESSAGES" => Some("iw_IL.UTF-8".into()),
      "LANG" => Some("en_US.UTF-8".into()),
      _ => None,
    };
    assert!(resolve_posix_env_hebrew(lc_messages_hebrew));

    let lang_fallback = |name: &str| match name {
      "LANG" => Some("he_IL.UTF-8".into()),
      _ => None,
    };
    assert!(resolve_posix_env_hebrew(lang_fallback));
  }

  #[test]
  fn fmt_recovers_logical_template_and_preserves_placeholders() {
    let formatted_en = fmt_for(Lang::English, "{count} credits", &[("count", "42")]);
    assert_eq!(formatted_en, "42 credits");

    let logical_he = fmt_logical_for(Lang::Hebrew, "{count} credits", &[("count", "42")]);
    assert_eq!(logical_he, "42 קרדיטים");

    // Visual RTL moves LTR number `42` to the right side of the Hebrew word `קרדיטים`.
    let visual_he = fmt_for(Lang::Hebrew, "{count} credits", &[("count", "42")]);
    assert_eq!(visual_he, "קרדיטים 42");
    assert!(!visual_he.contains("{count}"));

    // Mixed Hebrew and @username must not leave raw placeholders reversed.
    let signed_in_logical = fmt_logical_for(Lang::Hebrew, "Signed in as @{user}", &[("user", "alice")]);
    assert_eq!(signed_in_logical, "מחובר בתור @alice");
    let signed_in = fmt_for(Lang::Hebrew, "Signed in as @{user}", &[("user", "alice")]);
    assert_eq!(signed_in, "@alice בתור מחובר");
    assert!(!signed_in.contains("{user}"));
  }

  #[test]
  fn fontless_fallback_preserves_saved_hebrew_choice() {
    let choices = vec![LanguageChoice { pref: SYSTEM, label: "System default".into() }, LanguageChoice { pref: ENGLISH, label: "English".into() }];
    let (with_missing, idx) = language_choices_with(choices, "he-IL");
    assert_eq!(idx, 2);
    assert_eq!(with_missing[idx].pref, HEBREW);
  }

  #[test]
  fn wrapped_visual_lines_reorders_after_width_wrapping() {
    let ctx = egui::Context::default();
    crate::theme::apply(&ctx);
    let logical = tl_for(Lang::Hebrew, "When on, pressing Enter submits the prompt and Shift+Enter adds a new line. When off (default), both Enter and Shift+Enter add a new line - use only the button to submit.");
    let mut wrapped = String::new();
    let mut shaped_row_glyphs = Vec::new();
    let mut out = ctx.run_ui(egui::RawInput::default(), |ui| {
      wrapped = wrapped_visual_lines(ui.ctx(), Lang::Hebrew, logical, &egui::FontId::proportional(12.5), 260.0);
      let galley = ui.ctx().fonts_mut(|f| f.layout_no_wrap(visual_rtl("מחובר בתור"), egui::FontId::proportional(14.0), egui::Color32::WHITE));
      if let Some(row) = galley.rows.first() {
        shaped_row_glyphs = row.glyphs.iter().map(|g| (g.chr, g.pos.x)).collect();
      }
    });
    out.textures_delta.clear();
    assert!(wrapped.contains('\n'), "expected narrow wrapping to produce multiple lines: {wrapped}");
    // Verify multi-word Hebrew shapes right-to-left: 'ר' of "בתור" is left of 'מ' of "מחובר".
    let betor_x = shaped_row_glyphs.iter().find(|(c, _)| *c == 'ת').map(|(_, x)| *x);
    let mehubar_x = shaped_row_glyphs.iter().find(|(c, _)| *c == 'מ').map(|(_, x)| *x);
    assert!(betor_x < mehubar_x, "expected second word ('בתור') to render left of first word ('מחובר'): {shaped_row_glyphs:?}");
  }

  #[test]
  fn apply_preference_roundtrips_cleanly() {
    let before = current();
    apply_preference("iw_IL.UTF-8");
    assert_eq!(current(), Lang::Hebrew);
    assert!(is_rtl());
    set_current(before);
  }
}
