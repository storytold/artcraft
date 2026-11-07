//! CJK fallback fonts from the operating system.
//!
//! ArtCraft bundles only Latin faces (Inter, Archivo, Geist Mono), so Japanese, Chinese and Korean
//! prompt text, character names and descriptions would draw as missing-glyph boxes. The app does
//! not bundle CJK fonts — they are tens of megabytes and belong to the system — so the faces the
//! machine already has are read once at startup and appended after every bundled family, the same
//! way the other Craft apps do it: Japanese first (kana and Japanese Han forms), Chinese second
//! (for the characters the Japanese face lacks), Korean last. A machine with none installed keeps
//! the Latin faces and draws boxes for CJK, exactly as before: nothing here can fail the app.
//!
//! Set `ARTCRAFT_NO_SYSTEM_FONTS=1` to skip the whole lookup (tests do, where they want the
//! bundled-only stack).

use egui::FontData;

/// Font files larger than this are skipped: egui keeps the whole file in memory.
const MAX_FONT_BYTES: u64 = 64 << 20;

/// Japanese face candidates (kana and Japanese Han forms), in the order the platforms' own
/// fallback tables prefer them. macOS names the Hiragino files in Unicode; Microsoft's are the
/// usual Yu Gothic/Meiryo/MS Gothic; Linux and BSD get Noto's CJK faces, with `fc-match` ahead of
/// them.
const JAPANESE: &[(&str, u32)] = &[("/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc", 0), ("/System/Library/Fonts/AquaKana.ttc", 0), ("/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc", 0), ("C:\\Windows\\Fonts\\YuGothM.ttc", 0), ("C:\\Windows\\Fonts\\meiryo.ttc", 0), ("C:\\Windows\\Fonts\\msgothic.ttc", 0), ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 0), ("/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc", 0), ("/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc", 0), ("/usr/share/fonts/opentype/noto/NotoSansJP-Regular.otf", 0), ("/usr/share/fonts/truetype/noto/NotoSansJP-Regular.otf", 0)];

/// Chinese face candidates (Simplified; shared and Traditional Han characters are covered by the
/// same faces), for the characters the Japanese face lacks (页, 选, 删) and for Chinese names.
const CHINESE: &[(&str, u32)] = &[("/System/Library/Fonts/PingFang.ttc", 0), ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0), ("/System/Library/Fonts/STHeiti Light.ttc", 0), ("C:\\Windows\\Fonts\\msyh.ttc", 0), ("C:\\Windows\\Fonts\\simsun.ttc", 0), ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 2), ("/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc", 2), ("/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc", 2), ("/usr/share/fonts/opentype/noto/NotoSansSC-Regular.otf", 0), ("/usr/share/fonts/truetype/noto/NotoSansSC-Regular.otf", 0)];

/// Korean face candidates (Hangul); Noto's CJK collection has its Korean face at index 1.
const HANGUL: &[(&str, u32)] = &[("/System/Library/Fonts/AppleSDGothicNeo.ttc", 0), ("/System/Library/Fonts/Supplemental/AppleGothic.ttf", 0), ("C:\\Windows\\Fonts\\malgun.ttf", 0), ("C:\\Windows\\Fonts\\gulim.ttc", 0), ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 1), ("/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc", 1), ("/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc", 1), ("/usr/share/fonts/truetype/nanum/NanumGothic.ttf", 0), ("/usr/share/fonts/naver-nanum/NanumGothic.ttf", 0)];

/// Asks fontconfig for the desktop's font matching `pattern`. Only TrueType/OpenType results are
/// used: egui cannot read Type 1 or bitmap fonts, which `fc-match` may return on minimal systems.
/// With `lang`, the match must support that language (`fc-match` always returns its best match,
/// which is a Latin face when no CJK font is installed).
#[cfg(any(target_os = "linux", target_os = "freebsd"))]
fn load_from_fontconfig(pattern: &str, lang: Option<&str>) -> Option<FontData> {
  let output = std::process::Command::new("fc-match").args(["--format=%{file}\\n%{index}\\n%{lang}\\n", pattern]).output().ok()?;
  if !output.status.success() {
    return None;
  }
  let stdout = String::from_utf8(output.stdout).ok()?;
  let mut lines = stdout.lines();
  let path = lines.next()?.trim();
  // The upper 16 bits carry a variable font's named instance; the face index is the lower 16.
  let index = lines.next()?.trim().parse::<u32>().ok()? & 0xFFFF;
  if let Some(lang) = lang {
    if !lines.next().unwrap_or_default().split('|').any(|l| l.trim() == lang) {
      return None;
    }
  }
  if std::fs::metadata(path).ok()?.len() > MAX_FONT_BYTES {
    return None;
  }
  let bytes = std::fs::read(path).ok()?;
  let sfnt = matches!(bytes.get(..4), Some(b"\0\x01\0\0" | b"OTTO" | b"true" | b"ttcf"));
  if !sfnt {
    return None;
  }
  let mut font = FontData::from_owned(bytes);
  font.index = index;
  Some(font)
}

