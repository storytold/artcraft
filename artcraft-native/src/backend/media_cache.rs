//! Images shown in the UI: CDN thumbnails, animated video previews and local previews, as GPU
//! textures.
//!
//! Downloads run on the tokio runtime (a few at a time) and decode off the UI thread; the UI
//! uploads finished images in [`MediaCache::poll`]. Textures nobody has drawn for a while are
//! dropped once the cache grows past its budget, so long feeds don't hold every image forever.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::mpsc::{Receiver, Sender, channel};
use std::time::Duration;

use craft_image_codecs::{ChannelLayout, DecodeOptions, Format, Image, SampleType};
use egui::{ColorImage, TextureHandle, TextureOptions};
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
  let image = match craft_image_codecs::decode(bytes) {
    Ok(image) => image,
    Err(err) => {
      warn!("Image decode failed: {err}");
      return None;
    },
  };
  image_to_color_image(image, MAX_DECODED_SIDE)
}

/// The frames of an animated GIF or WebP (subsampled to the budget), or `None` when it isn't
/// animated.
fn decode_frames(bytes: &[u8]) -> Option<Vec<(ColorImage, f32)>> {
  let opts = DecodeOptions::default();
  let frames = match craft_image_codecs::detect(bytes)? {
    Format::Gif => craft_image_codecs::decode_gif_frames(bytes, &opts).ok()?,
    Format::WebP => {
      if !craft_image_codecs::webp_is_animated(bytes) {
        return None;
      }
      craft_image_codecs::decode_webp_frames(bytes, &opts).ok()?
    },
    _ => return None,
  };
  if frames.len() < 2 {
    return None;
  }
  // Keep every n-th frame, folding the skipped frames' time into the kept one.
  let step = frames.len().div_ceil(ANIMATED_MAX_FRAMES);
  let mut out = Vec::with_capacity(frames.len() / step + 1);
  let mut iter = frames.into_iter();
  while let Some(first) = iter.next() {
    let mut count = 1usize;
    let mut delay_ms = u64::from(first.delay_ms);
    for skipped in iter.by_ref().take(step - 1) {
      delay_ms = delay_ms.saturating_add(u64::from(skipped.delay_ms));
      count += 1;
    }
    let secs = delay_ms as f32 / 1000.0;
    // Some encoders write 0 ms delays; browsers treat those as ~100 ms.
    let delay = if secs < 0.02 { 0.1 * count as f32 } else { secs };
    out.push((image_to_color_image(first.image, ANIMATED_SIDE)?, delay));
  }
  Some(out)
}

fn image_to_color_image(image: Image, max_side: u32) -> Option<ColorImage> {
  let (w, h) = image.dimensions();
  let rgba_bytes = if image.layout() == ChannelLayout::Rgba && image.sample_type() == SampleType::U8 { image.into_data() } else { image.to_rgba8() };
  let rgba = image::RgbaImage::from_raw(w, h, rgba_bytes)?;
  let rgba = if w.max(h) > max_side { image::DynamicImage::ImageRgba8(rgba).thumbnail(max_side, max_side).into_rgba8() } else { rgba };
  Some(to_color_image(rgba))
}

fn to_color_image(rgba: image::RgbaImage) -> ColorImage {
  let size = [rgba.width() as usize, rgba.height() as usize];
  ColorImage::from_rgba_unmultiplied(size, rgba.as_raw())
}
