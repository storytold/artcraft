/// Returns true if the text contains any Chinese, Japanese, or Korean characters.
pub fn text_contains_cjk(text: &str) -> bool {
  text.chars().any(is_cjk_char)
}

fn is_cjk_char(c: char) -> bool {
  matches!(c as u32,
    0x1100..=0x11FF     // Hangul Jamo
    | 0x3040..=0x309F   // Hiragana
    | 0x30A0..=0x30FF   // Katakana
    | 0x3130..=0x318F   // Hangul Compatibility Jamo
    | 0x31F0..=0x31FF   // Katakana Phonetic Extensions
    | 0x3400..=0x4DBF   // CJK Unified Ideographs Extension A
    | 0x4E00..=0x9FFF   // CJK Unified Ideographs
    | 0xA960..=0xA97F   // Hangul Jamo Extended-A
    | 0xAC00..=0xD7AF   // Hangul Syllables
    | 0xD7B0..=0xD7FF   // Hangul Jamo Extended-B
    | 0xF900..=0xFAFF   // CJK Compatibility Ideographs
    | 0xFF66..=0xFF9D   // Halfwidth Katakana
    | 0x20000..=0x2FA1F // CJK Unified Ideographs Extensions B+ and Supplement
  )
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn detects_chinese() {
    assert!(text_contains_cjk("一只猫在田野里奔跑"));
  }

  #[test]
  fn detects_japanese_hiragana_and_katakana() {
    assert!(text_contains_cjk("ねこ"));
    assert!(text_contains_cjk("ネコ"));
  }

  #[test]
  fn detects_korean() {
    assert!(text_contains_cjk("고양이"));
  }

  #[test]
  fn detects_cjk_mixed_into_latin_text() {
    assert!(text_contains_cjk("a cat 猫 running"));
  }

  #[test]
  fn does_not_detect_latin_or_accented_text() {
    assert!(!text_contains_cjk("a cat running through a field"));
    assert!(!text_contains_cjk("un château élégant"));
  }

  #[test]
  fn does_not_detect_emoji() {
    assert!(!text_contains_cjk("a cat 🐱 running"));
  }

  #[test]
  fn does_not_detect_empty_string() {
    assert!(!text_contains_cjk(""));
  }
}