/// The first usable face from `cands` (after fontconfig, where it exists), or `None` when the
/// system has no such font — the caller then leaves the bundled families as they are.
fn load(cands: &[(&str, u32)], pattern: &str, lang: Option<&str>) -> Option<FontData> {
  if std::env::var_os("ARTCRAFT_NO_SYSTEM_FONTS").is_some() {
    return None;
  }
  #[cfg(any(target_os = "linux", target_os = "freebsd"))]
  if let Some(font) = load_from_fontconfig(pattern, lang) {
    return Some(font);
  }
  #[cfg(not(any(target_os = "linux", target_os = "freebsd")))]
  let _ = (pattern, lang);
  for (path, index) in cands {
    if std::fs::metadata(path).is_ok_and(|m| m.len() > MAX_FONT_BYTES) {
      continue;
    }
    if let Ok(bytes) = std::fs::read(path) {
      let mut font = FontData::from_owned(bytes);
      font.index = *index;
      return Some(font);
    }
  }
  None
}

/// The installed CJK faces to append after every bundled family: Japanese first, Chinese second,
/// Korean last. Empty when the system has none (or `ARTCRAFT_NO_SYSTEM_FONTS` is set).
pub fn cjk_faces() -> Vec<(&'static str, FontData)> {
  let mut faces = Vec::new();
  for (name, candidates, pattern, lang) in [("system-japanese", JAPANESE, "sans-serif:lang=ja", Some("ja")), ("system-chinese", CHINESE, "sans-serif:lang=zh-cn", Some("zh-cn")), ("system-hangul", HANGUL, "sans-serif:lang=ko", Some("ko"))] {
    if let Some(font) = load(candidates, pattern, lang) {
      faces.push((name, font));
    }
  }
  faces
}

#[cfg(test)]
mod tests {
  use super::*;
  use egui::{FontFamily, FontId};

  #[test]
  fn candidates_cover_every_desktop_platform() {
    for prefix in ["/System/Library/Fonts/", "C:\\Windows\\Fonts\\", "/usr/share/fonts/"] {
      assert!(JAPANESE.iter().any(|(p, _)| p.starts_with(prefix)), "no Japanese candidate under {prefix}");
      assert!(CHINESE.iter().any(|(p, _)| p.starts_with(prefix)), "no Chinese candidate under {prefix}");
      assert!(HANGUL.iter().any(|(p, _)| p.starts_with(prefix)), "no Korean candidate under {prefix}");
    }
    // Face 0 of the Noto Sans CJK collection is Japanese, 1 Korean and 2 Simplified Chinese.
    assert!(JAPANESE.iter().filter(|(p, _)| p.ends_with("NotoSansCJK-Regular.ttc")).all(|(_, i)| *i == 0));
    assert!(HANGUL.iter().filter(|(p, _)| p.ends_with("NotoSansCJK-Regular.ttc")).all(|(_, i)| *i == 1));
    assert!(CHINESE.iter().filter(|(p, _)| p.ends_with("NotoSansCJK-Regular.ttc")).all(|(_, i)| *i == 2));
  }

  /// Every bundled family gets the system CJK faces after its own stack, Japanese first, and can
  /// then draw Japanese, Chinese and Korean text — a Japanese prompt, a character name or a
  /// description no longer falls back to missing-glyph boxes. Skipped where the system has no CJK
  /// font; the candidate lists above are checked everywhere.
  #[test]
  fn cjk_fallbacks_are_appended_and_draw_the_scripts() {
    let defs = crate::theme::font_definitions();
    let (ja, zh, ko) = (defs.font_data.contains_key("system-japanese"), defs.font_data.contains_key("system-chinese"), defs.font_data.contains_key("system-hangul"));
    if !ja && !zh && !ko {
      eprintln!("skipping: no CJK system font installed");
      return;
    }
    let stack = defs.families.get(&FontFamily::Proportional).cloned().unwrap_or_default();
    let at = |name: &str| stack.iter().position(|f| f == name);
    if ja && zh {
      assert!(at("system-japanese") < at("system-chinese"), "Japanese comes first: {stack:?}");
    }
    if zh && ko {
      assert!(at("system-chinese") < at("system-hangul"), "Chinese comes before Korean: {stack:?}");
    }
    assert!(at("Inter").is_some_and(|inter| inter < at("system-japanese").unwrap_or(usize::MAX)), "the bundled Inter stays first: {stack:?}");
    let families: Vec<FontFamily> = defs.families.keys().cloned().collect();
    let ctx = egui::Context::default();
    ctx.set_fonts(defs);
    let mut output = ctx.run_ui(egui::RawInput::default(), |_| {});
    output.textures_delta.clear();
    for family in families {
      let font = FontId::new(14.0, family.clone());
      if ja {
        assert!(ctx.fonts_mut(|f| f.has_glyphs(&font, "あア漢字、日本語プロンプト")), "{family:?} has no Japanese");
      }
      if zh {
        assert!(ctx.fonts_mut(|f| f.has_glyphs(&font, "汉字、测试页")), "{family:?} has no Chinese");
      }
      if ko {
        assert!(ctx.fonts_mut(|f| f.has_glyphs(&font, "한국어 세션")), "{family:?} has no Korean");
      }
    }
  }
}
