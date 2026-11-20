//! Building blocks in the webapp's brutalist style: mono HUD labels, 3 px toolbar pills, the round
//! generate button, popover menus and corner registration marks.

use std::sync::Arc;

use egui::{Align2, Color32, CornerRadius, FontId, Frame, Galley, Margin, Painter, Rect, Response, Sense, Stroke, Ui, pos2, vec2};

use crate::i18n;
use crate::theme;
use crate::ui::icons::{self, Icon};

/// `text` laid out upper case in `family`, `spacing` points between letters.
pub fn caps(ui: &Ui, text: &str, size: f32, family: egui::FontFamily, spacing: f32, color: Color32) -> Arc<Galley> {
  let extra_letter_spacing = if i18n::is_rtl() { 0.0 } else { spacing };
  let format = egui::TextFormat { font_id: FontId::new(size, family), color, extra_letter_spacing, ..Default::default() };
  ui.painter().layout_job(egui::text::LayoutJob::single_section(text.to_uppercase(), format))
}

/// A `.hud-label`: 11 px Geist Mono, upper case, widely spaced.
pub fn hud(ui: &mut Ui, text: &str, color: Color32) -> Response {
  let galley = caps(ui, text, theme::HUD_SIZE, theme::mono(), theme::HUD_SPACING, color);
  let (rect, resp) = ui.allocate_exact_size(galley.size(), Sense::hover());
  ui.painter().galley(rect.min, galley, color);
  let accessible = i18n::logical_of(text).to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Label, true, accessible.clone()));
  resp
}

/// A sidebar section or menu heading: 11 px Geist Mono 600, upper case.
pub fn section_label(ui: &mut Ui, text: &str, color: Color32) -> Response {
  let galley = caps(ui, text, theme::HUD_SIZE, theme::mono_bold(), theme::LABEL_SPACING, color);
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), 32.0), Sense::hover());
  let x = if i18n::is_rtl() { rect.right() - 8.0 - galley.size().x } else { rect.left() + 8.0 };
  let pos = pos2(x, rect.center().y - galley.size().y / 2.0);
  ui.painter().galley(pos, galley, color);
  resp
}

/// A small badge after a sidebar link ("BETA", "NEW"): 9 px mono in `color` on a tinted chip.
pub fn badge(painter: &Painter, ui: &Ui, edge_center: egui::Pos2, text: &str, color: Color32) {
  let galley = caps(ui, text, 9.0, theme::mono_bold(), 0.9, color);
  let size = galley.size() + vec2(10.0, 4.0);
  let left = if i18n::is_rtl() { edge_center.x } else { edge_center.x - size.x };
  let rect = Rect::from_min_size(pos2(left, edge_center.y - size.y / 2.0), size);
  painter.rect(rect, CornerRadius::same(2), theme::fade(color, 0.12), Stroke::new(1.0, theme::fade(color, 0.4)), egui::StrokeKind::Inside);
  painter.galley(rect.center() - galley.size() / 2.0, galley, color);
}

