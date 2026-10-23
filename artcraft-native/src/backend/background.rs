//! Removing an image's background on this machine. A small salient-object model (U²-Netp, 4.5 MB,
//! Apache-2.0) runs through `tract`, so nothing is uploaded and no account or credits are needed.
//! The model is downloaded once into `~/Artcraft/models` and checked against a known hash.

use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver};

use image::imageops::FilterType;
use image::{GrayImage, Luma, RgbaImage};
use sha2::{Digest, Sha256};
use tokio::runtime::Handle;

use crate::backend::session;

const MODEL_URL: &str = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx";
const MODEL_SHA256: &str = "309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8";
const MODEL_FILE: &str = "u2netp.onnx";
/// The model looks at the picture squeezed into a square of this many pixels.
const MODEL_SIDE: u32 = 320;
const MEAN: [f32; 3] = [0.485, 0.456, 0.406];
const STD: [f32; 3] = [0.229, 0.224, 0.225];

/// What the worker is doing right now.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Stage {
  DownloadingModel,
  Removing,
}

pub enum Progress {
  Stage(Stage),
  Done(Result<RgbaImage, String>),
}

/// Removes the background of `image` on a worker thread; `ctx` wakes the UI on every update.
pub fn spawn(rt: Handle, ctx: egui::Context, image: RgbaImage) -> Receiver<Progress> {
  let (tx, rx) = channel();
  std::thread::spawn(move || {
    let send = |progress| {
      let _ = tx.send(progress);
      ctx.request_repaint();
    };
    let result = run(&rt, &image, &send);
    send(Progress::Done(result));
  });
  rx
}

fn run(rt: &Handle, image: &RgbaImage, send: &dyn Fn(Progress)) -> Result<RgbaImage, String> {
  let model = model_path();
  if !model.exists() {
    send(Progress::Stage(Stage::DownloadingModel));
    rt.block_on(download_model(&model))?;
  }
  send(Progress::Stage(Stage::Removing));
  let mask = predict(&model, image)?;
  Ok(apply_mask(image, &mask))
}

fn model_path() -> PathBuf {
  session::data_root().join("models").join(MODEL_FILE)
}

async fn download_model(path: &Path) -> Result<(), String> {
  let response = reqwest::get(MODEL_URL).await.and_then(|r| r.error_for_status()).map_err(|e| format!("couldn't download the model: {e}"))?;
  let bytes = response.bytes().await.map_err(|e| format!("couldn't download the model: {e}"))?;
  if sha256_hex(&bytes) != MODEL_SHA256 {
    return Err("the downloaded model is not the expected file".to_owned());
  }
  let dir = path.parent().ok_or("no folder for the model")?;
  std::fs::create_dir_all(dir).map_err(|e| format!("couldn't create {}: {e}", dir.display()))?;
  // Written under another name first, so a half-written file is never taken for the model.
  let partial = path.with_extension("part");
  std::fs::write(&partial, &bytes).and_then(|()| std::fs::rename(&partial, path)).map_err(|e| format!("couldn't save the model: {e}"))
}

/// How much of each pixel belongs to the subject, `MODEL_SIDE` squared values from 0 to 1.
fn predict(model: &Path, image: &RgbaImage) -> Result<Vec<f32>, String> {
  use tract_onnx::prelude::*;
  let side = MODEL_SIDE as usize;
  let fail = |e: TractError| format!("couldn't remove the background: {e}");
  let runnable = tract_onnx::onnx().model_for_path(model).and_then(|m| m.with_input_fact(0, f32::fact([1, 3, side, side]).into())).and_then(|m| m.into_optimized()).and_then(|m| m.into_runnable()).map_err(fail)?;
  let input = preprocess(image);
  let outputs = runnable.run(tvec!(input.into())).map_err(fail)?;
  let values: Vec<f32> = outputs[0].to_plain_array_view::<f32>().map_err(fail)?.iter().copied().collect();
  if values.len() != side * side {
    return Err("the model gave an unexpected result".to_owned());
  }
  // Stretch to the full 0..1 range so a faint subject still comes out solid.
  let (low, high) = values.iter().fold((f32::MAX, f32::MIN), |(low, high), v| (low.min(*v), high.max(*v)));
  Ok(values.iter().map(|v| (v - low) / (high - low).max(1e-6)).collect())
}

