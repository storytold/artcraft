//! Colours, type and shapes of the ArtCraft webapp's brutalist system
//! (`artcraft-services/frontend/apps/artcraft-webapp`): near-black surfaces, white/15 hairlines,
//! Archivo display type, Inter body text, Geist Mono labels and 3 px corners on anything
//! pressable. Large surfaces (panels, cards, media tiles) stay square.

use std::sync::Arc;
use std::sync::atomic::{AtomicU8, Ordering};

use egui::epaint::text::VariationCoords;
use egui::{Color32, CornerRadius, FontData, FontDefinitions, FontFamily, FontId, FontTweak, Stroke, TextStyle, Visuals};
use skrifa::MetadataProvider as _;

const fn hex(rgb: u32) -> Color32 {
  let [_, r, g, b] = rgb.to_be_bytes();
  Color32::from_rgb(r, g, b)
}

const fn alpha(rgb: u32, a: u8) -> Color32 {
  let [_, r, g, b] = rgb.to_be_bytes();
  Color32::from_rgba_unmultiplied_const(r, g, b, a)
}

/// `ui-background`: the page behind the feed.
pub const BG: Color32 = hex(0x121316);
/// `ui-panel`: the top bar, modals and the lightbox.
pub const PANEL: Color32 = hex(0x101014);
/// `ui-controls`: the sidebar, the prompt box and toolbar buttons.
pub const CONTROLS: Color32 = hex(0x1e1f22);
/// The window chrome behind the content panel: the title bar and the sidebar.
pub const CHROME: Color32 = hex(0x0a0a0c);
/// `ui-sunken`: wells and inputs.
pub const SUNKEN: Color32 = hex(0x060607);

/// `base-fg`: body text.
pub const INK: Color32 = hex(0xf2f1ee);
pub const INK_STRONG: Color32 = Color32::WHITE;
/// `base-fg/60`: secondary text and placeholders.
pub const MUTED: Color32 = alpha(0xf2f1ee, 153);
/// `base-fg/50`: idle toolbar icons.
pub const DIM: Color32 = alpha(0xf2f1ee, 128);
/// `base-fg/40`: counters and captions.
pub const FAINT: Color32 = alpha(0xf2f1ee, 102);
/// The sidebar's link colour (`white/72`).
pub const SIDEBAR_INK: Color32 = alpha(0xffffff, 184);

/// `white/15`: every hairline.
pub const LINE: Color32 = alpha(0xffffff, 38);
/// `white/25`: dashed drop targets.
pub const LINE_DASHED: Color32 = alpha(0xffffff, 64);
/// `base-fg/40`: outlined buttons and corner marks.
pub const LINE_STRONG: Color32 = alpha(0xf2f1ee, 102);
/// `white/5`: quiet fills.
pub const WASH: Color32 = alpha(0xffffff, 13);
/// `white/8`: the selected sidebar row.
pub const WASH_SELECTED: Color32 = alpha(0xffffff, 20);
/// `white/10`: hovered menu rows.
pub const WASH_HOVER: Color32 = alpha(0xffffff, 26);

/// The brand blue (`primary`).
pub const ACCENT: Color32 = hex(0x2d81ff);
/// `primary-400`: progress bars and selection rings.
pub const ACCENT_400: Color32 = hex(0x59a7ff);
/// `ui-accent-ink`: blue text and focus rings.
pub const ACCENT_INK: Color32 = hex(0x74aaff);

/// The inverted primary button (white block, near-black text).
pub const INVERT_BG: Color32 = Color32::WHITE;
pub const INVERT_FG: Color32 = hex(0x0b0b0c);

/// `red-400`: failure text.
pub const BAD: Color32 = hex(0xf87171);
/// `red`: destructive fills.
pub const DANGER: Color32 = hex(0xd33242);
/// The "BETA" / "NEW" sidebar badges.
pub const BADGE_BETA: Color32 = hex(0xffc14d);

/// 3 px: buttons, inputs, menus and the prompt box.
pub const RADIUS: CornerRadius = CornerRadius::same(3);

