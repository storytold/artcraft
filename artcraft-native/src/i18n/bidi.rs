//! egui lays a label out run by run — every run one font, shaped on its own — and puts the runs
//! left to right in the order it met them. It does not run the Unicode bidirectional algorithm
//! (its text code still carries `TODO(emilk): heed bidi characters`), so a right-to-left label
//! reads with its words in reverse order: egui shapes each Arabic word correctly once the
//! language's system font has loaded, but it draws the first word at the left of the line, and
//! the reader meets the second one first.
//!
//! This module reorders a translation into *visual order* before egui sees it, the technique
//! immediate-mode UIs use until their text stack grows bidi support: the label's runs come out
//! in the order they must appear on screen, left to right, while the characters inside each run
//! stay in logical order, because the shaper reverses a right-to-left run itself (harfrust
//! picks the direction from the script). Brackets are mirrored here too, as UAX #9 L4 asks:
//! egui draws the glyph of the character it is handed.
//!
//! Only catalog lookups go through here, so what a user types into a field keeps its logical
//! order — the order the clipboard and search expect. A label long enough to wrap still wraps
//! from its visual end (egui wraps runs as it meets them), and the mirrored layout of the
//! widgets is a separate, larger step; this pass is what an Arabic interface needs until egui
//! grows bidi of its own.

use unicode_bidi::{BidiClass, BidiInfo, Level};

/// A character the shaper lays out as part of a right-to-left run: a strong right-to-left
/// character (Arabic and Hebrew letters) or a mark riding on one. The stretches these form are
/// emitted in logical order; every other character keeps the place the reordering gave it.
fn is_rtl_shaped(c: char) -> bool {
  matches!(unicode_bidi::bidi_class(c), BidiClass::R | BidiClass::AL | BidiClass::NSM)
}

/// The glyph a bracket has to show in a right-to-left context: egui draws the glyph of the
/// character it is given, so the mirror pair has to be swapped in the text itself. The pairs
/// come from `BidiMirroring.txt` — the ones an interface label can hold, guillemets
/// included. Curly brackets are left alone: in an interface label they are almost always a
/// `{placeholder}`'s own syntax, and mirroring them would break the fill.
fn mirror(c: char) -> char {
  match c {
    '(' => ')',
    ')' => '(',
    '[' => ']',
    ']' => '[',
    '<' => '>',
    '>' => '<',
    '«' => '»',
    '»' => '«',
    '‹' => '›',
    '›' => '‹',
    _ => c,
  }
}

/// `label` in logical order, rearranged for egui's run-by-run, left-to-right layout: the runs in
/// visual order (left to right), the characters inside each run in logical order for the shaper,
/// brackets mirrored. Lines are reordered on their own (`\n` ends one). A `{placeholder}` is the
/// label's own syntax: it rides through the pass as one character, so the reordering can
/// neither split, reverse nor mirror it, and every placeholder comes back exactly as written.
/// A label with nothing right-to-left in it comes back as it was.
pub fn visual_rtl(label: &str) -> String {
  if !label.chars().any(is_rtl_shaped) {
    return label.into();
  }
  // Each placeholder becomes one private-use character (a left-to-right one, like the name
  // inside it) for the pass, and is restored afterwards; the mapping is per placeholder, so
  // a reordered sentence still finds its own.
  let mut tokens: Vec<&str> = Vec::new();
  let mut guarded = String::with_capacity(label.len());
  let mut rest = label;
  while let Some(open) = rest.find('{') {
    guarded.push_str(&rest[..open]);
    let after = &rest[open + 1..];
    if let Some(close) = after.find('}') {
      tokens.push(&rest[open..open + close + 2]);
      guarded.push(char::from_u32(0xE000 + tokens.len() as u32 - 1).unwrap_or('\u{E000}'));
      rest = &after[close + 1..];
    } else {
      guarded.push('{');
      rest = after;
    }
  }
  guarded.push_str(rest);
  let mut out = String::with_capacity(label.len());
  let mut first = true;
  for line in guarded.split('\n') {
    if !first {
      out.push('\n');
    }
    first = false;
    visual_rtl_line(line, &mut out);
  }
  if tokens.is_empty() {
    return out;
  }
  let mut restored = String::with_capacity(out.len());
  for c in out.chars() {
    let k = c as u32;
    if (0xE000..0xE000 + tokens.len() as u32).contains(&k) {
      restored.push_str(tokens[(k - 0xE000) as usize]);
    } else {
      restored.push(c);
    }
  }
  restored
}

