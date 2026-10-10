//! The reference widgets left of the prompt: the fanned reference deck (images, videos, audio)
//! and the tilted first/last keyframe slots.

use egui::emath::Rot2;
use egui::load::SizedTexture;
use egui::{Align2, Color32, CornerRadius, FontId, Id, Order, Pos2, Rect, Response, Sense, Shape, Stroke, Ui, Vec2, pos2, vec2};

use crate::backend::media_cache::{Lookup, MediaCache};
use crate::prompt_box::refs::{ImageSlot, RefKind, RefMedia, RefStatus, References};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

/// `w-14`.
const CARD: f32 = 56.0;
/// Rotations of the collapsed fan's cards (`FAN_TRANSFORMS`), with their x offsets.
const FAN: [(f32, f32); 3] = [(-8.0, 0.0), (2.0, 12.0), (9.0, 24.0)];
const OPEN_DELAY: f64 = 0.17;
const CLOSE_DELAY: f64 = 0.15;
const MENU_DELAY: f64 = 0.1;

/// Something the user asked the deck to do; the prompt box carries it out.
#[derive(Clone, Debug, PartialEq)]
pub enum DeckAction {
  /// Open the file picker for these kinds into `slot` (images only use the slot).
  Upload {
    kinds: Vec<RefKind>,
    slot: ImageSlot,
  },
  /// Open the library picker for `kind` into `slot`.
  Library {
    kind: RefKind,
    slot: ImageSlot,
  },
  Remove(u64),
  ClearAll,
  ReorderImages {
    from: usize,
    to: usize,
  },
  Preview(u64),
  SwapFrames,
}

/// What the deck may offer, from the model's limits.
#[derive(Clone, Debug)]
pub struct DeckLimits {
  pub max_images: usize,
  pub max_videos: usize,
  pub max_video_secs: Option<f32>,
  pub max_audios: usize,
  pub max_audio_secs: Option<f32>,
  /// Whether "From library" is offered (always, once signed in).
  pub library: bool,
}

impl DeckLimits {
  fn kinds(&self) -> Vec<RefKind> {
    [(RefKind::Image, self.max_images), (RefKind::Video, self.max_videos), (RefKind::Audio, self.max_audios)].into_iter().filter(|(_, max)| *max > 0).map(|(k, _)| k).collect()
  }

  fn max(&self, kind: RefKind) -> usize {
    match kind {
      RefKind::Image => self.max_images,
      RefKind::Video => self.max_videos,
      RefKind::Audio => self.max_audios,
    }
  }

  fn max_secs(&self, kind: RefKind) -> Option<f32> {
    match kind {
      RefKind::Image => None,
      RefKind::Video => self.max_video_secs,
      RefKind::Audio => self.max_audio_secs,
    }
  }
}