/// Height of toolbar buttons (`py-1.5` + 14 px text + hairline).
pub const CONTROL_H: f32 = 34.0;
/// The `.hud-label`: 11 px Geist Mono, upper case, 0.15 em apart.
pub const HUD_SIZE: f32 = 11.0;
pub const HUD_SPACING: f32 = HUD_SIZE * 0.15;
/// Section labels and mono buttons are tracked a little tighter (0.12 em).
pub const LABEL_SPACING: f32 = HUD_SIZE * 0.12;

pub fn hairline() -> Stroke {
  Stroke::new(1.0, LINE)
}

/// `c` at `a` (0–1) of its opacity.
pub fn fade(c: Color32, a: f32) -> Color32 {
  c.gamma_multiply(a.clamp(0.0, 1.0))
}

/// The shadow under menus, modals and toasts.
pub fn shadow() -> egui::epaint::Shadow {
  egui::epaint::Shadow { offset: [0, 8], blur: 24, spread: 0, color: Color32::from_black_alpha(140) }
}

/// Inter 500.
pub fn medium() -> FontFamily {
  FontFamily::Name("medium".into())
}

/// Inter 600.
pub fn semibold() -> FontFamily {
  FontFamily::Name("semibold".into())
}

/// Archivo 620 at 118 % width: `.font-display` headings.
pub fn display() -> FontFamily {
  FontFamily::Name("display".into())
}

/// Geist Mono 500: HUD labels.
pub fn mono() -> FontFamily {
  FontFamily::Name("mono".into())
}

/// Geist Mono 600–700: section labels and mono buttons.
pub fn mono_bold() -> FontFamily {
  FontFamily::Name("mono-bold".into())
}

fn visuals() -> Visuals {
  let mut v = Visuals::dark();
  v.panel_fill = BG;
  v.window_fill = PANEL;
  v.extreme_bg_color = SUNKEN;
  v.text_edit_bg_color = Some(Color32::TRANSPARENT);
  v.faint_bg_color = CONTROLS;
  v.code_bg_color = SUNKEN;
  v.window_stroke = hairline();
  v.window_corner_radius = RADIUS;
  v.menu_corner_radius = RADIUS;
  v.window_shadow = shadow();
  v.popup_shadow = shadow();
  v.override_text_color = Some(INK);
  v.hyperlink_color = ACCENT_INK;
  v.selection.bg_fill = ACCENT;
  v.selection.stroke = Stroke::new(1.0, Color32::WHITE);
  v.text_cursor.stroke = Stroke::new(1.5, Color32::WHITE);
  v.warn_fg_color = BADGE_BETA;
  v.error_fg_color = BAD;
  v.striped = false;
  for (w, fill, stroke, fg) in [(&mut v.widgets.noninteractive, CONTROLS, LINE, MUTED), (&mut v.widgets.inactive, CONTROLS, LINE, INK), (&mut v.widgets.hovered, WASH_HOVER, LINE_STRONG, INK_STRONG), (&mut v.widgets.active, WASH_HOVER, LINE_STRONG, INK_STRONG), (&mut v.widgets.open, WASH_HOVER, LINE_STRONG, INK_STRONG)] {
    w.bg_fill = fill;
    w.weak_bg_fill = fill;
    w.bg_stroke = Stroke::new(1.0, stroke);
    w.corner_radius = RADIUS;
    w.fg_stroke = Stroke::new(1.0, fg);
    w.expansion = 0.0;
  }
  v
}

/// Installs the fonts, colours and spacing. The app is dark only, like the webapp.
pub fn apply(ctx: &egui::Context) {
  install_fonts(ctx);
  ctx.set_visuals_of(egui::Theme::Dark, visuals());
  ctx.set_theme(egui::ThemePreference::Dark);
  ctx.all_styles_mut(|style| {
    style.spacing.item_spacing = egui::vec2(8.0, 6.0);
    style.spacing.button_padding = egui::vec2(12.0, 6.0);
    style.spacing.interact_size.y = CONTROL_H;
    style.spacing.menu_margin = egui::Margin::same(4);
    style.spacing.window_margin = egui::Margin::same(16);
    style.spacing.scroll = egui::style::ScrollStyle { bar_width: 8.0, floating: true, ..egui::style::ScrollStyle::thin() };
    style.text_styles = [(TextStyle::Heading, FontId::new(24.0, display())), (TextStyle::Body, FontId::new(14.0, FontFamily::Proportional)), (TextStyle::Button, FontId::new(14.0, medium())), (TextStyle::Small, FontId::new(12.0, FontFamily::Proportional)), (TextStyle::Monospace, FontId::new(13.0, FontFamily::Monospace))].into();
  });
}

