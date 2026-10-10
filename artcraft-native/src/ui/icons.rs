//! Line icons drawn on Lucide's 24-unit grid (the webapp's icon set), so they stay crisp at any
//! size without an icon font.

use egui::{Color32, Painter, Pos2, Rect, Response, Sense, Shape, Stroke, Ui, vec2};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Icon {
  AlertCircle,
  ArrowLeftRight,
  ArrowUp,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  Download,
  Eraser,
  Eye,
  ExternalLink,
  Film,
  Folder,
  Globe,
  Gem,
  Home,
  Image,
  Info,
  LayoutGrid,
  Link,
  Library,
  List,
  LogIn,
  LogOut,
  Maximize,
  Music,
  PanelLeft,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Settings,
  Sparkles,
  SquareCheck,
  Trash,
  Upload,
  User,
  Video,
  Volume,
  VolumeOff,
  Wand,
  X,
}

/// Maps Lucide's 24-unit grid onto a rect.
struct Grid {
  origin: Pos2,
  scale: f32,
  stroke: Stroke,
}

impl Grid {
  fn new(rect: Rect, color: Color32) -> Self {
    let side = rect.width().min(rect.height());
    let origin = rect.center() - vec2(side, side) / 2.0;
    let scale = side / 24.0;
    // Lucide's 2-unit stroke, a touch lighter so small icons don't clog.
    Self { origin, scale, stroke: Stroke::new((1.75 * scale).max(1.1), color) }
  }

  fn p(&self, x: f32, y: f32) -> Pos2 {
    self.origin + vec2(x, y) * self.scale
  }

  fn line(&self, painter: &Painter, pts: &[(f32, f32)]) {
    let pts: Vec<Pos2> = pts.iter().map(|&(x, y)| self.p(x, y)).collect();
    painter.add(Shape::line(pts, self.stroke));
  }

  fn closed(&self, painter: &Painter, pts: &[(f32, f32)]) {
    let pts: Vec<Pos2> = pts.iter().map(|&(x, y)| self.p(x, y)).collect();
    painter.add(Shape::closed_line(pts, self.stroke));
  }

  fn rect(&self, painter: &Painter, x: f32, y: f32, w: f32, h: f32, r: f32) {
    let rect = Rect::from_min_size(self.p(x, y), vec2(w, h) * self.scale);
    painter.rect_stroke(rect, r * self.scale, self.stroke, egui::StrokeKind::Middle);
  }

  fn circle(&self, painter: &Painter, x: f32, y: f32, r: f32) {
    painter.circle_stroke(self.p(x, y), r * self.scale, self.stroke);
  }

  fn dot(&self, painter: &Painter, x: f32, y: f32, r: f32) {
    painter.circle_filled(self.p(x, y), r * self.scale, self.stroke.color);
  }

  /// An arc round (cx, cy), angles in degrees clockwise from 3 o'clock.
  fn arc(&self, painter: &Painter, cx: f32, cy: f32, r: f32, from: f32, to: f32) {
    let steps = 24;
    let pts: Vec<Pos2> = (0..=steps)
      .map(|i| {
        let a = (from + (to - from) * i as f32 / steps as f32).to_radians();
        self.p(cx + r * a.cos(), cy + r * a.sin())
      })
      .collect();
    painter.add(Shape::line(pts, self.stroke));
  }
}