/// The fanned reference deck. Returns the user's actions this frame.
pub fn reference_deck(ui: &mut Ui, id: Id, refs: &References, limits: &DeckLimits, cache: &mut MediaCache, always_expanded: bool) -> Vec<DeckAction> {
  let mut actions = Vec::new();
  let items: Vec<&RefMedia> = refs.images.iter().chain(&refs.videos).chain(&refs.audios).collect();
  let open_kinds: Vec<RefKind> = limits.kinds().into_iter().filter(|k| refs.list(*k).len() < limits.max(*k)).collect();
  if items.is_empty() && open_kinds.is_empty() {
    return actions;
  }
  let menu = add_menu_entries(refs, limits, &open_kinds, ImageSlot::Reference);

  if always_expanded {
    expanded_panel(ui, id, refs, &items, &open_kinds, &menu, cache, &mut actions);
    return actions;
  }

  if items.is_empty() {
    let resp = add_tile(ui, id.with("empty"), "Reference", -6.0);
    if resp.clicked() {
      actions.push(DeckAction::Upload { kinds: open_kinds.clone(), slot: ImageSlot::Reference });
    }
    hover_menu(ui, id.with("empty-menu"), &resp, &menu, &mut actions);
    return actions;
  }

  // Collapsed fan: footprint tracks the card count plus the + button's overhang.
  let shown = items.len().min(3);
  let stack_w = (shown - 1) as f32 * 12.0 + CARD;
  let (rect, _) = ui.allocate_exact_size(vec2(stack_w + 12.0, CARD), Sense::hover());
  let stack = Rect::from_min_size(rect.min, vec2(stack_w, CARD));
  let expanded = hover_latch(ui, id.with("expand"), stack, OPEN_DELAY);
  let painter = ui.painter().clone();
  if !expanded.open {
    for (i, item) in items.iter().take(3).enumerate().rev() {
      let (deg, dx) = FAN[i];
      let card = Rect::from_min_size(stack.min + vec2(dx, 0.0), vec2(CARD, CARD));
      paint_card(ui, &painter, card, deg, item, cache, false);
    }
    if items.len() > 3 {
      let badge_text = items.len().to_string();
      let badge = Rect::from_center_size(pos2(stack.right() + 2.0, stack.top() + 2.0), vec2(8.0 + 7.0 * badge_text.len() as f32, 18.0));
      painter.rect_filled(badge, CornerRadius::same(9), theme::ACCENT);
      painter.text(badge.center(), Align2::CENTER_CENTER, badge_text, FontId::new(10.0, theme::semibold()), Color32::WHITE);
    }
    if !open_kinds.is_empty() {
      let plus = Rect::from_min_size(pos2(stack.right() - 12.0, stack.bottom() - 20.0), vec2(24.0, 24.0));
      let resp = ui.interact(plus, id.with("plus"), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
      let hovered = resp.hovered();
      painter.circle(plus.center(), if hovered { 13.0 } else { 12.0 }, widgets::blend(theme::CONTROLS, if hovered { theme::WASH_HOVER } else { Color32::TRANSPARENT }), Stroke::new(1.0, theme::LINE));
      icons::paint(&painter, plus.shrink(6.0), Icon::Plus, theme::INK);
      if resp.clicked() {
        actions.push(DeckAction::Upload { kinds: open_kinds.clone(), slot: ImageSlot::Reference });
      }
      hover_menu(ui, id.with("plus-menu"), &resp, &menu, &mut actions);
    }
  }
  if expanded.open {
    // The panel overlays the deck from its bottom-left corner, growing up and right.
    let area = egui::Area::new(id.with("panel")).order(Order::Foreground).pivot(Align2::LEFT_BOTTOM).fixed_pos(stack.left_bottom()).show(ui.ctx(), |ui| {
      widgets::popover_frame().inner_margin(8).show(ui, |ui| {
        ui.set_max_width(ui.ctx().content_rect().width() * 0.5);
        expanded_panel(ui, id, refs, &items, &open_kinds, &menu, cache, &mut actions);
      });
    });
    expanded.keep_open_while(ui, area.response.rect.union(stack));
  }
  actions
}

/// The first and last keyframe slots (the last only when `show_last`).
pub fn keyframe_cards(ui: &mut Ui, id: Id, refs: &References, show_last: bool, library: bool, cache: &mut MediaCache) -> Vec<DeckAction> {
  let mut actions = Vec::new();
  ui.horizontal(|ui| {
    ui.spacing_mut().item_spacing.x = 0.0;
    slot_card(ui, id.with("first"), refs.first_frame.as_ref(), "First frame", if show_last { -6.0 } else { 0.0 }, ImageSlot::FirstFrame, library, cache, &mut actions);
    if show_last {
      let both = refs.first_frame.is_some() && refs.last_frame.is_some();
      let (rect, _) = ui.allocate_exact_size(vec2(8.0, CARD), Sense::hover());
      let swap = Rect::from_center_size(rect.center() - vec2(0.0, 6.0), vec2(20.0, 20.0));
      let resp = ui.interact(swap, id.with("swap"), if both { Sense::click() } else { Sense::hover() });
      let hovered = resp.hovered() && both;
      let p = ui.painter();
      p.circle(
        swap.center(),
        if hovered { 11.0 } else { 10.0 },
        Color32::from_black_alpha(if hovered {
          204
        } else if both {
          153
        } else {
          102
        }),
        Stroke::new(1.0, theme::fade(Color32::WHITE, if both { 0.2 } else { 0.1 })),
      );
      icons::paint(p, swap.shrink(5.0), Icon::ArrowLeftRight, theme::fade(Color32::WHITE, if both { 1.0 } else { 0.5 }));
      if both && resp.on_hover_text("Swap frames").on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
        actions.push(DeckAction::SwapFrames);
      }
      slot_card(ui, id.with("last"), refs.last_frame.as_ref(), "Last frame", 6.0, ImageSlot::LastFrame, library, cache, &mut actions);
    }
  });
  actions
}

