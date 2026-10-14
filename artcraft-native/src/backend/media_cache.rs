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
/// Compressed and decoded budgets for animated previews. The decoded budget is cumulative across
/// source frames, while the pixel limit bounds the peak size of any one composited frame.
const ANIMATED_MAX_INPUT_BYTES: usize = 64 * 1024 * 1024;
const ANIMATED_MAX_DECODED_BYTES: u64 = 512 * 1024 * 1024;
const ANIMATED_MAX_FRAME_PIXELS: u64 = 16 * 1024 * 1024;
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

enum AnimationDecode {
  Frames(Vec<(ColorImage, f32)>),
  NotAnimated,
  Rejected,
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
  let bytes = if animated {
    read_bounded_response(response, ANIMATED_MAX_INPUT_BYTES).await?
  } else {
    response.bytes().await.ok()?.to_vec()
  };
  tokio::task::spawn_blocking(move || {
    if !animated {
      return decode(&bytes).map(Decoded::Still);
    }
    match decode_frames(&bytes) {
      AnimationDecode::Frames(frames) => Some(Decoded::Frames(frames)),
      AnimationDecode::NotAnimated => decode(&bytes).map(Decoded::Still),
      AnimationDecode::Rejected => None,
    }
  }).await.ok().flatten()
}

async fn read_bounded_response(mut response: reqwest::Response, max_bytes: usize) -> Option<Vec<u8>> {
  if let Some(length) = response.content_length() {
    if length > max_bytes as u64 {
      warn!("Animated preview download exceeds {max_bytes} byte input budget");
      return None;
    }
  }

  let capacity = response.content_length().unwrap_or(0).min(max_bytes as u64) as usize;
  let mut bytes = Vec::with_capacity(capacity);
  while let Some(chunk) = response.chunk().await.ok()? {
    if bytes.len().saturating_add(chunk.len()) > max_bytes {
      warn!("Animated preview download exceeds {max_bytes} byte input budget");
      return None;
    }
    bytes.extend_from_slice(&chunk);
  }
  Some(bytes)
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

struct SampledAnimationFrame {
  image: ColorImage,
  raw_secs: f32,
  source_frames: usize,
}

/// The frames of an animated GIF or WebP (subsampled to the budget).
fn decode_frames(bytes: &[u8]) -> AnimationDecode {
  let format = match image::guess_format(bytes) {
    Ok(format) => format,
    Err(_) => return AnimationDecode::NotAnimated,
  };

  match format {
    image::ImageFormat::Gif => {
      let decoder = match image::codecs::gif::GifDecoder::new(Cursor::new(bytes)) {
        Ok(decoder) => decoder,
        Err(err) => {
          warn!("Animated GIF decode setup failed: {err}");
          return AnimationDecode::Rejected;
        },
      };
      if !animation_dimensions_within_budget(decoder.dimensions(), ANIMATED_MAX_FRAME_PIXELS) {
        return AnimationDecode::Rejected;
      }
      sample_animation_frames(
        decoder.into_frames(),
        ANIMATED_MAX_FRAMES,
        ANIMATED_MAX_DECODED_BYTES,
        ANIMATED_MAX_FRAME_PIXELS,
      )
    },
    image::ImageFormat::WebP => {
      let decoder = match image::codecs::webp::WebPDecoder::new(Cursor::new(bytes)) {
        Ok(decoder) => decoder,
        Err(err) => {
          warn!("Animated WebP decode setup failed: {err}");
          return AnimationDecode::Rejected;
        },
      };
      if !decoder.has_animation() {
        return AnimationDecode::NotAnimated;
      }
      if !animation_dimensions_within_budget(decoder.dimensions(), ANIMATED_MAX_FRAME_PIXELS) {
        return AnimationDecode::Rejected;
      }
      sample_animation_frames(
        decoder.into_frames(),
        ANIMATED_MAX_FRAMES,
        ANIMATED_MAX_DECODED_BYTES,
        ANIMATED_MAX_FRAME_PIXELS,
      )
    },
    _ => AnimationDecode::NotAnimated,
  }
}

fn animation_dimensions_within_budget(dimensions: (u32, u32), max_frame_pixels: u64) -> bool {
  let pixels = u64::from(dimensions.0).checked_mul(u64::from(dimensions.1));
  match pixels {
    Some(pixels) if pixels <= max_frame_pixels => true,
    _ => {
      warn!("Animated preview dimensions exceed {max_frame_pixels} pixel budget");
      false
    },
  }
}

/// Incrementally decodes and samples an animation. At most `max_frames` thumbnails are retained.
/// When the source grows past the current sampling window, the stride doubles and existing
/// samples are compacted in pairs. This keeps the whole animation represented without collecting
/// every full-size source frame first.
fn sample_animation_frames<I>(
  frames: I,
  max_frames: usize,
  max_decoded_bytes: u64,
  max_frame_pixels: u64,
) -> AnimationDecode
where
  I: IntoIterator<Item = image::ImageResult<image::Frame>>,
{
  if max_frames == 0 {
    return AnimationDecode::Rejected;
  }

  let mut sampled = Vec::with_capacity(max_frames);
  let mut stride = 1usize;
  let mut source_frame_count = 0usize;
  let mut decoded_bytes = 0u64;

  for frame in frames {
    let frame = match frame {
      Ok(frame) => frame,
      Err(err) => {
        warn!("Animated preview frame decode failed: {err}");
        return AnimationDecode::Rejected;
      },
    };

    let pixels = match u64::from(frame.buffer().width()).checked_mul(u64::from(frame.buffer().height())) {
      Some(pixels) if pixels <= max_frame_pixels => pixels,
      _ => {
        warn!("Animated preview frame exceeds {max_frame_pixels} pixel budget");
        return AnimationDecode::Rejected;
      },
    };
    let frame_bytes = match pixels.checked_mul(4) {
      Some(frame_bytes) => frame_bytes,
      None => return AnimationDecode::Rejected,
    };
    decoded_bytes = match decoded_bytes.checked_add(frame_bytes) {
      Some(decoded_bytes) if decoded_bytes <= max_decoded_bytes => decoded_bytes,
      _ => {
        warn!("Animated preview exceeds {max_decoded_bytes} byte decoded budget");
        return AnimationDecode::Rejected;
      },
    };

    let index = source_frame_count;
    source_frame_count = match source_frame_count.checked_add(1) {
      Some(count) => count,
      None => return AnimationDecode::Rejected,
    };
    if index >= max_frames.saturating_mul(stride) {
      compact_animation_samples(&mut sampled);
      stride = match stride.checked_mul(2) {
        Some(stride) => stride,
        None => return AnimationDecode::Rejected,
      };
    }

    let (numer, denom) = frame.delay().numer_denom_ms();
    let raw_secs = numer as f32 / denom.max(1) as f32 / 1000.0;
    if index % stride == 0 {
      let image = image::DynamicImage::ImageRgba8(frame.into_buffer()).thumbnail(ANIMATED_SIDE, ANIMATED_SIDE);
      sampled.push(SampledAnimationFrame {
        image: to_color_image(image.to_rgba8()),
        raw_secs,
        source_frames: 1,
      });
    } else if let Some(last) = sampled.last_mut() {
      last.raw_secs += raw_secs;
      last.source_frames += 1;
    }
  }

  if source_frame_count < 2 {
    return AnimationDecode::NotAnimated;
  }

  AnimationDecode::Frames(sampled
    .into_iter()
    .map(|frame| {
      // Some encoders write 0 ms delays; browsers treat those as ~100 ms.
      let secs = if frame.raw_secs < 0.02 { 0.1 * frame.source_frames as f32 } else { frame.raw_secs };
      (frame.image, secs)
    })
    .collect())
}

fn compact_animation_samples(samples: &mut Vec<SampledAnimationFrame>) {
  let mut compacted = Vec::with_capacity(samples.len().div_ceil(2));
  let mut source = std::mem::take(samples).into_iter();
  while let Some(mut kept) = source.next() {
    if let Some(skipped) = source.next() {
      kept.raw_secs += skipped.raw_secs;
      kept.source_frames += skipped.source_frames;
    }
    compacted.push(kept);
  }
  *samples = compacted;
}

fn to_color_image(rgba: image::RgbaImage) -> ColorImage {
  let size = [rgba.width() as usize, rgba.height() as usize];
  ColorImage::from_rgba_unmultiplied(size, rgba.as_raw())
}

#[cfg(test)]
mod tests {
  use super::{ANIMATED_MAX_FRAMES, AnimationDecode, decode_frames, sample_animation_frames};
  use image::{Delay, Frame, Rgba, RgbaImage};
  use std::cell::Cell;

  fn test_frame(value: u8, delay_ms: u32) -> Frame {
    Frame::from_parts(
      RgbaImage::from_pixel(2, 2, Rgba([value, value, value, 255])),
      0,
      0,
      Delay::from_numer_denom_ms(delay_ms, 1),
    )
  }

  #[test]
  fn streaming_sampler_caps_retained_frames_and_preserves_duration() {
    let frames = (0..200).map(|i| Ok(test_frame(i as u8, 100)));
    let decoded = match sample_animation_frames(frames, 8, 1024 * 1024, 16) {
      AnimationDecode::Frames(frames) => frames,
      _ => panic!("animation should decode"),
    };

    assert!(decoded.len() <= 8);
    let total: f32 = decoded.iter().map(|(_, secs)| secs).sum();
    assert!((total - 20.0).abs() < 0.001, "duration was {total}");
  }

  #[test]
  fn streaming_sampler_stops_at_decoded_byte_budget() {
    let seen = Cell::new(0usize);
    let frames = (0..10).map(|i| {
      seen.set(seen.get() + 1);
      Ok(test_frame(i, 100))
    });

    assert!(matches!(
      sample_animation_frames(frames, 8, 32, 16),
      AnimationDecode::Rejected
    ));
    assert_eq!(seen.get(), 3);
  }

  #[test]
  fn streaming_sampler_rejects_oversized_frame() {
    let frame = Frame::from_parts(
      RgbaImage::from_pixel(4, 4, Rgba([0, 0, 0, 255])),
      0,
      0,
      Delay::from_numer_denom_ms(100, 1),
    );

    assert!(matches!(
      sample_animation_frames([Ok(frame)], 8, 1024, 8),
      AnimationDecode::Rejected
    ));
  }

  #[test]
  fn single_frame_is_treated_as_still_image() {
    assert!(matches!(
      sample_animation_frames([Ok(test_frame(1, 100))], 8, 1024, 16),
      AnimationDecode::NotAnimated
    ));
  }

  #[test]
  fn gif_decoder_uses_frame_budget() {
    let mut bytes = Vec::new();
    {
      let mut encoder = image::codecs::gif::GifEncoder::new(&mut bytes);
      encoder.encode_frames((0..64).map(|i| test_frame(i, 100))).unwrap();
    }

    let decoded = match decode_frames(&bytes) {
      AnimationDecode::Frames(frames) => frames,
      _ => panic!("GIF should decode as animation"),
    };
    assert!(decoded.len() <= ANIMATED_MAX_FRAMES);
  }
}