/// What a [`pill`] shows before its label.
pub enum Leading<'a> {
  None,
  Icon(Icon),
  /// An aspect ratio outline (`None` = the dashed "auto" frame).
  Aspect(Option<(f32, f32)>),
  /// A small caption in front of the label ("SD", "HD").
  Caption(&'a str),
  /// A model maker's logo.
  Logo(&'a egui::TextureHandle),
}

/// A toolbar pill (`bg-ui-controls border-white/15 rounded-[3px] px-3 py-1.5 text-sm font-medium`),
/// as used for the model, aspect ratio, resolution and duration pickers.
pub fn pill(ui: &mut Ui, leading: Leading<'_>, label: &str, open: bool) -> Response {
  let enabled = ui.is_enabled();
  let rtl = i18n::is_rtl();
  let font = FontId::new(14.0, theme::medium());
  let galley = ui.painter().layout_no_wrap(label.to_owned(), font, theme::INK);
  let caption = match leading {
    Leading::Caption(c) => Some(caps(ui, c, 9.0, theme::mono_bold(), 0.6, theme::DIM)),
    _ => None,
  };
  let lead_w = match (&leading, &caption) {
    (Leading::None, _) => 0.0,
    (_, Some(c)) => c.size().x + 6.0,
    _ => 14.0 + 7.0,
  };
  let size = vec2(12.0 + lead_w + galley.size().x + 12.0, theme::CONTROL_H);
  let (rect, resp) = ui.allocate_exact_size(size, Sense::click());
  let hovered = resp.hovered() && enabled;
  let p = ui.painter();
  let fill = if open || hovered { blend(theme::CONTROLS, theme::WASH_HOVER) } else { theme::CONTROLS };
  let stroke = if open { theme::LINE_STRONG } else { theme::LINE };
  p.rect(rect, theme::RADIUS, fill, Stroke::new(1.0, stroke), egui::StrokeKind::Inside);
  let ink = if enabled { theme::INK } else { theme::FAINT };
  let (lead_cx, galley_x) = if rtl {
    let lead_cx = rect.right() - 12.0 - 7.0;
    let galley_x = rect.left() + 12.0;
    (lead_cx, galley_x)
  } else {
    let x = rect.left() + 12.0;
    (x + 7.0, x + lead_w)
  };
  let lead_rect = Rect::from_center_size(pos2(lead_cx, rect.center().y), vec2(14.0, 14.0));
  match leading {
    Leading::None => {},
    Leading::Icon(icon) => icons::paint(p, lead_rect, icon, ink),
    Leading::Aspect(ratio) => icons::paint_aspect(p, lead_rect, ratio, ink),
    Leading::Logo(texture) => {
      egui::Image::new(texture).tint(ink).paint_at(ui, lead_rect);
    },
    Leading::Caption(_) => {
      if let Some(c) = caption {
        let cx = if rtl { rect.right() - 12.0 - c.size().x } else { rect.left() + 12.0 };
        p.galley(pos2(cx, rect.center().y - c.size().y / 2.0), c, theme::DIM);
      }
    },
  }
  p.galley_with_override_text_color(pos2(galley_x, rect.center().y - galley.size().y / 2.0), galley, ink);
  let accessible = i18n::logical_of(label).to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, enabled, accessible.clone()));
  if enabled {
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
  } else {
    resp
  }
}

/// A transparent toolbar button with an icon and an optional trailing label
/// (`text-base-fg/50`, `hover:bg-white/5`): the count picker and clear-all.
pub fn ghost(ui: &mut Ui, icon: Icon, label: Option<&str>, tip: &str, active: bool) -> Response {
  let enabled = ui.is_enabled();
  let rtl = i18n::is_rtl();
  let galley = label.map(|l| ui.painter().layout_no_wrap(l.to_owned(), FontId::new(14.0, theme::medium()), theme::INK));
  let w = match &galley {
    Some(g) => 10.0 + 15.0 + 6.0 + g.size().x + 10.0,
    None => 36.0,
  };
  let (rect, resp) = ui.allocate_exact_size(vec2(w, 36.0), Sense::click());
  let hovered = resp.hovered() && enabled;
  let p = ui.painter();
  if hovered || active {
    p.rect_filled(rect, theme::RADIUS, theme::WASH);
  }
  let ink = match (enabled, hovered || active) {
    (false, _) => theme::fade(theme::DIM, 0.5),
    (true, true) => theme::INK,
    (true, false) => theme::DIM,
  };
  match galley {
    Some(g) => {
      let (icon_rect, text_x) = if rtl {
        let ir = Rect::from_center_size(pos2(rect.right() - 10.0 - 7.5, rect.center().y), vec2(15.0, 15.0));
        (ir, rect.left() + 10.0)
      } else {
        let ir = Rect::from_center_size(pos2(rect.left() + 10.0 + 7.5, rect.center().y), vec2(15.0, 15.0));
        (ir, ir.right() + 6.0)
      };
      icons::paint(p, icon_rect, icon, ink);
      p.galley_with_override_text_color(pos2(text_x, rect.center().y - g.size().y / 2.0), g, ink);
    },
    None => icons::paint(p, Rect::from_center_size(rect.center(), vec2(16.0, 16.0)), icon, ink),
  }
  let accessible = i18n::logical_of(tip).to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, enabled, accessible.clone()));
  let resp = resp.on_hover_text(tip);
  if enabled {
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
  } else {
    resp
  }
}

/// A small square icon button for overlays (`h-7 w-7`, `hover:bg-white/15`).
pub fn overlay_icon(ui: &mut Ui, icon: Icon, tip: &str) -> Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(28.0, 28.0), Sense::click());
  let hovered = resp.hovered();
  if hovered {
    ui.painter().rect_filled(rect, theme::RADIUS, Color32::from_white_alpha(38));
  }
  let ink = if hovered { Color32::WHITE } else { Color32::from_white_alpha(217) };
  icons::paint(ui.painter(), Rect::from_center_size(rect.center(), vec2(14.0, 14.0)), icon, ink);
  let accessible = i18n::logical_of(tip).to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, true, accessible.clone()));
  resp.on_hover_text(tip).on_hover_cursor(egui::CursorIcon::PointingHand)
}

