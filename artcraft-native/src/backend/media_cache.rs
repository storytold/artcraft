//! Images shown in the UI: CDN thumbnails, animated video previews and local previews, as GPU
//! textures.
//!
//! Downloads run on the tokio runtime (a few at a time) and decode off the UI thread; the UI
//! uploads finished images in [`MediaCache::poll`]. Textures nobody has drawn for a while are
//! dropped once the cache grows past its budget, so long feeds don't hold every image forever.

use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;
use std::sync::mpsc::{Receiver, Sender, channel};
use std::time::Duration;

use egui::{ColorImage, TextureHandle, TextureOptions};
use image::{AnimationDecoder, ImageDecoder};
use log::warn;
use tokio::runtime::Handle;
use tokio::sync::Semaphore;

/// How many images may download at once.
const MAX_CONCURRENT_DOWNLOADS: usize = 6;
/// Longest side of a decoded image; larger ones are downscaled before upload.
const MAX_DECODED_SIDE: u32 = 2048;
/// Animated previews: longest side and frame budget (each frame is its own texture).
const ANIMATED_SIDE: u32 = 320;
const ANIMATED_MAX_FRAMES: usize = 48;
/// Animated previews: source frames read at most (25 s at 24 fps); later ones are left out.
const ANIMATED_MAX_SOURCE_FRAMES: usize = 600;
/// Textures kept even when unused (roughly two screens of thumbnails).
const SOFT_CAPACITY: usize = 160;
/// Frames an image may go undrawn before it can be evicted (animations go sooner: they're heavy).
const EVICT_AFTER_FRAMES: u64 = 600;
const EVICT_ANIMATED_AFTER_FRAMES: u64 = 120;

pub struct MediaCache {
  rt: Handle,
  http: reqwest::Client,
  limiter: Arc<Semaphore>,
  tx: Sender<Loaded>,
  rx: Receiver<Loaded>,
  entries: HashMap<String, Entry>,
  frame: u64,
}

/// What [`MediaCache::get`] knows about an image.
pub enum Lookup {
  Loading,
  Ready(TextureHandle),
  Failed,
}

enum Entry {
  Loading {
    last_used: u64,
  },
  Ready {
    texture: TextureHandle,
    last_used: u64,
  },
  /// Frames with how long each shows (seconds), and their total.
  Animated {
    frames: Vec<(TextureHandle, f32)>,
    total: f32,
    last_used: u64,
  },
  Failed,
}

struct Loaded {
  key: String,
  decoded: Option<Decoded>,
}

enum Decoded {
  Still(ColorImage),
  Frames(Vec<(ColorImage, f32)>),
}

impl MediaCache {
  pub fn new(rt: Handle, http: reqwest::Client) -> Self {
    let (tx, rx) = channel();
    Self { rt, http, limiter: Arc::new(Semaphore::new(MAX_CONCURRENT_DOWNLOADS)), tx, rx, entries: HashMap::new(), frame: 0 }
  }

  /// The texture for `url`, starting its download the first time it's asked for.
  pub fn get(&mut self, ctx: &egui::Context, url: &str) -> Lookup {
    self.lookup(ctx, url, url, false)
  }

  /// The current frame of an animated image (a video's animated preview); still images come
  /// back as they are.
  pub fn get_animated(&mut self, ctx: &egui::Context, url: &str) -> Lookup {
    self.lookup(ctx, &format!("anim:{url}"), url, true)
  }

  /// Decodes `bytes` off the UI thread and registers the result under `key`.
  pub fn insert_bytes(&mut self, ctx: &egui::Context, key: &str, bytes: Arc<[u8]>) {
    if self.entries.contains_key(key) {
      return;
    }
    self.entries.insert(key.to_owned(), Entry::Loading { last_used: self.frame });
    let (tx, ctx, key) = (self.tx.clone(), ctx.clone(), key.to_owned());
    self.rt.spawn_blocking(move || {
      let decoded = decode(&bytes).map(Decoded::Still);
      let _ = tx.send(Loaded { key, decoded });
      ctx.request_repaint();
    });
  }

  /// Uploads finished downloads and evicts stale textures. Call once per frame.
  pub fn poll(&mut self, ctx: &egui::Context) {
    self.frame += 1;
    while let Ok(Loaded { key, decoded }) = self.rx.try_recv() {
      // Dropped while loading (evicted): don't resurrect it.
      let Some(entry) = self.entries.get_mut(&key) else {
        continue;
      };
      *entry = match decoded {
        Some(Decoded::Still(image)) => Entry::Ready { texture: ctx.load_texture(&key, image, TextureOptions::LINEAR), last_used: self.frame },
        Some(Decoded::Frames(frames)) => {
          let total = frames.iter().map(|(_, d)| d).sum();
          let frames = frames.into_iter().enumerate().map(|(i, (img, d))| (ctx.load_texture(format!("{key}#{i}"), img, TextureOptions::LINEAR), d)).collect();
          Entry::Animated { frames, total, last_used: self.frame }
        },
        None => Entry::Failed,
      };
    }
    let frame = self.frame;
    let crowded = self.entries.len() > SOFT_CAPACITY;
    self.entries.retain(|_, e| match e {
      Entry::Animated { last_used, .. } => frame.saturating_sub(*last_used) < EVICT_ANIMATED_AFTER_FRAMES,
      Entry::Ready { last_used, .. } | Entry::Loading { last_used } => !crowded || frame.saturating_sub(*last_used) < EVICT_AFTER_FRAMES,
      Entry::Failed => true,
    });
  }