/// One labelled keyframe slot: a dashed add card, or the frame once set.
#[allow(clippy::too_many_arguments)]
fn slot_card(ui: &mut Ui, id: Id, item: Option<&RefMedia>, label: &str, tilt: f32, slot: ImageSlot, library: bool, cache: &mut MediaCache, actions: &mut Vec<DeckAction>) {
  ui.vertical(|ui| {
    ui.spacing_mut().item_spacing.y = 2.0;
    match item {
      Some(item) => {
        let (rect, resp) = ui.allocate_exact_size(vec2(CARD, CARD), Sense::click());
        let hovered = resp.hovered();
        let painter = ui.painter().clone();
        paint_card(ui, &painter, rect, if hovered { 0.0 } else { tilt }, item, cache, hovered);
        if item.status == RefStatus::Ready {
          if remove_button(ui, id.with("x"), rect, hovered) {
            actions.push(DeckAction::Remove(item.id));
          } else if resp.on_hover_cursor(egui::CursorIcon::ZoomIn).clicked() {
            actions.push(DeckAction::Preview(item.id));
          }
        }
        let (label_rect, _) = ui.allocate_exact_size(vec2(CARD, 10.0), Sense::hover());
        ui.painter().text(label_rect.center(), Align2::CENTER_CENTER, label, FontId::new(9.0, theme::medium()), theme::MUTED);
      },
      None => {
        let resp = add_tile(ui, id, label, tilt);
        if resp.clicked() {
          actions.push(DeckAction::Upload { kinds: vec![RefKind::Image], slot });
        }
        {
          let menu = vec![MenuGroup { kind: RefKind::Image, hint: None, slot, library }];
          hover_menu(ui, id.with("menu"), &resp, &menu, actions);
        }
      },
    }
  });
}

/// The expanded deck: a header with "Clear all", the cards (reorderable images) and a + tile.
#[allow(clippy::too_many_arguments)]
fn expanded_panel(ui: &mut Ui, id: Id, refs: &References, items: &[&RefMedia], open_kinds: &[RefKind], menu: &[MenuGroup], cache: &mut MediaCache, actions: &mut Vec<DeckAction>) {
  if items.len() > 1 {
    ui.horizontal(|ui| {
      let n = items.len();
      ui.label(egui::RichText::new(format!("{n} reference{}", if n == 1 { "" } else { "s" })).size(11.0).family(theme::medium()).color(theme::MUTED));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        let resp = ui.add(egui::Button::new(egui::RichText::new("Clear all").size(11.0)).frame(false));
        if resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked() {
          actions.push(DeckAction::ClearAll);
        }
      });
    });
  }
  let drag_id = id.with("dragging");
  let mut dragging: Option<usize> = ui.data(|d| d.get_temp(drag_id));
  let mut image_rects = Vec::with_capacity(refs.images.len());
  ui.horizontal_wrapped(|ui| {
    ui.spacing_mut().item_spacing = vec2(6.0, 6.0);
    for item in items {
      let (rect, resp) = ui.allocate_exact_size(vec2(CARD, CARD), Sense::click_and_drag());
      let hovered = resp.hovered();
      let painter = ui.painter().clone();
      let image_index = refs.images.iter().position(|r| r.id == item.id);
      if let Some(i) = image_index {
        image_rects.push((i, rect));
        if resp.drag_started() && refs.images.len() > 1 {
          dragging = Some(i);
        }
      }
      paint_card(ui, &painter, rect, 0.0, item, cache, hovered && dragging.is_none());
      if dragging.is_some() && dragging == image_index {
        painter.rect_filled(rect, theme::RADIUS, Color32::from_black_alpha(128));
      }
      if item.status == RefStatus::Ready && dragging.is_none() {
        if remove_button(ui, id.with(("x", item.id)), rect, hovered) {
          actions.push(DeckAction::Remove(item.id));
        } else if resp.clicked() {
          actions.push(DeckAction::Preview(item.id));
        }
      }
    }
    if !open_kinds.is_empty() {
      let (rect, resp) = ui.allocate_exact_size(vec2(CARD, CARD), Sense::click());
      paint_dashed_tile(ui.painter(), rect, 0.0, resp.hovered(), None);
      let resp = resp.on_hover_cursor(egui::CursorIcon::PointingHand);
      if resp.clicked() {
        actions.push(DeckAction::Upload { kinds: open_kinds.to_vec(), slot: ImageSlot::Reference });
      }
      hover_menu(ui, id.with("panel-menu"), &resp, menu, actions);
    }
  });
  // Drag to reorder images: drop onto another image's card.
  if let Some(from) = dragging {
    let released = ui.input(|i| i.pointer.any_released());
    if released {
      if let Some(pos) = ui.input(|i| i.pointer.interact_pos()) {
        if let Some((to, _)) = image_rects.iter().find(|(_, r)| r.contains(pos)) {
          if *to != from {
            actions.push(DeckAction::ReorderImages { from, to: *to });
          }
        }
      }
      dragging = None;
    } else {
      ui.ctx().set_cursor_icon(egui::CursorIcon::Grabbing);
    }
  }
  ui.data_mut(|d| match dragging {
    Some(i) => {
      d.insert_temp(drag_id, i);
    },
    None => d.remove::<usize>(drag_id),
  });
}