/// The round blue generate button (`GenerateIconButton`): an up arrow, a spinner while `loading`.
pub fn generate_button(ui: &mut Ui, enabled: bool, loading: bool, tip: &str) -> Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(36.0, 36.0), if enabled { Sense::click() } else { Sense::hover() });
  let hovered = resp.hovered() && enabled;
  let fill = match (enabled, hovered) {
    (false, _) => theme::fade(theme::ACCENT, 0.4),
    (true, true) => theme::ACCENT_400,
    (true, false) => theme::ACCENT,
  };
  ui.painter().circle_filled(rect.center(), 18.0, fill);
  let ink = if enabled { Color32::WHITE } else { theme::fade(Color32::WHITE, 0.5) };
  let inner = Rect::from_center_size(rect.center(), vec2(18.0, 18.0));
  if loading {
    icons::paint_spinner(ui, inner, ink);
  } else {
    icons::paint(ui.painter(), inner, Icon::ArrowUp, ink);
  }
  let accessible = i18n::tl("Generate").to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, enabled, accessible.clone()));
  let resp = resp.on_hover_text(tip);
  if enabled {
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
  } else {
    resp
  }
}

/// Which of the site's block button variants.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Kind {
  /// A white block with near-black text; fades a little on hover.
  Primary,
  /// Outlined in `base-fg/40`; inverts on hover.
  Secondary,
  /// The brand blue.
  Accent,
  /// Solid red.
  Danger,
}

/// A block button with a mono upper-case label (`SIGN UP TO CREATE`, `DOWNLOAD`), at least `width`
/// wide and `height` tall.
pub fn button(ui: &mut Ui, icon: Option<Icon>, text: &str, kind: Kind, width: f32, height: f32) -> Response {
  let enabled = ui.is_enabled();
  let galley = caps(ui, text, theme::HUD_SIZE, theme::mono_bold(), theme::LABEL_SPACING, theme::INK);
  let icon_w = if icon.is_some() { 13.0 + 8.0 } else { 0.0 };
  let size = vec2((galley.size().x + icon_w + 40.0).max(width), height);
  let (rect, resp) = ui.allocate_exact_size(size, Sense::click());
  let hovered = resp.hovered() && enabled;
  let (fill, stroke, ink) = match kind {
    Kind::Primary => (theme::fade(theme::INVERT_BG, if hovered { 0.88 } else { 1.0 }), Stroke::NONE, theme::INVERT_FG),
    Kind::Accent => (if hovered { theme::ACCENT_400 } else { theme::ACCENT }, Stroke::NONE, Color32::WHITE),
    Kind::Danger => (theme::fade(theme::DANGER, if hovered { 0.85 } else { 1.0 }), Stroke::NONE, Color32::WHITE),
    Kind::Secondary if hovered => (theme::INVERT_BG, Stroke::NONE, theme::INVERT_FG),
    Kind::Secondary => (Color32::TRANSPARENT, Stroke::new(1.0, theme::LINE_STRONG), theme::INK),
  };
  let dim = |c: Color32| if enabled { c } else { theme::fade(c, 0.5) };
  let p = ui.painter();
  p.rect(rect, theme::RADIUS, dim(fill), Stroke::new(stroke.width, dim(stroke.color)), egui::StrokeKind::Inside);
  let content_w = icon_w + galley.size().x;
  let mut x = rect.center().x - content_w / 2.0;
  if i18n::is_rtl() {
    p.galley_with_override_text_color(pos2(x, rect.center().y - galley.size().y / 2.0), galley, dim(ink));
    if let Some(icon) = icon {
      icons::paint(p, Rect::from_center_size(pos2(rect.center().x + content_w / 2.0 - 6.5, rect.center().y), vec2(13.0, 13.0)), icon, dim(ink));
    }
  } else {
    if let Some(icon) = icon {
      icons::paint(p, Rect::from_center_size(pos2(x + 6.5, rect.center().y), vec2(13.0, 13.0)), icon, dim(ink));
      x += icon_w;
    }
    p.galley_with_override_text_color(pos2(x, rect.center().y - galley.size().y / 2.0), galley, dim(ink));
  }
  let accessible = i18n::logical_of(text).to_owned();
  resp.widget_info(move || egui::WidgetInfo::labeled(egui::WidgetType::Button, enabled, accessible.clone()));
  if enabled {
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
  } else {
    resp
  }
}