  fn lookup(&mut self, ctx: &egui::Context, key: &str, url: &str, animated: bool) -> Lookup {
    let frame = self.frame;
    match self.entries.get_mut(key) {
      Some(Entry::Ready { texture, last_used }) => {
        *last_used = frame;
        Lookup::Ready(texture.clone())
      },
      Some(Entry::Animated { frames, total, last_used }) => {
        *last_used = frame;
        let t = (ctx.input(|i| i.time) as f32).rem_euclid(total.max(0.01));
        let (mut acc, mut index) = (0.0, frames.len() - 1);
        for (i, (_, d)) in frames.iter().enumerate() {
          acc += d;
          if t < acc {
            index = i;
            break;
          }
        }
        ctx.request_repaint_after(Duration::from_secs_f32((acc - t).max(0.01)));
        Lookup::Ready(frames[index].0.clone())
      },
      Some(Entry::Loading { last_used }) => {
        *last_used = frame;
        Lookup::Loading
      },
      Some(Entry::Failed) => Lookup::Failed,
      None => {
        self.entries.insert(key.to_owned(), Entry::Loading { last_used: frame });
        self.spawn_download(ctx, key.to_owned(), url.to_owned(), animated);
        Lookup::Loading
      },
    }
  }

  fn spawn_download(&self, ctx: &egui::Context, key: String, url: String, animated: bool) {
    let (http, limiter, tx, ctx) = (self.http.clone(), self.limiter.clone(), self.tx.clone(), ctx.clone());
    self.rt.spawn(async move {
      let decoded = match limiter.acquire_owned().await {
        Ok(_permit) => download(&http, &url, animated).await,
        Err(_) => None,
      };
      let _ = tx.send(Loaded { key, decoded });
      ctx.request_repaint();
    });
  }
}

async fn download(http: &reqwest::Client, url: &str, animated: bool) -> Option<Decoded> {
  let response = match http.get(url).send().await.and_then(|r| r.error_for_status()) {
    Ok(response) => response,
    Err(err) => {
      warn!("Image download failed for {url}: {err}");
      return None;
    },
  };
  let bytes = response.bytes().await.ok()?;
  tokio::task::spawn_blocking(move || if animated { decode_frames(&bytes).map(Decoded::Frames).or_else(|| decode(&bytes).map(Decoded::Still)) } else { decode(&bytes).map(Decoded::Still) }).await.ok().flatten()
}

fn decode(bytes: &[u8]) -> Option<ColorImage> {
  let image = match image::load_from_memory(bytes) {
    Ok(image) => image,
    Err(err) => {
      warn!("Image decode failed: {err}");
      return None;
    },
  };
  let image = if image.width().max(image.height()) > MAX_DECODED_SIDE { image.thumbnail(MAX_DECODED_SIDE, MAX_DECODED_SIDE) } else { image };
  Some(to_color_image(image.to_rgba8()))
}

/// The frames of an animated GIF or WebP (subsampled to the budget), or `None` when it isn't
/// animated. Every decoded frame is a whole canvas, so the frames are timed in a first pass and
/// only the kept ones are decoded into images in a second: one canvas is alive at a time.
fn decode_frames(bytes: &[u8]) -> Option<Vec<(ColorImage, f32)>> {
  let delays = animation_frames(bytes)?
    .take(ANIMATED_MAX_SOURCE_FRAMES)
    .map(|frame| {
      let (n, d) = frame.ok()?.delay().numer_denom_ms();
      Some(n as f32 / d.max(1) as f32 / 1000.0)
    })
    .collect::<Option<Vec<f32>>>()?;
  if delays.len() < 2 {
    return None;
  }
  // Keep every n-th frame, folding the skipped frames' time into the kept one.
  let step = delays.len().div_ceil(ANIMATED_MAX_FRAMES);
  let mut out = Vec::with_capacity(delays.len() / step + 1);
  for (frame, chunk) in animation_frames(bytes)?.step_by(step).zip(delays.chunks(step)) {
    let secs: f32 = chunk.iter().sum();
    let image = image::DynamicImage::ImageRgba8(frame.ok()?.into_buffer()).thumbnail(ANIMATED_SIDE, ANIMATED_SIDE);
    // Some encoders write 0 ms delays; browsers treat those as ~100 ms.
    out.push((to_color_image(image.to_rgba8()), if secs < 0.02 { 0.1 * chunk.len() as f32 } else { secs }));
  }
  Some(out)
}

