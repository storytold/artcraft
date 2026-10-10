//! The track player (`WaveformAudioPlayer`): a round white play button, the waveform (click to
//! seek, played part in blue), the time, and a volume flyout. Placeholder bars stand in while the
//! waveform decodes; a plain progress line if it can't.

use egui::{Color32, FontId, Id, Popup, Rect, Sense, Stroke, Ui, pos2, vec2};

use crate::backend::audio::{self, AudioPlayer, WaveformLookup};
use crate::prompt_box::pickers;
use crate::theme;
use crate::ui::icons::{self, Icon};

/// Bars drawn while the waveform loads (`PLACEHOLDER_BAR_COUNT`).
const PLACEHOLDER_BARS: usize = 48;
/// Waveform bars: width and the step between them.
const BAR_WIDTH: f32 = 2.0;
const BAR_STEP: f32 = 3.5;
const WAVE_INK: Color32 = Color32::from_rgba_premultiplied(89, 89, 89, 89);
const PROGRESS_INK: Color32 = Color32::from_rgb(0x2d, 0x81, 0xff);
/// How often a playing track redraws its progress.
const FRAME: std::time::Duration = std::time::Duration::from_millis(33);

/// Draws the player across `ui`'s width; `duration_hint` (seconds) is used until the waveform
/// knows the real length. `compact` is the list rows' smaller size. Returns the player's rect.
pub fn player(ui: &mut Ui, id: Id, audio: &mut AudioPlayer, url: &str, duration_hint: Option<f32>, compact: bool) -> Rect {
  let (button_d, wave_h): (f32, f32) = if compact { (32.0, 32.0) } else { (40.0, 44.0) };
  let (rect, _) = ui.allocate_exact_size(vec2(ui.available_width(), wave_h.max(button_d)), Sense::hover());
  // Clicks between the controls stay with the player (they don't open the card underneath).
  ui.interact(rect, id.with("bg"), Sense::click());
  let ctx = ui.ctx().clone();
  let waveform = audio.waveform(&ctx, url);
  let playback = audio.track(url);
  let duration = match &waveform {
    WaveformLookup::Ready(w) => Some(w.duration),
    _ => duration_hint,
  }
  .filter(|d| *d > 0.0);
  let position = playback.map_or(0.0, |p| p.position);
  let playing = playback.is_some_and(|p| !p.paused && !p.loading);
  if playing {
    ctx.request_repaint_after(FRAME);
  }

  // Play / pause.
  let button = Rect::from_center_size(pos2(rect.left() + button_d / 2.0, rect.center().y), vec2(button_d, button_d));
  let resp = ui.interact(button, id.with("play"), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
  let label = if playing { "Pause" } else { "Play" };
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, label));
  ui.painter().circle_filled(button.center(), button_d / 2.0, if resp.hovered() { theme::fade(Color32::WHITE, 0.88) } else { Color32::WHITE });
  let glyph = Rect::from_center_size(button.center(), vec2(button_d * 0.4, button_d * 0.4));
  match playback {
    Some(p) if p.loading => icons::paint_spinner(ui, glyph, Color32::BLACK),
    _ if playing => icons::paint(ui.painter(), glyph, Icon::Pause, Color32::BLACK),
    _ => icons::paint(ui.painter(), glyph.translate(vec2(button_d * 0.04, 0.0)), Icon::Play, Color32::BLACK),
  }
  if resp.clicked() {
    audio.toggle_track(&ctx, url);
  }

  // Volume, then the time, from the right.
  let volume_rect = Rect::from_center_size(pos2(rect.right() - 14.0, rect.center().y), vec2(28.0, 28.0));
  volume(ui, id, volume_rect, audio);
  let time = format!("{} / {}", format_time(position), duration.map_or_else(|| "-:--".to_owned(), format_time));
  let galley = ui.painter().layout_no_wrap(time, FontId::new(11.0, theme::mono()), theme::MUTED);
  let time_x = volume_rect.left() - 8.0 - galley.size().x;
  ui.painter().galley(pos2(time_x, rect.center().y - galley.size().y / 2.0), galley, theme::MUTED);

  // The waveform between them.
  let wave = Rect::from_min_max(pos2(button.right() + 10.0, rect.center().y - wave_h / 2.0), pos2(time_x - 10.0, rect.center().y + wave_h / 2.0));
  if wave.width() > 8.0 {
    let progress = duration.map_or(0.0, |d| (position / d).clamp(0.0, 1.0));
    let wave_resp = ui.interact(wave, id.with("wave"), Sense::click()).on_hover_cursor(egui::CursorIcon::PointingHand);
    match &waveform {
      WaveformLookup::Ready(w) => paint_bars(ui, wave, &audio::resample(&w.peaks, bar_count(wave.width())), progress),
      WaveformLookup::Loading => paint_bars(ui, wave, &placeholder_bars(url), progress),
      WaveformLookup::Failed => paint_line(ui, wave, progress),
    }
    if let Some(pointer) = wave_resp.interact_pointer_pos().filter(|_| wave_resp.clicked()) {
      let frac = ((pointer.x - wave.left()) / wave.width()).clamp(0.0, 1.0);
      audio.seek_track(&ctx, url, duration.map_or(0.0, |d| frac * d));
    }
  }
  rect
}

