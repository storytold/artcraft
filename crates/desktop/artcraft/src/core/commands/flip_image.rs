use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use craft_image_codecs::{EncodeOptions, Format, Image, PngCompression};

#[tauri::command]
pub fn flip_image(image: &str) -> Result<String, String> {
  println!("infer_image called; processing image...");

  let bytes = BASE64_STANDARD.decode(image).map_err(|err| format!("Base64 decode error: {}", err))?;

  let decoded = craft_image_codecs::decode(&bytes).map_err(|err| format!("Image decode error: {}", err))?;

  let rotated_image = rotate_image_180(decoded)?;

  let opts = EncodeOptions { png_compression: PngCompression::Fast, ..Default::default() };
  let buffer = craft_image_codecs::encode(&rotated_image, Format::Png, &opts).map_err(|err| format!("Image encoding error: {}", err))?;

  let encoded = BASE64_STANDARD.encode(&buffer);

  println!("Encoded: {:?}", encoded.get(..10).unwrap_or(&encoded));

  Ok(encoded)
}

fn rotate_image_180(image: Image) -> Result<Image, String> {
  let (width, height) = image.dimensions();
  let layout = image.layout();
  let sample_type = image.sample_type();
  let pixel_bytes = layout.channels() * sample_type.bytes();
  let data = image.into_data();
  let mut rotated = Vec::with_capacity(data.len());
  for pixel in data.chunks_exact(pixel_bytes).rev() {
    rotated.extend_from_slice(pixel);
  }
  Image::from_raw(width, height, layout, sample_type, rotated).map_err(|err| format!("Image rotate error: {}", err))
}

#[cfg(test)]
mod tests {
  use super::flip_image;
  use base64::Engine;
  use base64::prelude::BASE64_STANDARD;
  use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};

  #[test]
  fn flip_image_rotates_rgba8_png_180_degrees() {
    let pixels = vec![
      10, 20, 30, 255, // (0, 0)
      40, 50, 60, 255, // (1, 0)
      70, 80, 90, 255, // (0, 1)
      100, 110, 120, 255, // (1, 1)
    ];
    let src = Image::from_raw(2, 2, ChannelLayout::Rgba, SampleType::U8, pixels).unwrap();
    let png = craft_image_codecs::encode(&src, Format::Png, &EncodeOptions::default()).unwrap();

    let encoded = flip_image(&BASE64_STANDARD.encode(&png)).unwrap();
    let out_bytes = BASE64_STANDARD.decode(&encoded).unwrap();
    let out = craft_image_codecs::decode(&out_bytes).unwrap();

    assert_eq!(out.dimensions(), (2, 2));
    assert_eq!(
      out.to_rgba8(),
      vec![
        100, 110, 120, 255, //
        70, 80, 90, 255, //
        40, 50, 60, 255, //
        10, 20, 30, 255, //
      ]
    );
  }

  #[test]
  fn flip_image_preserves_u16_precision() {
    let samples: Vec<u16> = vec![
      100,
      200,
      300,
      u16::MAX, // (0, 0)
      400,
      500,
      600,
      u16::MAX, // (1, 0)
    ];
    let raw: Vec<u8> = samples.into_iter().flat_map(u16::to_ne_bytes).collect();
    let src = Image::from_raw(2, 1, ChannelLayout::Rgba, SampleType::U16, raw).unwrap();
    let png = craft_image_codecs::encode(&src, Format::Png, &EncodeOptions::default()).unwrap();

    let encoded = flip_image(&BASE64_STANDARD.encode(&png)).unwrap();
    let out_bytes = BASE64_STANDARD.decode(&encoded).unwrap();
    let out = craft_image_codecs::decode(&out_bytes).unwrap();

    assert_eq!(out.sample_type(), SampleType::U16);
    assert_eq!(out.to_u16_samples().unwrap(), vec![400, 500, 600, u16::MAX, 100, 200, 300, u16::MAX]);
  }

  #[test]
  fn flip_image_rejects_invalid_input() {
    assert!(flip_image("not-valid-base64!!!").is_err());
    assert!(flip_image(&BASE64_STANDARD.encode(b"not an image")).is_err());
  }
}