/// Paints `icon` centred in `rect`.
pub fn paint(painter: &Painter, rect: Rect, icon: Icon, color: Color32) {
  let g = Grid::new(rect, color);
  let p = painter;
  match icon {
    Icon::AlertCircle => {
      g.circle(p, 12.0, 12.0, 10.0);
      g.line(p, &[(12.0, 8.0), (12.0, 12.0)]);
      g.dot(p, 12.0, 16.0, 1.1);
    },
    Icon::ArrowLeftRight => {
      g.line(p, &[(8.0, 3.0), (4.0, 7.0), (8.0, 11.0)]);
      g.line(p, &[(4.0, 7.0), (20.0, 7.0)]);
      g.line(p, &[(16.0, 21.0), (20.0, 17.0), (16.0, 13.0)]);
      g.line(p, &[(20.0, 17.0), (4.0, 17.0)]);
    },
    Icon::ArrowUp => {
      g.line(p, &[(5.0, 12.0), (12.0, 5.0), (19.0, 12.0)]);
      g.line(p, &[(12.0, 19.0), (12.0, 5.0)]);
    },
    Icon::Box => {
      g.closed(p, &[(12.0, 2.0), (21.0, 7.0), (21.0, 17.0), (12.0, 22.0), (3.0, 17.0), (3.0, 7.0)]);
      g.line(p, &[(3.0, 7.0), (12.0, 12.0), (21.0, 7.0)]);
      g.line(p, &[(12.0, 12.0), (12.0, 22.0)]);
    },
    Icon::Check => g.line(p, &[(20.0, 6.0), (9.0, 17.0), (4.0, 12.0)]),
    Icon::ChevronDown => g.line(p, &[(6.0, 9.0), (12.0, 15.0), (18.0, 9.0)]),
    Icon::ChevronLeft => g.line(p, &[(15.0, 18.0), (9.0, 12.0), (15.0, 6.0)]),
    Icon::ChevronRight => g.line(p, &[(9.0, 18.0), (15.0, 12.0), (9.0, 6.0)]),
    Icon::ChevronUp => g.line(p, &[(18.0, 15.0), (12.0, 9.0), (6.0, 15.0)]),
    Icon::Clock => {
      g.circle(p, 12.0, 12.0, 10.0);
      g.line(p, &[(12.0, 6.0), (12.0, 12.0), (16.0, 14.0)]);
    },
    Icon::Coins => {
      g.circle(p, 8.0, 8.0, 6.0);
      g.arc(p, 15.5, 15.5, 6.0, -100.0, 190.0);
      g.line(p, &[(7.0, 6.0), (8.0, 5.0), (8.0, 11.0)]);
    },
    Icon::Copy => {
      g.rect(p, 8.0, 8.0, 14.0, 14.0, 2.0);
      g.line(p, &[(4.0, 16.0), (4.0, 4.0), (16.0, 4.0)]);
    },
    Icon::Download => {
      g.line(p, &[(12.0, 3.0), (12.0, 15.0)]);
      g.line(p, &[(7.0, 10.0), (12.0, 15.0), (17.0, 10.0)]);
      g.line(p, &[(4.0, 21.0), (20.0, 21.0)]);
    },
    Icon::Eraser => {
      g.closed(p, &[(7.0, 21.0), (3.5, 17.5), (14.0, 7.0), (21.0, 14.0), (14.0, 21.0)]);
      g.line(p, &[(22.0, 21.0), (7.0, 21.0)]);
      g.line(p, &[(9.0, 12.0), (16.0, 19.0)]);
    },
    Icon::ExternalLink => {
      g.line(p, &[(15.0, 3.0), (21.0, 3.0), (21.0, 9.0)]);
      g.line(p, &[(10.0, 14.0), (21.0, 3.0)]);
      g.line(p, &[(18.0, 13.0), (18.0, 19.0), (16.0, 21.0), (5.0, 21.0), (3.0, 19.0), (3.0, 8.0), (5.0, 6.0), (11.0, 6.0)]);
    },
    Icon::Eye => {
      g.closed(p, &[(2.0, 12.0), (5.0, 7.5), (9.0, 5.2), (12.0, 4.8), (15.0, 5.2), (19.0, 7.5), (22.0, 12.0), (19.0, 16.5), (15.0, 18.8), (12.0, 19.2), (9.0, 18.8), (5.0, 16.5)]);
      g.circle(p, 12.0, 12.0, 3.0);
    },
    Icon::Gem => {
      g.closed(p, &[(6.0, 3.0), (18.0, 3.0), (22.0, 9.0), (12.0, 22.0), (2.0, 9.0)]);
      g.line(p, &[(2.0, 9.0), (22.0, 9.0)]);
      g.line(p, &[(11.0, 3.0), (8.0, 9.0), (12.0, 22.0), (16.0, 9.0), (13.0, 3.0)]);
    },
    Icon::Info => {
      g.circle(p, 12.0, 12.0, 10.0);
      g.line(p, &[(12.0, 16.0), (12.0, 12.0)]);
      g.dot(p, 12.0, 8.0, 1.1);
    },
    Icon::Link => {
      g.line(p, &[(10.0, 13.0), (11.0, 14.0), (14.0, 14.4), (16.5, 13.0), (20.0, 9.5), (20.6, 6.0), (18.0, 3.4), (14.5, 4.0), (12.8, 5.7)]);
      g.line(p, &[(14.0, 11.0), (13.0, 10.0), (10.0, 9.6), (7.5, 11.0), (4.0, 14.5), (3.4, 18.0), (6.0, 20.6), (9.5, 20.0), (11.2, 18.3)]);
    },
    Icon::LogIn => {
      g.line(p, &[(15.0, 3.0), (19.0, 3.0), (21.0, 5.0), (21.0, 19.0), (19.0, 21.0), (15.0, 21.0)]);
      g.line(p, &[(10.0, 17.0), (15.0, 12.0), (10.0, 7.0)]);
      g.line(p, &[(15.0, 12.0), (3.0, 12.0)]);
    },
    Icon::SquareCheck => {
      g.rect(p, 3.0, 3.0, 18.0, 18.0, 2.0);
      g.line(p, &[(8.0, 12.0), (11.0, 15.0), (16.0, 9.0)]);
    },
    Icon::Film => {
      g.rect(p, 3.0, 3.0, 18.0, 18.0, 2.0);
      g.line(p, &[(7.0, 3.0), (7.0, 21.0)]);
      g.line(p, &[(17.0, 3.0), (17.0, 21.0)]);
      g.line(p, &[(3.0, 12.0), (21.0, 12.0)]);
      g.line(p, &[(3.0, 7.5), (7.0, 7.5)]);
      g.line(p, &[(17.0, 7.5), (21.0, 7.5)]);
      g.line(p, &[(3.0, 16.5), (7.0, 16.5)]);
      g.line(p, &[(17.0, 16.5), (21.0, 16.5)]);
    },
    Icon::Folder => g.closed(p, &[(2.0, 5.0), (3.0, 4.0), (9.0, 4.0), (11.0, 7.0), (21.0, 7.0), (22.0, 8.0), (22.0, 19.0), (21.0, 20.0), (3.0, 20.0), (2.0, 19.0)]),
    Icon::Globe => {
      g.circle(p, 12.0, 12.0, 10.0);
      g.line(p, &[(2.0, 12.0), (22.0, 12.0)]);
      g.arc(p, 2.0, 12.0, 14.14, -45.0, 45.0);
      g.arc(p, 22.0, 12.0, 14.14, 135.0, 225.0);
    },
    Icon::Home => {
      g.closed(p, &[(3.0, 10.0), (12.0, 3.0), (21.0, 10.0), (21.0, 21.0), (3.0, 21.0)]);
      g.line(p, &[(9.0, 21.0), (9.0, 14.0), (15.0, 14.0), (15.0, 21.0)]);
    },
    Icon::Image => {
      g.rect(p, 3.0, 3.0, 18.0, 18.0, 2.0);
      g.circle(p, 9.0, 9.0, 2.0);
      g.line(p, &[(21.0, 15.0), (16.0, 10.0), (5.0, 21.0)]);
    },
    Icon::LayoutGrid => {
      for (x, y) in [(3.0, 3.0), (14.0, 3.0), (3.0, 14.0), (14.0, 14.0)] {
        g.rect(p, x, y, 7.0, 7.0, 1.0);
      }
    },
    Icon::Library => {
      g.line(p, &[(16.0, 6.0), (20.0, 20.0)]);
      g.line(p, &[(12.0, 6.0), (12.0, 20.0)]);
      g.line(p, &[(8.0, 8.0), (8.0, 20.0)]);
      g.line(p, &[(4.0, 4.0), (4.0, 20.0)]);
    },
    Icon::List => {
      for y in [6.0, 12.0, 18.0] {
        g.line(p, &[(8.0, y), (21.0, y)]);
        g.dot(p, 3.5, y, 1.1);
      }
    },
    Icon::LogOut => {
      g.line(p, &[(9.0, 21.0), (5.0, 21.0), (3.0, 19.0), (3.0, 5.0), (5.0, 3.0), (9.0, 3.0)]);
      g.line(p, &[(16.0, 17.0), (21.0, 12.0), (16.0, 7.0)]);
      g.line(p, &[(21.0, 12.0), (9.0, 12.0)]);
    },
    Icon::Maximize => {
      g.line(p, &[(15.0, 3.0), (21.0, 3.0), (21.0, 9.0)]);
      g.line(p, &[(9.0, 21.0), (3.0, 21.0), (3.0, 15.0)]);
      g.line(p, &[(21.0, 3.0), (14.0, 10.0)]);
      g.line(p, &[(3.0, 21.0), (10.0, 14.0)]);
    },
    Icon::Music => {
      g.line(p, &[(9.0, 18.0), (9.0, 5.0), (21.0, 3.0), (21.0, 16.0)]);
      g.circle(p, 6.0, 18.0, 3.0);
      g.circle(p, 18.0, 16.0, 3.0);
    },
    Icon::PanelLeft => {
      g.rect(p, 3.0, 3.0, 18.0, 18.0, 2.0);
      g.line(p, &[(9.0, 3.0), (9.0, 21.0)]);
    },
    Icon::Pencil => {
      g.closed(p, &[(17.0, 3.0), (21.0, 7.0), (7.5, 20.5), (2.0, 22.0), (3.5, 16.5)]);
      g.line(p, &[(15.0, 5.0), (19.0, 9.0)]);
    },
    Icon::Play => {
      let pts = [g.p(7.0, 4.0), g.p(20.0, 12.0), g.p(7.0, 20.0)];
      p.add(Shape::convex_polygon(pts.to_vec(), color, Stroke::NONE));
    },
    Icon::Plus => {
      g.line(p, &[(5.0, 12.0), (19.0, 12.0)]);
      g.line(p, &[(12.0, 5.0), (12.0, 19.0)]);
    },
    Icon::RotateCw => {
      g.arc(p, 12.0, 12.0, 9.0, -60.0, 250.0);
      g.line(p, &[(21.0, 3.0), (21.0, 8.5), (15.5, 8.5)]);
    },
    Icon::Settings => {
      g.circle(p, 12.0, 12.0, 3.0);
      g.circle(p, 12.0, 12.0, 7.5);
      for i in 0..8 {
        let a = (i as f32 * 45.0).to_radians();
        g.line(p, &[(12.0 + 7.5 * a.cos(), 12.0 + 7.5 * a.sin()), (12.0 + 10.0 * a.cos(), 12.0 + 10.0 * a.sin())]);
      }
    },
    Icon::Sparkles => {
      let star = |cx: f32, cy: f32, r: f32| {
        let k = r * 0.28;
        g.closed(p, &[(cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k), (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k)]);
      };
      star(10.0, 12.0, 8.0);
      star(19.0, 5.0, 3.0);
    },
    Icon::Trash => {
      g.line(p, &[(3.0, 6.0), (21.0, 6.0)]);
      g.line(p, &[(19.0, 6.0), (19.0, 20.0), (17.0, 22.0), (7.0, 22.0), (5.0, 20.0), (5.0, 6.0)]);
      g.line(p, &[(8.0, 6.0), (8.0, 4.0), (10.0, 2.0), (14.0, 2.0), (16.0, 4.0), (16.0, 6.0)]);
    },
    Icon::Upload => {
      g.line(p, &[(12.0, 15.0), (12.0, 3.0)]);
      g.line(p, &[(7.0, 8.0), (12.0, 3.0), (17.0, 8.0)]);
      g.line(p, &[(4.0, 21.0), (20.0, 21.0)]);
    },
    Icon::User => {
      g.circle(p, 12.0, 8.0, 4.5);
      g.arc(p, 12.0, 22.0, 8.0, 180.0, 360.0);
    },
    Icon::Video => {
      g.rect(p, 2.0, 6.0, 14.0, 12.0, 2.0);
      g.closed(p, &[(16.0, 10.5), (22.0, 7.0), (22.0, 17.0), (16.0, 13.5)]);
    },
    Icon::Volume | Icon::VolumeOff => {
      g.closed(p, &[(11.0, 5.0), (6.0, 9.0), (2.0, 9.0), (2.0, 15.0), (6.0, 15.0), (11.0, 19.0)]);
      if icon == Icon::Volume {
        g.arc(p, 12.0, 12.0, 4.0, -50.0, 50.0);
        g.arc(p, 12.0, 12.0, 8.0, -50.0, 50.0);
      } else {
        g.line(p, &[(16.0, 9.0), (22.0, 15.0)]);
        g.line(p, &[(22.0, 9.0), (16.0, 15.0)]);
      }
    },
    Icon::Wand => {
      g.line(p, &[(3.0, 21.0), (15.0, 9.0)]);
      g.line(p, &[(15.0, 4.0), (15.0, 6.0)]);
      g.line(p, &[(18.0, 9.0), (20.0, 9.0)]);
      g.line(p, &[(18.5, 5.5), (17.0, 7.0)]);
      g.line(p, &[(11.0, 5.0), (12.0, 6.0)]);
      g.line(p, &[(19.0, 13.0), (18.0, 12.0)]);
    },
    Icon::X => {
      g.line(p, &[(18.0, 6.0), (6.0, 18.0)]);
      g.line(p, &[(6.0, 6.0), (18.0, 18.0)]);
    },
  }
}