/// A 56 px card: the thumbnail (cover-fit), a kind badge for video/audio, a duration strip, and a
/// spinner while uploading. `tilt` is in degrees.
fn paint_card(ui: &Ui, painter: &egui::Painter, rect: Rect, tilt: f32, item: &RefMedia, cache: &mut MediaCache, hovered: bool) {
  let rot = Rot2::from_angle(tilt.to_radians());
  let corners = rotated_corners(rect, rot);
  painter.add(Shape::convex_polygon(corners.to_vec(), theme::fade(theme::CONTROLS, 0.95), Stroke::NONE));
  let texture = item.preview.as_deref().and_then(|key| match cache.get(ui.ctx(), key) {
    Lookup::Ready(t) => Some(t),
    _ => None,
  });
  match texture {
    Some(texture) => {
      let uv = cover_uv(texture.size_vec2());
      let image = egui::Image::from_texture(SizedTexture::from_handle(&texture)).uv(uv).rotate(rot.angle(), Vec2::splat(0.5));
      let image = if item.status == RefStatus::Uploading { image.tint(Color32::from_gray(140)) } else { image };
      image.paint_at(ui, rect.shrink(2.0));
    },
    None => {
      let icon = match item.kind {
        RefKind::Image => Icon::Image,
        RefKind::Video => Icon::Video,
        RefKind::Audio => Icon::Music,
      };
      icons::paint(painter, Rect::from_center_size(rect.center(), vec2(20.0, 20.0)), icon, theme::MUTED);
    },
  }
  if item.kind != RefKind::Image && tilt == 0.0 {
    let badge = Rect::from_min_size(rect.min + vec2(3.0, 3.0), vec2(16.0, 16.0));
    painter.rect_filled(badge, 0.0, Color32::from_black_alpha(153));
    icons::paint(painter, badge.shrink(3.0), if item.kind == RefKind::Video { Icon::Video } else { Icon::Music }, Color32::WHITE);
    if item.duration_secs > 0.0 {
      let strip = Rect::from_min_max(pos2(rect.left(), rect.bottom() - 14.0), rect.max);
      painter.rect_filled(strip, 0.0, Color32::from_black_alpha(178));
      painter.text(strip.center(), Align2::CENTER_CENTER, format!("{}s", item.duration_secs.round() as i64), FontId::new(10.0, theme::semibold()), Color32::WHITE);
    }
  }
  if item.status == RefStatus::Uploading {
    icons::paint_spinner(ui, Rect::from_center_size(rect.center(), vec2(24.0, 24.0)), Color32::WHITE);
  }
  let border = theme::fade(Color32::WHITE, if hovered { 0.8 } else { 0.3 });
  painter.add(Shape::closed_line(corners.to_vec(), Stroke::new(2.0, border)));
}

/// The hover-revealed round × in a card's top-right corner. Returns whether it was clicked.
fn remove_button(ui: &mut Ui, id: Id, card: Rect, card_hovered: bool) -> bool {
  let rect = Rect::from_min_size(pos2(card.right() - 22.0, card.top() + 2.0), vec2(20.0, 20.0));
  let resp = ui.interact(rect, id, Sense::click());
  if !(card_hovered || resp.hovered()) {
    return false;
  }
  let fill = if resp.hovered() { theme::fade(theme::DANGER, 0.7) } else { Color32::from_black_alpha(128) };
  ui.painter().circle_filled(rect.center(), 10.0, fill);
  icons::paint(ui.painter(), rect.shrink(5.0), Icon::X, Color32::WHITE);
  resp.on_hover_text("Remove").on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}