/// One line of [`visual_rtl`] (no `\n` in it), appended to `out`.
fn visual_rtl_line(line: &str, out: &mut String) {
  let bidi = BidiInfo::new(line, Some(Level::rtl()));
  let Some(para) = bidi.paragraphs.first() else {
    out.push_str(line);
    return;
  };
  let chars: Vec<char> = line.chars().collect();
  let levels = bidi.reordered_levels_per_char(para, para.range.clone());
  // The line's characters in visual order, left to right (UAX #9 L1–L2).
  let order = BidiInfo::reorder_visual(&levels);
  let mut p = 0;
  while p < order.len() {
    let i = order[p];
    if is_rtl_shaped(chars[i]) {
      // One shaping run: a stretch of right-to-left characters, contiguous in the line,
      // whatever order the reordering brought it in (descending in a right-to-left
      // context, ascending inside a left-to-right island). Emitted in logical order,
      // which is ascending.
      let (mut lo, mut hi) = (i, i);
      let mut end = p + 1;
      loop {
        if let Some(&j) = order.get(end)
          && is_rtl_shaped(chars[j])
          && (j + 1 == lo || j == hi + 1)
        {
          lo = lo.min(j);
          hi = hi.max(j);
          end += 1;
        } else {
          break;
        }
      }
      let mut j = lo;
      while j <= hi {
        out.push(chars[j]);
        j += 1;
      }
      p = end;
    } else {
      // A left-to-right run — a Latin word, a number — or a character between runs: a
      // space, an ellipsis. It stands where the reordering put it; a bracket in a
      // right-to-left context shows its mirror.
      let c = chars[i];
      out.push(if levels[i].is_rtl() { mirror(c) } else { c });
      p += 1;
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn runs_in_visual_order_letters_in_logical_order() {
    // The first word of a sentence ends up rightmost; each word still reads correctly.
    assert_eq!(visual_rtl("إعداد المستند"), "المستند إعداد");
    assert_eq!(visual_rtl("تحرير لوحات الرسم"), "الرسم لوحات تحرير");
    // One run (one word) is left as it is: the shaper reverses its letters itself.
    assert_eq!(visual_rtl("المعاينة"), "المعاينة");
    // A mark rides on its letter inside the run.
    assert_eq!(visual_rtl("عنصراً جديد"), "جديد عنصراً");
  }

  #[test]
  fn left_to_right_islands_keep_their_own_order() {
    // A left-to-right run keeps its own order, as one unit, in its place in the sentence;
    // the ellipsis of a dialog command ends up at the reading end (the left).
    assert_eq!(visual_rtl("حفظ كـ PDF…"), "…PDF كـ حفظ");
    assert_eq!(visual_rtl("تصدير كـ SVG"), "SVG كـ تصدير");
    // A number between Arabic words reads left to right, in its place in the sentence.
    assert_eq!(visual_rtl("إنشاء 3 نسخ"), "نسخ 3 إنشاء");
    // A `{placeholder}` is the label's own syntax: it rides through as one unit, in the
    // order it was written, and never mirrored.
    assert_eq!(visual_rtl("لون مميز {n}"), "{n} مميز لون");
    assert_eq!(visual_rtl("جارٍ تنزيل {done} من {total}"), "{total} من {done} تنزيل جارٍ");
  }

  #[test]
  fn brackets_mirror() {
    assert_eq!(visual_rtl("حفظ (النسخة الحالية)"), "(الحالية النسخة) حفظ");
    // Guillemets mirror too (BidiMirroring.txt): quotes and breadcrumb separators point the
    // reading way, not the way they were typed.
    assert_eq!(visual_rtl("«ملف › الصفحة الرئيسية»"), "«الرئيسية الصفحة ‹ ملف»");
    assert_eq!(visual_rtl("«جديد…» يبدأ نسخة"), "نسخة يبدأ «…جديد»");
  }

  #[test]
  fn lines_are_reordered_on_their_own() {
    assert_eq!(visual_rtl("سطر أول\nسطر ثانٍ"), "أول سطر\nثانٍ سطر");
    assert_eq!(visual_rtl("سطر أول\nPDF"), "أول سطر\nPDF");
  }

  #[test]
  fn nothing_right_to_left_comes_back_as_it_was() {
    assert_eq!(visual_rtl("PDF"), "PDF");
    assert_eq!(visual_rtl("Plain label, 3 of them."), "Plain label, 3 of them.");
    assert_eq!(visual_rtl(""), "");
  }
}