/// Allocates a `size` square and paints `icon` in it.
pub fn icon(ui: &mut Ui, icon: Icon, size: f32, color: Color32) -> Response {
  let (rect, resp) = ui.allocate_exact_size(vec2(size, size), Sense::hover());
  paint(ui.painter(), rect, icon, color);
  resp
}

/// The outline of an aspect ratio `w:h`, fitted inside `rect` (the webapp's `AspectRatioIcon`).
/// `None` draws the dashed "auto" frame.
pub fn paint_aspect(painter: &Painter, rect: Rect, ratio: Option<(f32, f32)>, color: Color32) {
  let side = rect.width().min(rect.height()) * 0.8;
  let stroke = Stroke::new(1.4, color);
  match ratio {
    Some((w, h)) if w > 0.0 && h > 0.0 => {
      let size = if w >= h { vec2(side, side * h / w) } else { vec2(side * w / h, side) };
      let r = Rect::from_center_size(rect.center(), size);
      painter.rect_stroke(r, 1.5, stroke, egui::StrokeKind::Middle);
    },
    _ => {
      let r = Rect::from_center_size(rect.center(), vec2(side, side));
      let shapes = Shape::dashed_line(&[r.left_top(), r.right_top(), r.right_bottom(), r.left_bottom(), r.left_top()], stroke, 2.5, 2.0);
      painter.extend(shapes);
    },
  }
}

/// A spinner arc, like Lucide's `LoaderCircle` with `animate-spin`.
pub fn paint_spinner(ui: &Ui, rect: Rect, color: Color32) {
  let t = ui.input(|i| i.time) as f32;
  let g = Grid::new(rect, color);
  let start = t * 360.0;
  g.arc(ui.painter(), 12.0, 12.0, 9.0, start, start + 270.0);
  ui.ctx().request_repaint();
}

/// A dashed outline round `rect` (drop targets and empty reference slots).
pub fn dashed_rect(painter: &Painter, rect: Rect, stroke: Stroke, dash: f32, gap: f32) {
  let pts = [rect.left_top(), rect.right_top(), rect.right_bottom(), rect.left_bottom(), rect.left_top()];
  painter.extend(Shape::dashed_line(&pts, stroke, dash, gap));
}