/// The dashed "+" card that adds a reference (straightens and grows on hover).
fn add_tile(ui: &mut Ui, id: Id, label: &str, tilt: f32) -> Response {
  let (rect, _) = ui.allocate_exact_size(vec2(CARD, CARD), Sense::hover());
  let resp = ui.interact(rect, id, Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
  let hovered = resp.hovered();
  paint_dashed_tile(ui.painter(), if hovered { rect.expand(1.4) } else { rect }, if hovered { 0.0 } else { tilt }, hovered, Some(label));
  resp
}

fn paint_dashed_tile(painter: &egui::Painter, rect: Rect, tilt: f32, hovered: bool, label: Option<&str>) {
  let rot = Rot2::from_angle(tilt.to_radians());
  let corners = rotated_corners(rect, rot);
  let fill = theme::fade(theme::CONTROLS, if hovered { 0.6 } else { 0.4 });
  painter.add(Shape::convex_polygon(corners.to_vec(), fill, Stroke::NONE));
  let mut path = corners.to_vec();
  path.push(corners[0]);
  painter.extend(Shape::dashed_line(&path, Stroke::new(2.0, theme::LINE_DASHED), 4.0, 3.0));
  let c = rect.center();
  match label {
    Some(label) => {
      icons::paint(painter, Rect::from_center_size(c - vec2(0.0, 6.0), vec2(18.0, 18.0)), Icon::Plus, theme::fade(theme::INK, 0.8));
      painter.text(c + vec2(0.0, 12.0), Align2::CENTER_CENTER, label, FontId::new(8.5, theme::medium()), theme::fade(theme::INK, 0.7));
    },
    None => icons::paint(painter, Rect::from_center_size(c, vec2(20.0, 20.0)), Icon::Plus, theme::fade(theme::INK, 0.8)),
  }
}

fn rotated_corners(rect: Rect, rot: Rot2) -> [Pos2; 4] {
  let c = rect.center();
  [rect.left_top(), rect.right_top(), rect.right_bottom(), rect.left_bottom()].map(|p| c + rot * (p - c))
}

/// The UV rect that crops a texture of `size` to a centred square (`object-cover`).
pub fn cover_uv(size: Vec2) -> Rect {
  if size.x <= 0.0 || size.y <= 0.0 {
    return Rect::from_min_max(Pos2::ZERO, pos2(1.0, 1.0));
  }
  if size.x > size.y {
    let f = size.y / size.x;
    Rect::from_min_max(pos2((1.0 - f) / 2.0, 0.0), pos2((1.0 + f) / 2.0, 1.0))
  } else {
    let f = size.x / size.y;
    Rect::from_min_max(pos2(0.0, (1.0 - f) / 2.0), pos2(1.0, (1.0 + f) / 2.0))
  }
}

/// One kind's group in an add menu: its "Upload" / "From library" rows and a usage hint.
struct MenuGroup {
  kind: RefKind,
  hint: Option<String>,
  slot: ImageSlot,
  library: bool,
}

fn add_menu_entries(refs: &References, limits: &DeckLimits, open_kinds: &[RefKind], slot: ImageSlot) -> Vec<MenuGroup> {
  open_kinds
    .iter()
    .map(|&kind| {
      let count = format!("{}/{}", refs.list(kind).len(), limits.max(kind));
      let hint = match limits.max_secs(kind) {
        Some(max) => format!("{count} \u{b7} {}/{}s", refs.total_secs(kind).round() as i64, max.round() as i64),
        None => count,
      };
      MenuGroup { kind, hint: Some(hint), slot, library: limits.library }
    })
    .collect()
}

/// The add menu that appears above a trigger after a short hover (the webapp's `DeckAddMenu`).
fn hover_menu(ui: &Ui, id: Id, trigger: &Response, groups: &[MenuGroup], actions: &mut Vec<DeckAction>) {
  // A lone "Upload" is what clicking does already: no menu (the webapp's `enabledActions > 1`).
  let entries: usize = groups.iter().map(|g| 1 + usize::from(g.library)).sum();
  if entries <= 1 {
    return;
  }
  let latch = hover_latch(ui, id, trigger.rect, MENU_DELAY);
  if !latch.open {
    return;
  }
  let show_groups = groups.len() > 1;
  let area = egui::Area::new(id.with("area")).order(Order::Tooltip).pivot(Align2::CENTER_BOTTOM).fixed_pos(trigger.rect.center_top() - vec2(0.0, 2.0)).show(ui.ctx(), |ui| {
    widgets::popover_frame().inner_margin(6).show(ui, |ui| {
      ui.set_width(192.0);
      ui.spacing_mut().item_spacing.y = 0.0;
      for group in groups {
        if show_groups {
          ui.horizontal(|ui| {
            ui.label(egui::RichText::new(group.kind.noun().to_uppercase()).size(10.0).family(theme::semibold()).color(theme::FAINT));
            if let Some(hint) = &group.hint {
              ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                ui.label(egui::RichText::new(hint).size(10.0).family(theme::medium()).color(theme::FAINT));
              });
            }
          });
        }
        if menu_entry(ui, Icon::Upload, "Upload") {
          actions.push(DeckAction::Upload { kinds: vec![group.kind], slot: group.slot });
          latch.close(ui);
        }
        if group.library && menu_entry(ui, Icon::Library, if group.slot == ImageSlot::Reference { "From library" } else { "Pick from library" }) {
          actions.push(DeckAction::Library { kind: group.kind, slot: group.slot });
          latch.close(ui);
        }
      }
    });
  });
  latch.keep_open_while(ui, area.response.rect.union(trigger.rect));
}

