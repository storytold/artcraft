//! Window chrome for the undecorated window: dragging and maximizing from the title bar, the
//! Windows-style caption buttons, and resizing from the edges.

use egui::{Color32, Rect, Response, Sense, Stroke, Ui, vec2};

use crate::theme;

/// How far in from the window's edges a drag resizes. Title bar controls leave this band alone.
const RESIZE_EDGE: f32 = 5.0;
/// Caption buttons (Windows' own are 46 × the title bar height).
const BUTTON_WIDTH: f32 = 46.0;
/// The close button's hover red (Windows').
const CLOSE_RED: Color32 = Color32::from_rgb(0xc4, 0x2b, 0x1c);

/// Whether this platform draws its own title bar buttons (macOS keeps the traffic lights).
pub fn custom_caption_buttons() -> bool {
  !cfg!(target_os = "macos")
}

/// Space to leave at the title bar's left for macOS's traffic lights.
pub fn leading_inset() -> f32 {
  if cfg!(target_os = "macos") {
    76.0
  } else {
    0.0
  }
}

/// Dragging the title bar's empty space moves the window; double-clicking maximizes or restores.
/// Call before drawing the title bar's controls so they stay on top.
pub fn title_bar_drag(ui: &mut Ui) {
  let r = ui.max_rect();
  let rect = Rect::from_min_max(r.min + vec2(RESIZE_EDGE, RESIZE_EDGE), r.max - vec2(RESIZE_EDGE, 0.0));
  let resp = ui.interact(rect, ui.id().with("title-bar-drag"), Sense::click_and_drag());
  if resp.drag_started_by(egui::PointerButton::Primary) {
    ui.ctx().send_viewport_cmd(egui::ViewportCommand::StartDrag);
  }
  if resp.double_clicked() {
    let maximized = ui.input(|i| i.viewport().maximized.unwrap_or(false));
    ui.ctx().send_viewport_cmd(egui::ViewportCommand::Maximized(!maximized));
  }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Caption {
  Minimize,
  Maximize,
  Restore,
  Close,
}

/// Minimize, maximize (or restore) and close, `height` tall, for a right-to-left layout so close
/// ends up at the right edge.
pub fn caption_buttons(ui: &mut Ui, height: f32) {
  let ctx = ui.ctx().clone();
  let maximized = ctx.input(|i| i.viewport().maximized.unwrap_or(false));
  if caption_button(ui, Caption::Close, height).clicked() {
    ctx.send_viewport_cmd(egui::ViewportCommand::Close);
  }
  let size = if maximized { Caption::Restore } else { Caption::Maximize };
  if caption_button(ui, size, height).clicked() {
    ctx.send_viewport_cmd(egui::ViewportCommand::Maximized(!maximized));
  }
  if caption_button(ui, Caption::Minimize, height).clicked() {
    ctx.send_viewport_cmd(egui::ViewportCommand::Minimized(true));
  }
}

fn caption_button(ui: &mut Ui, button: Caption, height: f32) -> Response {
  let (rect, _) = ui.allocate_exact_size(vec2(BUTTON_WIDTH, height), Sense::hover());
  // Clickable below the resize band along the top (and, for close, the right edge).
  let right = if button == Caption::Close { RESIZE_EDGE } else { 0.0 };
  let hit = Rect::from_min_max(rect.min + vec2(0.0, RESIZE_EDGE), rect.max - vec2(right, 0.0));
  let resp = ui.interact(hit, ui.id().with(("caption", button as u8)), Sense::click());
  let (fill, ink) = match (button, resp.hovered()) {
    (Caption::Close, true) => (CLOSE_RED, Color32::WHITE),
    (_, true) => (theme::WASH_HOVER, theme::INK_STRONG),
    (_, false) => (Color32::TRANSPARENT, theme::MUTED),
  };
  let p = ui.painter();
  p.rect_filled(rect, 0.0, fill);
  let c = rect.center();
  let stroke = Stroke::new(1.0, ink);
  // Half the glyph's size: 10 px, like Windows' own caption buttons.
  let s = 5.0;
  let label = match button {
    Caption::Minimize => {
      p.hline(c.x - s..=c.x + s, c.y, stroke);
      "Minimize"
    },
    Caption::Maximize => {
      p.rect_stroke(Rect::from_center_size(c, vec2(2.0 * s, 2.0 * s)), 0.0, stroke, egui::StrokeKind::Inside);
      "Maximize"
    },
    Caption::Restore => {
      // A window in front of another.
      let front = Rect::from_min_size(c + vec2(-s, -s + 2.0), vec2(2.0 * s - 2.0, 2.0 * s - 2.0));
      p.rect_stroke(front, 0.0, stroke, egui::StrokeKind::Inside);
      p.hline(c.x - s + 2.0..=c.x + s, c.y - s, stroke);
      p.vline(c.x + s, c.y - s..=c.y + s - 2.0, stroke);
      "Restore"
    },
    Caption::Close => {
      p.line_segment([c + vec2(-s, -s), c + vec2(s, s)], stroke);
      p.line_segment([c + vec2(-s, s), c + vec2(s, -s)], stroke);
      "Close"
    },
  };
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, label));
  resp.on_hover_text(label)
}

/// A hairline round the window, and resizing from its edges and corners (when not maximized).
pub fn window_edges(ctx: &egui::Context) {
  use egui::CursorIcon as C;
  use egui::viewport::ResizeDirection as D;
  let (maximized, fullscreen) = ctx.input(|i| (i.viewport().maximized.unwrap_or(false), i.viewport().fullscreen.unwrap_or(false)));
  if maximized || fullscreen || !custom_caption_buttons() {
    return;
  }
  let r = ctx.content_rect();
  ctx.layer_painter(egui::LayerId::new(egui::Order::Foreground, egui::Id::new("window-border"))).rect_stroke(r, 0.0, theme::hairline(), egui::StrokeKind::Inside);
  let Some(p) = ctx.input(|i| i.pointer.hover_pos()).filter(|p| r.contains(*p)) else {
    return;
  };
  let near = |d: f32| d < RESIZE_EDGE;
  // A corner takes a little of each edge next to it.
  let corner = |d: f32| d < 3.0 * RESIZE_EDGE;
  let (left, right, top, bottom) = (p.x - r.left(), r.right() - p.x, p.y - r.top(), r.bottom() - p.y);
  let hit = if (near(top) && corner(left)) || (near(left) && corner(top)) {
    Some((D::NorthWest, C::ResizeNorthWest))
  } else if (near(top) && corner(right)) || (near(right) && corner(top)) {
    Some((D::NorthEast, C::ResizeNorthEast))
  } else if (near(bottom) && corner(left)) || (near(left) && corner(bottom)) {
    Some((D::SouthWest, C::ResizeSouthWest))
  } else if (near(bottom) && corner(right)) || (near(right) && corner(bottom)) {
    Some((D::SouthEast, C::ResizeSouthEast))
  } else if near(top) {
    Some((D::North, C::ResizeNorth))
  } else if near(bottom) {
    Some((D::South, C::ResizeSouth))
  } else if near(left) {
    Some((D::West, C::ResizeWest))
  } else if near(right) {
    Some((D::East, C::ResizeEast))
  } else {
    None
  };
  if let Some((direction, cursor)) = hit {
    ctx.set_cursor_icon(cursor);
    if ctx.input(|i| i.pointer.primary_pressed()) {
      ctx.send_viewport_cmd(egui::ViewportCommand::BeginResize(direction));
    }
  }
}
