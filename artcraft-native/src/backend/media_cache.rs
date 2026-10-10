//! Images shown in the UI: CDN thumbnails and local previews, as GPU textures.
//!
//! Downloads run on the tokio runtime (a few at a time) and decode off the UI thread; the UI
//! uploads finished images in [`MediaCache::poll`]. Textures nobody has drawn for a while are
//! dropped once the cache grows past its budget, so long feeds don't hold every image forever.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::mpsc::{Receiver, Sender, channel};

use egui::{ColorImage, TextureHandle, TextureOptions};
use log::warn;
use tokio::runtime::Handle;
use tokio::sync::Semaphore;

/// How many images may download at once.
const MAX_CONCURRENT_DOWNLOADS: usize = 6;
/// Longest side of a decoded image; larger ones are downscaled before upload.
const MAX_DECODED_SIDE: u32 = 2048;
/// Textures kept even when unused (roughly two screens of thumbnails).
const SOFT_CAPACITY: usize = 160;
/// Frames an image may go undrawn before it can be evicted.
const EVICT_AFTER_FRAMES: u64 = 600;

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
  Loading { last_used: u64 },
  Ready { texture: TextureHandle, last_used: u64 },
  Failed,
}

struct Loaded {
  key: String,
  image: Option<ColorImage>,
}

impl MediaCache {
  pub fn new(rt: Handle, http: reqwest::Client) -> Self {
    let (tx, rx) = channel();
    Self { rt, http, limiter: Arc::new(Semaphore::new(MAX_CONCURRENT_DOWNLOADS)), tx, rx, entries: HashMap::new(), frame: 0 }
  }

  /// The texture for `url`, starting its download the first time it's asked for.
  pub fn get(&mut self, ctx: &egui::Context, url: &str) -> Lookup {
    let frame = self.frame;
    match self.entries.get_mut(url) {
      Some(Entry::Ready { texture, last_used }) => {
        *last_used = frame;
        Lookup::Ready(texture.clone())
      },
      Some(Entry::Loading { last_used }) => {
        *last_used = frame;
        Lookup::Loading
      },
      Some(Entry::Failed) => Lookup::Failed,
      None => {
        self.entries.insert(url.to_owned(), Entry::Loading { last_used: frame });
        self.spawn_download(ctx, url.to_owned());
        Lookup::Loading
      },
    }
  }

  /// Decodes `bytes` off the UI thread and registers the result under `key`.
  pub fn insert_bytes(&mut self, ctx: &egui::Context, key: &str, bytes: Arc<[u8]>) {
    if self.entries.contains_key(key) {
      return;
    }
    self.entries.insert(key.to_owned(), Entry::Loading { last_used: self.frame });
    let (tx, ctx, key) = (self.tx.clone(), ctx.clone(), key.to_owned());
    self.rt.spawn_blocking(move || {
      let image = decode(&bytes);
      let _ = tx.send(Loaded { key, image });
      ctx.request_repaint();
    });
  }

  /// Uploads finished downloads and evicts stale textures. Call once per frame.
  pub fn poll(&mut self, ctx: &egui::Context) {
    self.frame += 1;
    while let Ok(Loaded { key, image }) = self.rx.try_recv() {
      // Dropped while loading (evicted): don't resurrect it.
      let Some(entry) = self.entries.get_mut(&key) else {
        continue;
      };
      *entry = match image {
        Some(image) => Entry::Ready { texture: ctx.load_texture(&key, image, TextureOptions::LINEAR), last_used: self.frame },
        None => Entry::Failed,
      };
    }
    if self.entries.len() > SOFT_CAPACITY {
      let frame = self.frame;
      self.entries.retain(|_, e| match e {
        Entry::Ready { last_used, .. } | Entry::Loading { last_used } => frame.saturating_sub(*last_used) < EVICT_AFTER_FRAMES,
        Entry::Failed => true,
      });
    }
  }

  fn spawn_download(&self, ctx: &egui::Context, url: String) {
    let (http, limiter, tx, ctx) = (self.http.clone(), self.limiter.clone(), self.tx.clone(), ctx.clone());
    self.rt.spawn(async move {
      let image = match limiter.acquire_owned().await {
        Ok(_permit) => download(&http, &url).await,
        Err(_) => None,
      };
      let _ = tx.send(Loaded { key: url, image });
      ctx.request_repaint();
    });
  }
}

async fn download(http: &reqwest::Client, url: &str) -> Option<ColorImage> {
  let response = match http.get(url).send().await.and_then(|r| r.error_for_status()) {
    Ok(response) => response,
    Err(err) => {
      warn!("Image download failed for {url}: {err}");
      return None;
    },
  };
  let bytes = response.bytes().await.ok()?;
  tokio::task::spawn_blocking(move || decode(&bytes)).await.ok().flatten()
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
  let rgba = image.to_rgba8();
  let size = [rgba.width() as usize, rgba.height() as usize];
  Some(ColorImage::from_rgba_unmultiplied(size, rgba.as_raw()))
}