fn menu_entry(ui: &mut Ui, icon: Icon, label: &str) -> bool {
  let (rect, resp) = ui.allocate_exact_size(vec2(ui.available_width(), 30.0), Sense::click());
  let p = ui.painter();
  if resp.hovered() {
    p.rect_filled(rect, theme::RADIUS, theme::WASH_HOVER);
  }
  icons::paint(p, Rect::from_center_size(pos2(rect.left() + 17.0, rect.center().y), vec2(14.0, 14.0)), icon, theme::fade(theme::INK, 0.6));
  p.text(pos2(rect.left() + 34.0, rect.center().y), Align2::LEFT_CENTER, label, FontId::new(13.0, theme::medium()), theme::INK);
  resp.on_hover_cursor(egui::CursorIcon::PointingHand).clicked()
}

/// Open-on-hover with a delay, staying open while the pointer is over the trigger or what it
/// opened (plus a grace period), like the webapp's hover menus.
struct HoverLatch {
  id: Id,
  open: bool,
}

#[derive(Clone, Copy, Default)]
struct LatchState {
  hover_since: Option<f64>,
  left_at: Option<f64>,
  open: bool,
}

fn hover_latch(ui: &Ui, id: Id, trigger: Rect, delay: f64) -> HoverLatch {
  let now = ui.input(|i| i.time);
  let pointer = ui.input(|i| i.pointer.hover_pos());
  let over = pointer.is_some_and(|p| trigger.contains(p));
  let mut st: LatchState = ui.data(|d| d.get_temp(id).unwrap_or_default());
  if over {
    st.left_at = None;
    let since = *st.hover_since.get_or_insert(now);
    if !st.open {
      if now - since >= delay {
        st.open = true;
      } else {
        ui.ctx().request_repaint_after(std::time::Duration::from_secs_f64(delay - (now - since)));
      }
    }
  } else {
    st.hover_since = None;
  }
  ui.data_mut(|d| d.insert_temp(id, st));
  HoverLatch { id, open: st.open }
}

impl HoverLatch {
  /// Keeps the latch open while the pointer is inside `region`; closes it `CLOSE_DELAY` after
  /// the pointer leaves.
  fn keep_open_while(&self, ui: &Ui, region: Rect) {
    let now = ui.input(|i| i.time);
    let inside = ui.input(|i| i.pointer.hover_pos()).is_some_and(|p| region.expand(4.0).contains(p));
    let mut st: LatchState = ui.data(|d| d.get_temp(self.id).unwrap_or_default());
    if inside {
      st.left_at = None;
    } else {
      let left = *st.left_at.get_or_insert(now);
      if now - left >= CLOSE_DELAY {
        st = LatchState::default();
      } else {
        ui.ctx().request_repaint_after(std::time::Duration::from_secs_f64(CLOSE_DELAY));
      }
    }
    ui.data_mut(|d| d.insert_temp(self.id, st));
  }

  fn close(&self, ui: &Ui) {
    ui.data_mut(|d| d.insert_temp(self.id, LatchState::default()));
  }
}