/// "m:ss".
pub fn format_time(secs: f32) -> String {
  let s = secs.max(0.0) as u64;
  format!("{}:{:02}", s / 60, s % 60)
}

/// The volume button and its 0–100 slider flyout.
fn volume(ui: &mut Ui, id: Id, rect: Rect, audio: &mut AudioPlayer) {
  let popup_id = id.with("volume-popup");
  let open = Popup::is_id_open(ui.ctx(), popup_id);
  let resp = ui.interact(rect, id.with("volume"), Sense::click()).on_hover_text("Volume").on_hover_cursor(egui::CursorIcon::PointingHand);
  resp.widget_info(|| egui::WidgetInfo::labeled(egui::WidgetType::Button, true, "Volume"));
  if resp.hovered() || open {
    ui.painter().rect_filled(rect, theme::RADIUS, theme::WASH);
  }
  let level = audio.track_volume();
  icons::paint(ui.painter(), rect.shrink(7.0), if level <= 0.0 { Icon::VolumeOff } else { Icon::Volume }, if resp.hovered() || open { theme::INK } else { theme::DIM });
  let mut percent = (level * 100.0).round() as u32;
  pickers::popover(&resp, popup_id, |ui| {
    ui.horizontal(|ui| {
      ui.add_space(6.0);
      ui.style_mut().spacing.slider_width = 120.0;
      ui.add(egui::Slider::new(&mut percent, 0..=100).show_value(false));
      ui.label(egui::RichText::new(percent.to_string()).size(11.0).family(theme::mono()).color(theme::MUTED));
      ui.add_space(4.0);
    });
  });
  if percent != (level * 100.0).round() as u32 {
    audio.set_track_volume(percent as f32 / 100.0);
  }
}

fn bar_count(width: f32) -> usize {
  ((width + BAR_STEP - BAR_WIDTH) / BAR_STEP).floor().max(1.0) as usize
}

/// Bars centred on the waveform's midline, blue up to `progress` (0–1).
fn paint_bars(ui: &Ui, rect: Rect, heights: &[f32], progress: f32) {
  if heights.is_empty() {
    return;
  }
  let step = rect.width() / heights.len() as f32;
  let width = BAR_WIDTH.min(step * 0.7);
  let split = rect.left() + rect.width() * progress;
  let p = ui.painter();
  for (i, h) in heights.iter().enumerate() {
    let x = rect.left() + step * (i as f32 + 0.5);
    let half = (h.clamp(0.0, 1.0) * rect.height() / 2.0).max(1.0);
    let bar = Rect::from_center_size(pos2(x, rect.center().y), vec2(width, half * 2.0));
    p.rect_filled(bar, 1.0, if x <= split { PROGRESS_INK } else { WAVE_INK });
  }
}

/// The fallback when the waveform can't be decoded: a thin track with the played part in blue.
fn paint_line(ui: &Ui, rect: Rect, progress: f32) {
  let track = Rect::from_center_size(rect.center(), vec2(rect.width(), 4.0));
  ui.painter().rect_filled(track, 2.0, WAVE_INK);
  ui.painter().rect_filled(Rect::from_min_size(track.min, vec2(track.width() * progress, track.height())), 2.0, PROGRESS_INK);
  ui.painter().line_segment([pos2(track.left() + track.width() * progress, rect.top() + 6.0), pos2(track.left() + track.width() * progress, rect.bottom() - 6.0)], Stroke::new(1.0, PROGRESS_INK));
}

/// Deterministic stand-in bars for a track (seeded by its URL), 25–89 % tall.
pub fn placeholder_bars(url: &str) -> Vec<f32> {
  let mut seed = url.chars().fold(0_u32, |s, c| s.wrapping_mul(31).wrapping_add(c as u32));
  (0..PLACEHOLDER_BARS)
    .map(|_| {
      let percent = 25 + seed % 65;
      seed = seed.wrapping_mul(1_103_515_245).wrapping_add(12_345);
      percent as f32 / 100.0
    })
    .collect()
}

/// A tile with a music note (`MusicIcon` in its box), for audio without artwork.
pub fn music_tile(ui: &Ui, rect: Rect, round: bool) {
  let p = ui.painter();
  if round {
    p.circle_filled(rect.center(), rect.width() / 2.0, theme::WASH_HOVER);
  } else {
    p.rect(rect, theme::RADIUS, theme::WASH, theme::hairline(), egui::StrokeKind::Inside);
  }
  icons::paint(p, Rect::from_center_size(rect.center(), rect.size() * 0.42), Icon::Music, theme::fade(Color32::WHITE, 0.75));
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn times_read_minutes_and_seconds() {
    assert_eq!(format_time(0.0), "0:00");
    assert_eq!(format_time(65.9), "1:05");
    assert_eq!(format_time(600.0), "10:00");
  }

  #[test]
  fn placeholder_bars_are_stable_per_track() {
    let a = placeholder_bars("https://cdn/a.mp3");
    assert_eq!(a.len(), PLACEHOLDER_BARS);
    assert_eq!(a, placeholder_bars("https://cdn/a.mp3"));
    assert_ne!(a, placeholder_bars("https://cdn/b.mp3"));
    assert!(a.iter().all(|h| (0.25..0.9).contains(h)));
  }

  #[test]
  fn bars_fill_the_width() {
    assert_eq!(bar_count(2.0), 1);
    assert_eq!(bar_count(352.0), 101);
  }
}