/// A font registered under `name`: its file, its variation coordinates and its family.
type Face<'a> = (&'a str, &'static [u8], &'a [([u8; 4], f32)], FontFamily);

const HEBREW_FONT_UNSET: u8 = 0;
const HEBREW_FONT_MISSING: u8 = 1;
const HEBREW_FONT_READY: u8 = 2;
static HEBREW_FONT_STATE: AtomicU8 = AtomicU8::new(HEBREW_FONT_UNSET);

/// Candidate system fallback font paths probed on native targets when no font is embedded.
#[cfg(all(not(target_arch = "wasm32"), not(has_hebrew_craft_font)))]
const HEBREW_FONT_CANDIDATES: [(&str, &str); 11] = [("sf-hebrew", "/System/Library/Fonts/SFHebrew.ttf"), ("arial-hebrew", "/System/Library/Fonts/Supplemental/Arial Hebrew.ttf"), ("arial-hebrew-local", "/Library/Fonts/Arial Hebrew.ttf"), ("arial", "/System/Library/Fonts/Supplemental/Arial.ttf"), ("arial-unicode", "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"), ("arialhb-ttc", "/Library/Fonts/ArialHB.ttc"), ("noto-sans-hebrew", "/usr/share/fonts/truetype/noto/NotoSansHebrew-Regular.ttf"), ("noto-sans-hebrew-arch", "/usr/share/fonts/noto/NotoSansHebrew-Regular.ttf"), ("dejavu-sans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), ("win-arial", "C:\\Windows\\Fonts\\arial.ttf"), ("win-segoeui", "C:\\Windows\\Fonts\\segoeui.ttf")];

/// Whether a usable Hebrew font was installed (or discovered on this system).
pub fn hebrew_font_available() -> bool {
  match HEBREW_FONT_STATE.load(Ordering::Relaxed) {
    HEBREW_FONT_READY => true,
    HEBREW_FONT_MISSING => false,
    _ => {
      let mut probe = FontDefinitions::default();
      let found = hebrew_fallback_font(&mut probe).is_some();
      HEBREW_FONT_STATE.store(if found { HEBREW_FONT_READY } else { HEBREW_FONT_MISSING }, Ordering::Relaxed);
      found
    },
  }
}

/// Registers the three variable fonts, each at the weights (and width) the webapp uses, plus a
/// Hebrew fallback face so RTL UI labels render cleanly without committing binary font assets.
fn install_fonts(ctx: &egui::Context) {
  const INTER: &[u8] = include_bytes!("../assets/fonts/Inter-Variable.ttf");
  const ARCHIVO: &[u8] = include_bytes!("../assets/fonts/Archivo-Variable.ttf");
  const GEIST_MONO: &[u8] = include_bytes!("../assets/fonts/GeistMono-Variable.ttf");
  let mut fonts = FontDefinitions::default();
  let hebrew = hebrew_fallback_font(&mut fonts);
  HEBREW_FONT_STATE.store(if hebrew.is_some() { HEBREW_FONT_READY } else { HEBREW_FONT_MISSING }, Ordering::Relaxed);
  // egui's own fonts stay behind ours, for symbols and emoji ours don't have.
  let fallback = fonts.families.get(&FontFamily::Proportional).cloned().unwrap_or_default();
  let faces: [Face<'_>; 7] = [("Inter", INTER, &[(*b"wght", 400.0), (*b"opsz", 14.0)], FontFamily::Proportional), ("Inter-Medium", INTER, &[(*b"wght", 500.0), (*b"opsz", 14.0)], medium()), ("Inter-SemiBold", INTER, &[(*b"wght", 600.0), (*b"opsz", 14.0)], semibold()), ("Archivo-Display", ARCHIVO, &[(*b"wght", 620.0), (*b"wdth", 118.0)], display()), ("GeistMono", GEIST_MONO, &[(*b"wght", 400.0)], FontFamily::Monospace), ("GeistMono-Medium", GEIST_MONO, &[(*b"wght", 500.0)], mono()), ("GeistMono-SemiBold", GEIST_MONO, &[(*b"wght", 650.0)], mono_bold())];
  for (name, bytes, coords, family) in faces {
    let tweak = FontTweak { coords: VariationCoords::new(coords.iter().copied()), ..Default::default() };
    fonts.font_data.insert(name.to_owned(), Arc::new(FontData::from_static(bytes).tweak(tweak)));
    let mut stack = vec![name.to_owned()];
    if let Some(ref heb) = hebrew {
      stack.push(heb.clone());
    }
    stack.extend(fallback.iter().cloned());
    fonts.families.insert(family, stack);
  }
  ctx.set_fonts(fonts);
}

fn is_valid_hebrew_font(name: &str, bytes: &[u8]) -> bool {
  if bytes.is_empty() {
    log::warn!("Skipping empty Hebrew fallback font {name}");
    return false;
  }
  let face = match skrifa::FontRef::from_index(bytes, 0) {
    Ok(face) => face,
    Err(err) => {
      log::warn!("Skipping unreadable Hebrew fallback font {name}: {err}");
      return false;
    },
  };
  if face.charmap().map('א').is_none() {
    log::warn!("Skipping fallback font {name} without Hebrew glyph coverage");
    return false;
  }
  true
}

fn hebrew_fallback_font(fonts: &mut FontDefinitions) -> Option<String> {
  #[cfg(has_hebrew_craft_font)]
  {
    const NAME: &str = "NotoSansHebrew";
    const BYTES: &[u8] = include_bytes!(env!("HEBREW_CRAFT_FONT_PATH"));
    if is_valid_hebrew_font(NAME, BYTES) {
      fonts.font_data.insert(NAME.to_owned(), Arc::new(FontData::from_static(BYTES)));
      return Some(NAME.to_owned());
    }
    None
  }

  #[cfg(all(not(target_arch = "wasm32"), not(has_hebrew_craft_font)))]
  {
    for (name, path) in HEBREW_FONT_CANDIDATES {
      if let Ok(bytes) = std::fs::read(path) {
        if is_valid_hebrew_font(name, &bytes) {
          fonts.font_data.insert(name.to_owned(), Arc::new(FontData::from_owned(bytes)));
          return Some(name.to_owned());
        }
      }
    }
    None
  }

  #[cfg(all(target_arch = "wasm32", not(has_hebrew_craft_font)))]
  {
    let _ = fonts;
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn rejects_empty_and_corrupt_hebrew_font_bytes() {
    assert!(!is_valid_hebrew_font("empty", b""));
    assert!(!is_valid_hebrew_font("corrupt", b"not-a-valid-ttf-font"));
    // Bundled Inter variable font lacks Hebrew glyphs and must also be rejected as a Hebrew fallback.
    const INTER: &[u8] = include_bytes!("../assets/fonts/Inter-Variable.ttf");
    assert!(!is_valid_hebrew_font("inter", INTER));
  }

  #[test]
  fn hebrew_fallback_font_renders_hebrew_text_without_panicking() {
    let ctx = egui::Context::default();
    apply(&ctx);
    let mut out = ctx.run_ui(egui::RawInput::default(), |ui| {
      let galley = ui.painter().layout_no_wrap("עברית".into(), FontId::proportional(14.0), Color32::WHITE);
      assert!(galley.size().x > 0.0);
    });
    out.textures_delta.clear();
    #[cfg(target_os = "macos")]
    {
      assert!(hebrew_font_available(), "expected Hebrew fallback font on macOS");
      let has_hebrew = ctx.fonts_mut(|f| f.has_glyph(&FontId::proportional(14.0), 'ע'));
      assert!(has_hebrew, "expected system Hebrew fallback font on macOS");
    }
  }
}