/// An animated GIF's or WebP's frames, decoded as they're read; `None` when it isn't animated or
/// its canvas is too large.
fn animation_frames(bytes: &[u8]) -> Option<image::Frames<'_>> {
  match image::guess_format(bytes).ok()? {
    image::ImageFormat::Gif => Some(limited(image::codecs::gif::GifDecoder::new(Cursor::new(bytes)).ok()?)?.into_frames()),
    image::ImageFormat::WebP => {
      let decoder = image::codecs::webp::WebPDecoder::new(Cursor::new(bytes)).ok()?;
      if !decoder.has_animation() {
        return None;
      }
      Some(limited(decoder)?.into_frames())
    },
    _ => None,
  }
}

/// `decoder` with the image crate's default limits, which `image::load_from_memory` applies but a
/// decoder built by hand doesn't; `None` when its canvas is over [`MAX_DECODED_SIDE`]. The canvas
/// size comes from the header alone, so a few KB of GIF can claim 65535 x 65535 per frame.
fn limited<D: ImageDecoder>(mut decoder: D) -> Option<D> {
  let (width, height) = decoder.dimensions();
  if width.max(height) > MAX_DECODED_SIDE {
    warn!("Animated image is {width}x{height}; showing a still instead");
    return None;
  }
  decoder.set_limits(image::Limits::default()).ok()?;
  Some(decoder)
}

fn to_color_image(rgba: image::RgbaImage) -> ColorImage {
  let size = [rgba.width() as usize, rgba.height() as usize];
  ColorImage::from_rgba_unmultiplied(size, rgba.as_raw())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn oversized_animation_canvases_show_a_still() {
    // Each decoded frame is a whole canvas, sized by the header alone (here 2049 x 64 for two 1x1
    // frames; a few KB of GIF can claim 65535 x 65535 and hundreds of frames).
    let wide = gif(MAX_DECODED_SIDE as u16 + 1, 64, 2, 10);
    assert!(decode_frames(&wide).is_none(), "a canvas over {MAX_DECODED_SIDE} px must not be decoded frame by frame");
    assert!(decode(&wide).is_some(), "it still shows as a still");
  }

  #[test]
  fn frames_past_the_source_budget_are_not_read() {
    // 610 frames of 20 ms against a budget of 600 (`ANIMATED_MAX_SOURCE_FRAMES`).
    let frames = decode_frames(&gif(1, 1, 610, 2)).expect("animated");
    let total: f32 = frames.iter().map(|(_, secs)| secs).sum();
    assert!((total - 12.0).abs() < 1e-3, "only the first 600 frames play, got {total} s");
  }

  #[test]
  fn long_animations_are_subsampled_keeping_their_timing() {
    let frames = decode_frames(&gif(8, 8, 100, 2)).expect("animated");
    assert_eq!(frames.len(), 34, "every 3rd of 100 frames");
    let total: f32 = frames.iter().map(|(_, secs)| secs).sum();
    assert!((total - 2.0).abs() < 1e-3, "skipped frames' time folds into the kept ones, got {total} s");
  }

  #[test]
  fn short_animations_keep_every_frame() {
    let frames = decode_frames(&gif(16, 16, 2, 10)).expect("animated");
    assert_eq!(frames.len(), 2);
    assert!(frames.iter().all(|(_, secs)| (secs - 0.1).abs() < 1e-6));
    assert!(decode_frames(&gif(16, 16, 1, 10)).is_none(), "one frame isn't an animation");
  }

  /// A GIF89a with a `width` x `height` canvas and `frames` black 1x1 frames at its origin, each
  /// shown for `delay_cs` hundredths of a second.
  fn gif(width: u16, height: u16, frames: usize, delay_cs: u16) -> Vec<u8> {
    let mut out = b"GIF89a".to_vec();
    out.extend(width.to_le_bytes());
    out.extend(height.to_le_bytes());
    // Global colour table of two entries (black, white); no background colour or aspect ratio.
    out.extend([0x80, 0, 0, 0, 0, 0, 255, 255, 255]);
    for _ in 0..frames {
      // Graphic control extension: the delay, no transparency.
      out.extend([0x21, 0xF9, 4, 0]);
      out.extend(delay_cs.to_le_bytes());
      out.extend([0, 0]);
      // Image descriptor (1x1 at 0,0), then LZW data for one pixel of colour 0.
      out.extend([0x2C, 0, 0, 0, 0, 1, 0, 1, 0, 0]);
      out.extend([2, 2, 0x44, 0x01, 0]);
    }
    out.push(0x3B);
    out
  }
}