/// Fine registration marks at a panel's corners (the landing page's section corners).
pub fn corner_marks(painter: &Painter, rect: Rect) {
  let stroke = Stroke::new(1.0, theme::LINE_STRONG);
  for c in [rect.left_top(), rect.right_top(), rect.left_bottom(), rect.right_bottom()] {
    painter.hline(c.x - 5.5..=c.x + 5.5, c.y, stroke);
    painter.vline(c.x, c.y - 5.5..=c.y + 5.5, stroke);
  }
}

/// The frame of popovers and menus: the controls surface, a hairline and a soft shadow.
pub fn popover_frame() -> Frame {
  Frame::new().fill(theme::CONTROLS).stroke(theme::hairline()).corner_radius(theme::RADIUS).shadow(theme::shadow()).inner_margin(Margin::same(4))
}

/// A popover's heading ("SELECT MODEL", "ASPECT RATIO") with a hairline under it.
pub fn menu_header(ui: &mut Ui, text: &str) {
  let galley = caps(ui, text, theme::HUD_SIZE, theme::mono_bold(), theme::LABEL_SPACING, theme::fade(theme::INK, 0.5));
  let (rect, _) = ui.allocate_exact_size(vec2(ui.available_width(), 28.0), Sense::hover());
  let x = if i18n::is_rtl() { rect.right() - 8.0 - galley.size().x } else { rect.left() + 8.0 };
  ui.painter().galley(pos2(x, rect.center().y - galley.size().y / 2.0), galley, theme::INK);
}

/// What a [`menu_row`] shows at its left.
pub enum RowLead<'a> {
  None,
  Icon(Icon),
  Aspect(Option<(f32, f32)>),
  /// A 36 px tile with a model maker's logo (white texture, tinted).
  Logo(&'a egui::TextureHandle),
  /// A logo at icon size (the provider list).
  SmallLogo(&'a egui::TextureHandle),
}

/// One option in a popover: a lead, a title, an optional muted subtitle, and a check when
/// `selected` (or a chevron when `submenu`). Highlights on hover or when `highlighted`.
pub fn menu_row(ui: &mut Ui, lead: RowLead<'_>, title: &str, subtitle: Option<&str>, selected: bool, submenu: bool, highlighted: bool) -> Response {
  let enabled = ui.is_enabled();
  let rtl = i18n::is_rtl();
  let h = if subtitle.is_some() { 48.0 } else { 34.0 };
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), h), Sense::click());
  let on = (resp.hovered() && enabled) || highlighted;
  let p = ui.painter();
  if on {
    p.rect_filled(rect, theme::RADIUS, theme::WASH_HOVER);
  }
  let ink = if enabled { theme::INK } else { theme::FAINT };
  let lead_step = match lead {
    RowLead::None => 0.0,
    RowLead::Logo(_) => 46.0,
    _ => 26.0,
  };
  let lead_anchor = if rtl { rect.right() - 8.0 } else { rect.left() + 8.0 };
  match lead {
    RowLead::None => {},
    RowLead::Icon(icon) => {
      let cx = if rtl { lead_anchor - 8.0 } else { lead_anchor + 8.0 };
      icons::paint(p, Rect::from_center_size(pos2(cx, rect.center().y), vec2(15.0, 15.0)), icon, ink);
    },
    RowLead::Aspect(ratio) => {
      let cx = if rtl { lead_anchor - 8.0 } else { lead_anchor + 8.0 };
      icons::paint_aspect(p, Rect::from_center_size(pos2(cx, rect.center().y), vec2(16.0, 16.0)), ratio, ink);
    },
    RowLead::Logo(texture) => {
      let cx = if rtl { lead_anchor - 18.0 } else { lead_anchor + 18.0 };
      let tile = Rect::from_center_size(pos2(cx, rect.center().y), vec2(36.0, 36.0));
      let (fill, border) = if selected { (theme::WASH_HOVER, Color32::WHITE) } else { (theme::WASH, theme::LINE) };
      p.rect(tile, theme::RADIUS, fill, Stroke::new(1.0, border), egui::StrokeKind::Inside);
      egui::Image::new(texture).tint(ink).paint_at(ui, Rect::from_center_size(tile.center(), vec2(18.0, 18.0)));
    },
    RowLead::SmallLogo(texture) => {
      let cx = if rtl { lead_anchor - 8.0 } else { lead_anchor + 8.0 };
      egui::Image::new(texture).tint(ink).paint_at(ui, Rect::from_center_size(pos2(cx, rect.center().y), vec2(15.0, 15.0)));
    },
  }
  let text_x = if rtl { lead_anchor - lead_step } else { lead_anchor + lead_step };
  let align = if rtl { Align2::RIGHT_CENTER } else { Align2::LEFT_CENTER };
  let title_font = FontId::new(13.5, theme::medium());
  match subtitle {
    Some(sub) => {
      p.text(pos2(text_x, rect.center().y - 8.0), align, title, title_font, ink);
      p.text(pos2(text_x, rect.center().y + 8.0), align, sub, FontId::new(11.5, egui::FontFamily::Proportional), theme::MUTED);
    },
    None => {
      p.text(pos2(text_x, rect.center().y), align, title, title_font, ink);
    },
  }
  let trail_x = if rtl { rect.left() + 14.0 } else { rect.right() - 14.0 };
  let trail = Rect::from_center_size(pos2(trail_x, rect.center().y), vec2(13.0, 13.0));
  if selected {
    icons::paint(p, trail, Icon::Check, theme::INK);
  } else if submenu {
    icons::paint(p, trail, if rtl { Icon::ChevronLeft } else { Icon::ChevronRight }, theme::DIM);
  }
  let accessible = i18n::logical_of(title).to_owned();
  resp.widget_info(move || egui::WidgetInfo::selected(egui::WidgetType::Button, enabled, selected, accessible.clone()));
  if enabled {
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
  } else {
    resp
  }
}

