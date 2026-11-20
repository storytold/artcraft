use super::{MAX_DECODED_SIDE, decode, image_to_color_image, to_color_image};
use egui::Color32;
use image::codecs::png::PngEncoder;
use image::{DynamicImage, ExtendedColorType, ImageBuffer, ImageEncoder, Rgb};

#[test]
fn still_preview_averages_u16_before_rounding_to_rgba8() {
  let width = MAX_DECODED_SIDE * 2;
  let samples = (0..width * 2).flat_map(|i| {
    let sample = if i % 2 == 0 { 0 } else { 256 };
    [sample, sample, sample, u16::MAX]
  });
  let bytes = png16(width, 2, ExtendedColorType::Rgba16, samples);

  let preview = decode(&bytes).unwrap();
  assert_eq!(preview.size, [MAX_DECODED_SIDE as usize, 1]);
  assert_eq!(preview.pixels[0], Color32::BLACK);
  assert!(preview.pixels.iter().all(|&pixel| pixel == Color32::BLACK));
}

#[test]
fn still_preview_averages_u16_alpha_before_quantization() {
  let width = MAX_DECODED_SIDE * 2;
  let samples = (0..width * 2).flat_map(|i| [u16::MAX, if i % 2 == 0 { 0 } else { 256 }]);
  let bytes = png16(width, 2, ExtendedColorType::La16, samples);

  let preview = decode(&bytes).unwrap();
  assert_eq!(preview.size, [MAX_DECODED_SIDE as usize, 1]);
  assert_eq!(preview.pixels[0], Color32::TRANSPARENT);
  assert!(preview.pixels.iter().all(|&pixel| pixel == Color32::TRANSPARENT));
}

#[test]
fn still_preview_keeps_full_size_u16_conversion() {
  let bytes = png16(2, 1, ExtendedColorType::Rgba16, [0, 256, 32768, u16::MAX, u16::MAX, 0, 0, 0]);
  let preview = decode(&bytes).unwrap();

  assert_eq!(preview.size, [2, 1]);
  assert_eq!(preview.pixels, [Color32::from_rgb(0, 1, 128), Color32::TRANSPARENT]);
}

#[test]
fn u16_thumbnail_keeps_legacy_boxes_at_nonintegral_ratios() {
  let source = ImageBuffer::from_fn(16, 1, |x, _| Rgb([if x == 8 { u16::MAX } else { 0 }, 0, 4000 * x as u16]));
  let bytes = png16(16, 1, ExtendedColorType::Rgb16, source.as_raw().iter().copied());
  let expected = to_color_image(DynamicImage::ImageRgb16(source).thumbnail(14, 14).into_rgba8());

  let preview = image_to_color_image(craft_image_codecs::decode(&bytes).unwrap(), 14).unwrap();
  assert_eq!(preview.size, [14, 1]);
  assert_eq!(preview.pixels, expected.pixels);
}

#[test]
fn u16_thumbnail_handles_a_large_averaging_region() {
  let bytes = png16(257, 257, ExtendedColorType::L16, std::iter::repeat_n(u16::MAX, 257 * 257));
  let preview = image_to_color_image(craft_image_codecs::decode(&bytes).unwrap(), 1).unwrap();

  assert_eq!(preview.size, [1, 1]);
  assert_eq!(preview.pixels, [Color32::WHITE]);
}

fn png16(width: u32, height: u32, color: ExtendedColorType, samples: impl IntoIterator<Item = u16>) -> Vec<u8> {
  let raw: Vec<u8> = samples.into_iter().flat_map(u16::to_be_bytes).collect();
  let mut bytes = Vec::new();
  PngEncoder::new(&mut bytes).write_image(&raw, width, height, color).unwrap();
  bytes
}