/// The picture squeezed to the model's square, scaled by its brightest value and normalised.
fn preprocess(image: &RgbaImage) -> tract_onnx::prelude::Tensor {
  use tract_onnx::prelude::*;
  let small = image::imageops::resize(image, MODEL_SIDE, MODEL_SIDE, FilterType::Triangle);
  let brightest = small.pixels().flat_map(|p| [p[0], p[1], p[2]]).max().unwrap_or(1).max(1) as f32;
  let side = MODEL_SIDE as usize;
  tract_ndarray::Array4::from_shape_fn((1, 3, side, side), |(_, channel, y, x)| (small.get_pixel(x as u32, y as u32)[channel] as f32 / brightest - MEAN[channel]) / STD[channel]).into()
}

/// The picture with the mask as its transparency; pixels that were already see-through stay so.
fn apply_mask(image: &RgbaImage, mask: &[f32]) -> RgbaImage {
  let small = GrayImage::from_fn(MODEL_SIDE, MODEL_SIDE, |x, y| Luma([(mask[(y * MODEL_SIDE + x) as usize].clamp(0.0, 1.0) * 255.0).round() as u8]));
  let full = image::imageops::resize(&small, image.width(), image.height(), FilterType::Triangle);
  RgbaImage::from_fn(image.width(), image.height(), |x, y| {
    let pixel = image.get_pixel(x, y);
    let alpha = (pixel[3] as u32 * full.get_pixel(x, y)[0] as u32 / 255) as u8;
    image::Rgba([pixel[0], pixel[1], pixel[2], alpha])
  })
}

fn sha256_hex(bytes: &[u8]) -> String {
  Sha256::digest(bytes).iter().map(|byte| format!("{byte:02x}")).collect()
}

#[cfg(test)]
mod tests {
  use super::*;

  const WHITE: image::Rgba<u8> = image::Rgba([255, 255, 255, 255]);

  #[test]
  fn the_mask_becomes_the_transparency() {
    let image = RgbaImage::from_pixel(4, 2, WHITE);
    let kept = apply_mask(&image, &vec![1.0; (MODEL_SIDE * MODEL_SIDE) as usize]);
    let removed = apply_mask(&image, &vec![0.0; (MODEL_SIDE * MODEL_SIDE) as usize]);
    assert!(kept.pixels().all(|p| p[3] == 255));
    assert!(removed.pixels().all(|p| p[3] == 0));
    assert_eq!(kept.dimensions(), (4, 2));
  }

  #[test]
  fn see_through_pixels_stay_see_through() {
    let image = RgbaImage::from_pixel(2, 2, image::Rgba([10, 20, 30, 100]));
    let kept = apply_mask(&image, &vec![1.0; (MODEL_SIDE * MODEL_SIDE) as usize]);
    assert!(kept.pixels().all(|p| p.0 == [10, 20, 30, 100]));
  }

  #[test]
  fn the_picture_is_normalised_for_the_model() {
    let input = preprocess(&RgbaImage::from_pixel(8, 8, WHITE));
    let side = MODEL_SIDE as usize;
    assert_eq!(input.shape(), [1, 3, side, side]);
    let view = input.to_plain_array_view::<f32>().unwrap();
    let values = view.as_slice().unwrap();
    assert!((values[5 * side + 5] - (1.0 - MEAN[0]) / STD[0]).abs() < 1e-4);
    assert!((values[2 * side * side + 5 * side + 5] - (1.0 - MEAN[2]) / STD[2]).abs() < 1e-4);
  }

  #[test]
  fn the_hash_is_lowercase_hex() {
    assert_eq!(sha256_hex(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  }

  /// Downloads the model on first use: `cargo test -p artcraft_native -- --ignored`.
  #[test]
  #[ignore = "needs network access the first time"]
  fn removes_the_background_of_a_generated_picture() {
    let image = RgbaImage::from_fn(200, 120, |x, y| if (x as i32 - 100).pow(2) + (y as i32 - 60).pow(2) < 1600 { image::Rgba([220, 40, 40, 255]) } else { image::Rgba([30, 30, 30, 255]) });
    let rt = tokio::runtime::Runtime::new().unwrap();
    let rx = spawn(rt.handle().clone(), egui::Context::default(), image);
    let result = loop {
      if let Progress::Done(result) = rx.recv_timeout(std::time::Duration::from_secs(120)).unwrap() {
        break result.unwrap();
      }
    };
    assert_eq!(result.dimensions(), (200, 120));
    assert!(result.get_pixel(100, 60)[3] > result.get_pixel(2, 2)[3], "the disc is kept more than the corner");
  }
}
