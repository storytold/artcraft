//! Toasts: brief success and error notes stacked at the top right (the webapp's `toast`).

use std::time::Duration;

use egui::{Align2, Color32, FontId, Id, Order, Rect, Sense, pos2, vec2};

use crate::theme;
use crate::ui::icons::{self, Icon};

const DEFAULT_DURATION: Duration = Duration::from_secs(4);
const MAX_WIDTH: f32 = 448.0;
/// Below the top bar, like the webapp's `top-16 right-5`.
const TOP_OFFSET: f32 = 64.0;
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
    for toast in &self.items {
      let area = egui::Area::new(Id::new(("toast", toast.id))).order(Order::Tooltip).pivot(Align2::RIGHT_TOP).fixed_pos(pos2(screen.right() - RIGHT_OFFSET, y)).interactable(true);
      let inner = area.show(ctx, |ui| {
        let galley = ui.painter().layout(toast.message.clone(), FontId::new(14.0, egui::FontFamily::Proportional), theme::fade(Color32::WHITE, 0.9), MAX_WIDTH - 80.0);
        let h = galley.size().y.max(24.0) + 20.0;
        let w = 16.0 + 24.0 + 12.0 + galley.size().x + 12.0 + 12.0 + 16.0;
        let (rect, _) = ui.allocate_exact_size(vec2(w, h), Sense::hover());
        let p = ui.painter();
        p.rect(rect, theme::RADIUS, theme::fade(theme::CONTROLS, 0.97), theme::hairline(), egui::StrokeKind::Inside);
        let badge = Rect::from_min_size(pos2(rect.left() + 16.0, rect.center().y - 12.0), vec2(24.0, 24.0));
        let (fill, icon) = match toast.kind {
          ToastKind::Success => (Color32::from_rgb(0x22, 0xc5, 0x5e), Icon::Check),
          ToastKind::Error => (Color32::from_rgb(0xef, 0x44, 0x44), Icon::AlertCircle),
        };
        p.rect_filled(badge, 0.0, fill);
        icons::paint(p, badge.shrink(6.0), icon, Color32::WHITE);
        p.galley(pos2(badge.right() + 12.0, rect.center().y - galley.size().y / 2.0), galley, Color32::WHITE);
        let close = Rect::from_center_size(pos2(rect.right() - 22.0, rect.center().y), vec2(16.0, 16.0));
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