/// Paints `fg` over `bg` (for hover fills on opaque surfaces).
pub fn blend(bg: Color32, fg: Color32) -> Color32 {
  let a = fg.a() as f32 / 255.0;
  let mix = |b: u8, f: u8| (b as f32 * (1.0 - a) + f as f32 * a).round() as u8;
  let fg = fg.to_srgba_unmultiplied();
  Color32::from_rgb(mix(bg.r(), fg[0]), mix(bg.g(), fg[1]), mix(bg.b(), fg[2]))
}

/// A thin square progress bar (`h-1 bg-white/10`, filled in `primary-400`).
pub fn progress_bar(painter: &Painter, rect: Rect, fraction: f32) {
  painter.rect_filled(rect, CornerRadius::same(2), theme::WASH_HOVER);
  let fill = Rect::from_min_size(rect.min, vec2(rect.width() * fraction.clamp(0.0, 1.0), rect.height()));
  painter.rect_filled(fill, CornerRadius::same(2), theme::ACCENT_400);
}

/// A heading in the display face (Archivo 620, tracked in like the site's `tracking-[-0.03em]`).
pub fn heading(text: &str, size: f32) -> egui::RichText {
  egui::RichText::new(text).size(size).family(theme::display()).color(theme::INK).extra_letter_spacing(-0.03 * size)
}

/// A square modal on the panel surface with a dimmed backdrop. Returns whether it asked to close
/// (backdrop click or Escape).
pub fn modal(ctx: &egui::Context, id: egui::Id, width: f32, content: impl FnOnce(&mut Ui)) -> bool {
  let frame = Frame::new().fill(theme::PANEL).stroke(theme::hairline()).inner_margin(Margin::same(16)).shadow(theme::shadow());
  let resp = egui::Modal::new(id).frame(frame).backdrop_color(Color32::from_black_alpha(153)).show(ctx, |ui| {
    ui.set_width(width.min(ctx.content_rect().width() - 48.0));
    content(ui);
  });
  resp.should_close()
}

/// A mono link with an ↗: muted, brighter on hover. Opens `url` in the browser.
pub fn hud_link(ui: &mut Ui, text: &str, url: &str) -> Response {
  let galley = caps(ui, &format!("{text} \u{2197}"), theme::HUD_SIZE, theme::mono(), theme::HUD_SPACING, theme::MUTED);
  let (rect, resp) = ui.allocate_exact_size(galley.size(), Sense::click());
  let color = if resp.hovered() { theme::INK_STRONG } else { theme::MUTED };
  ui.painter().galley_with_override_text_color(rect.min, galley, color);
  let resp = resp.on_hover_text(url).on_hover_cursor(egui::CursorIcon::PointingHand);
  if resp.clicked() {
    ui.ctx().open_url(egui::OpenUrl::new_tab(url));
  }
  resp
}
