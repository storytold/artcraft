//! Toasts: brief success and error notes stacked at the top right (the webapp's `toast`).

use std::time::Duration;

use egui::{Align2, Color32, FontId, Id, Order, Rect, Sense, pos2, vec2};

use crate::{i18n, theme};
use crate::ui::icons::{self, Icon};

const DEFAULT_DURATION: Duration = Duration::from_secs(4);
const MAX_WIDTH: f32 = 448.0;
/// Below the title bar and the panel header (the webapp's `top-16 right-5`, shifted).
const TOP_OFFSET: f32 = 100.0;
const RIGHT_OFFSET: f32 = 20.0;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ToastKind {
  Success,
  Error,
}

struct Toast {
  id: u64,
  kind: ToastKind,
  message: String,
  expires_at: f64,
}

#[derive(Default)]
pub struct Toasts {
  next_id: u64,
  items: Vec<Toast>,
  pending: Vec<(ToastKind, String)>,
}

impl Toasts {
  pub fn success(&mut self, message: impl Into<String>) {
    self.pending.push((ToastKind::Success, message.into()));
  }

  pub fn error(&mut self, message: impl Into<String>) {
    self.pending.push((ToastKind::Error, message.into()));
  }

  /// Draws the stack over everything else and drops expired toasts.
  pub fn show(&mut self, ctx: &egui::Context) {
    let now = ctx.input(|i| i.time);
    for (kind, message) in self.pending.drain(..) {
      // The same message twice in a row (e.g. a held Enter key) shows once, with a fresh timer.
      self.items.retain(|t| !(t.kind == kind && t.message == message));
      self.next_id += 1;
      self.items.push(Toast { id: self.next_id, kind, message, expires_at: now + DEFAULT_DURATION.as_secs_f64() });
    }
    self.items.retain(|t| t.expires_at > now);
    if self.items.is_empty() {
      return;
    }
    let screen = ctx.content_rect();
    let mut y = screen.top() + TOP_OFFSET;
    let mut dismissed = None;
    let rtl = i18n::is_rtl();
    let (pivot, anchor_x) = if rtl { (Align2::LEFT_TOP, screen.left() + RIGHT_OFFSET) } else { (Align2::RIGHT_TOP, screen.right() - RIGHT_OFFSET) };
    for toast in &self.items {
      let area = egui::Area::new(Id::new(("toast", toast.id))).order(Order::Tooltip).pivot(pivot).fixed_pos(pos2(anchor_x, y)).interactable(true);
      let inner = area.show(ctx, |ui| {
        let font_id = FontId::new(14.0, egui::FontFamily::Proportional);
        let color = theme::fade(Color32::WHITE, 0.9);
        let wrap_w = MAX_WIDTH - 80.0;
        let galley = if rtl && i18n::has_rtl_script(&toast.message) {
          let wrapped = i18n::wrapped_visual_lines(ctx, i18n::current(), &toast.message, &font_id, wrap_w);
          ui.painter().layout_no_wrap(wrapped, font_id, color)
        } else {
          ui.painter().layout(toast.message.clone(), font_id, color, wrap_w)
        };
        let h = galley.size().y.max(24.0) + 20.0;
        let w = 16.0 + 24.0 + 12.0 + galley.size().x + 12.0 + 12.0 + 16.0;
        let (rect, _) = ui.allocate_exact_size(vec2(w, h), Sense::hover());
        let p = ui.painter();
        p.rect(rect, theme::RADIUS, theme::fade(theme::CONTROLS, 0.97), theme::hairline(), egui::StrokeKind::Inside);
        let badge = if rtl { Rect::from_min_size(pos2(rect.right() - 16.0 - 24.0, rect.center().y - 12.0), vec2(24.0, 24.0)) } else { Rect::from_min_size(pos2(rect.left() + 16.0, rect.center().y - 12.0), vec2(24.0, 24.0)) };
        let (fill, icon) = match toast.kind {
          ToastKind::Success => (Color32::from_rgb(0x22, 0xc5, 0x5e), Icon::Check),
          ToastKind::Error => (Color32::from_rgb(0xef, 0x44, 0x44), Icon::AlertCircle),
        };
        p.rect_filled(badge, 0.0, fill);
        icons::paint(p, badge.shrink(6.0), icon, Color32::WHITE);
        let text_x = if rtl { badge.left() - 12.0 - galley.size().x } else { badge.right() + 12.0 };
        p.galley(pos2(text_x, rect.center().y - galley.size().y / 2.0), galley, Color32::WHITE);
        let close_x = if rtl { rect.left() + 22.0 } else { rect.right() - 22.0 };
        let close = Rect::from_center_size(pos2(close_x, rect.center().y), vec2(16.0, 16.0));
        let close_resp = ui.interact(close, Id::new(("toast-close", toast.id)), Sense::click());
        let ink = if close_resp.hovered() { theme::fade(Color32::WHITE, 0.8) } else { theme::fade(Color32::WHITE, 0.4) };
        icons::paint(p, close.shrink(2.0), Icon::X, ink);
        close_resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
      });
      if inner.inner {
        dismissed = Some(toast.id);
      }
      y += inner.response.rect.height() + 8.0;
    }
    if let Some(id) = dismissed {
      self.items.retain(|t| t.id != id);
    }
    // Wake up to expire the oldest toast on time.
    if let Some(next) = self.items.iter().map(|t| t.expires_at).reduce(f64::min) {
      ctx.request_repaint_after(Duration::from_secs_f64((next - now).max(0.0)));
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn rtl_toast_wraps_logical_summary_before_visual_reordering() {
    let ctx = egui::Context::default();
    crate::theme::apply(&ctx);
    let before = i18n::current();
    i18n::set_current(i18n::Lang::Hebrew);
    let logical = i18n::fmt_logical("Couldn't load models: {message}", &[("message", "upstream connection timed out after waiting for model catalog response from remote gateway endpoint")]);
    let mut rendered = String::new();
    let mut out = ctx.run_ui(egui::RawInput::default(), |ui| {
      let font_id = FontId::new(14.0, egui::FontFamily::Proportional);
      rendered = i18n::wrapped_visual_lines(ui.ctx(), i18n::current(), &logical, &font_id, MAX_WIDTH - 80.0);
    });
    out.textures_delta.clear();
    i18n::set_current(before);
    let lines: Vec<&str> = rendered.lines().collect();
    assert!(lines.len() >= 2, "expected long diagnostic toast to wrap: {rendered:?}");
    let visual_summary = i18n::visual_rtl("לא ניתן לטעון מודלים");
    assert!(lines[0].contains(&visual_summary), "expected Hebrew summary ({visual_summary:?}) on first wrapped row, got {lines:?}");
  }
}
