use super::{ANIMATED_MAX_FRAMES, ANIMATED_SIDE, MAX_DECODED_SIDE, decode, decode_frames, image_to_color_image, to_color_image};
use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};
use egui::Color32;
use image::codecs::gif::GifEncoder;
use image::codecs::png::PngEncoder;
use image::{Delay, DynamicImage, ExtendedColorType, Frame, ImageBuffer, ImageEncoder, Rgb, RgbaImage};

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
  let raw: Vec<u8> = samples.into_iter().flat_map(u16::to_ne_bytes).collect();
  let mut bytes = Vec::new();
  PngEncoder::new(&mut bytes).write_image(&raw, width, height, color).unwrap();
  bytes
}

#[test]
fn static_png_jpeg_webp_gif_decode_and_downscale_parity() {
  let src = Image::from_raw(4, 2, ChannelLayout::Rgba, SampleType::U8, vec![64; 4 * 2 * 4]).unwrap();
  for format in [Format::Png, Format::Jpeg, Format::WebP, Format::Gif] {
    let encoded = craft_image_codecs::encode(&src, format, &EncodeOptions::default()).unwrap();
    let decoded = decode(&encoded).expect("decode static format");
    assert_eq!(decoded.size, [4, 2], "format={format:?}");
    assert!(decode_frames(&encoded).is_none() || matches!(format, Format::Gif) && decode_frames(&encoded).is_none(), "single-frame should not animate");
  }

  let large_w = MAX_DECODED_SIDE + 200;
  let large = Image::from_raw(large_w, 200, ChannelLayout::Rgba, SampleType::U8, vec![128; (large_w as usize) * 200 * 4]).unwrap();
  let large_png = craft_image_codecs::encode(&large, Format::Png, &EncodeOptions::default()).unwrap();
  let downscaled = decode(&large_png).expect("downscale large png");
  assert_eq!(downscaled.size[0], MAX_DECODED_SIDE as usize);
  assert!(downscaled.size[1] < 200);
}

fn encode_animated_gif(width: u32, height: u32, delays_ms: &[u32]) -> Vec<u8> {
  let mut bytes = Vec::new();
  {
    let mut enc = GifEncoder::new(&mut bytes);
    let frames = delays_ms.iter().enumerate().map(|(i, &delay_ms)| {
      let c = ((i * 40) % 255) as u8;
      let buf = RgbaImage::from_pixel(width, height, image::Rgba([c, 255 - c, 128, 255]));
      Frame::from_parts(buf, 0, 0, Delay::from_numer_denom_ms(delay_ms, 1))
    });
    enc.encode_frames(frames).unwrap();
  }
  bytes
}

#[test]
fn animated_gif_timing_subsampling_and_thumbnail_parity() {
  // 0 ms / 10 ms delays fall back to 100 ms (0.1 s); oversized frames downscale to ANIMATED_SIDE.
  let gif = encode_animated_gif(ANIMATED_SIDE * 2, ANIMATED_SIDE, &[0, 10, 50]);
  let frames = decode_frames(&gif).expect("animated gif frames");
  assert_eq!(frames.len(), 3);
  assert_eq!(frames[0].0.size, [ANIMATED_SIDE as usize, (ANIMATED_SIDE / 2) as usize]);
  assert!((frames[0].1 - 0.1).abs() < 1e-4);
  assert!((frames[1].1 - 0.1).abs() < 1e-4);
  assert!((frames[2].1 - 0.05).abs() < 1e-4);

  // When frame count exceeds ANIMATED_MAX_FRAMES, skipped frame delays fold into kept frames.
  let many_delays = vec![40_u32; ANIMATED_MAX_FRAMES + 10];
  let many_gif = encode_animated_gif(4, 4, &many_delays);
  let subsampled = decode_frames(&many_gif).expect("subsampled gif");
  assert!(subsampled.len() <= ANIMATED_MAX_FRAMES);
  let total_secs: f32 = subsampled.iter().map(|(_, d)| *d).sum();
  let expected_secs = (ANIMATED_MAX_FRAMES + 10) as f32 * 0.04;
  assert!((total_secs - expected_secs).abs() < 0.05, "total={total_secs} expected={expected_secs}");
}

fn encode_animated_webp(width: u32, height: u32, delays_ms: &[u32]) -> Vec<u8> {
  let mut body = Vec::new();
  body.extend_from_slice(b"WEBP");
  body.extend_from_slice(b"VP8X");
  body.extend_from_slice(&10_u32.to_le_bytes());
  body.extend_from_slice(&[0x12, 0, 0, 0]); // ANIM + ALPHA
  body.extend_from_slice(&(width - 1).to_le_bytes()[..3]);
  body.extend_from_slice(&(height - 1).to_le_bytes()[..3]);
  body.extend_from_slice(b"ANIM");
  body.extend_from_slice(&6_u32.to_le_bytes());
  body.extend_from_slice(&[0, 0, 0, 0, 0, 0]);

  for (i, &delay_ms) in delays_ms.iter().enumerate() {
    let img = Image::from_raw(width, height, ChannelLayout::Rgba, SampleType::U8, vec![(i * 60) as u8; (width * height * 4) as usize]).unwrap();
    let single = craft_image_codecs::encode(&img, Format::WebP, &EncodeOptions { webp_lossless: true, ..Default::default() }).unwrap();
    let vp8l_chunk = &single[12..];
    let mut anmf_payload = Vec::with_capacity(16 + vp8l_chunk.len());
    anmf_payload.extend_from_slice(&[0, 0, 0, 0, 0, 0]);
    anmf_payload.extend_from_slice(&(width - 1).to_le_bytes()[..3]);
    anmf_payload.extend_from_slice(&(height - 1).to_le_bytes()[..3]);
    anmf_payload.extend_from_slice(&delay_ms.to_le_bytes()[..3]);
    anmf_payload.push(0x02);
    anmf_payload.extend_from_slice(vp8l_chunk);
    body.extend_from_slice(b"ANMF");
    body.extend_from_slice(&(anmf_payload.len() as u32).to_le_bytes());
    body.extend_from_slice(&anmf_payload);
    if anmf_payload.len() % 2 == 1 {
      body.push(0);
    }
  }

  let mut riff = Vec::with_capacity(8 + body.len());
  riff.extend_from_slice(b"RIFF");
  riff.extend_from_slice(&(body.len() as u32).to_le_bytes());
  riff.extend_from_slice(&body);
  riff
}

#[test]
fn animated_webp_timing_and_thumbnail_parity() {
  let webp = encode_animated_webp(ANIMATED_SIDE * 2, ANIMATED_SIDE, &[30, 80]);
  let frames = decode_frames(&webp).expect("animated webp frames");
  assert_eq!(frames.len(), 2);
  assert_eq!(frames[0].0.size, [ANIMATED_SIDE as usize, (ANIMATED_SIDE / 2) as usize]);
  assert!((frames[0].1 - 0.03).abs() < 1e-4);
  assert!((frames[1].1 - 0.08).abs() < 1e-4);
}
