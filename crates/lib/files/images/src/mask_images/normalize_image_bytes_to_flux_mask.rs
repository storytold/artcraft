use crate::error::ImagesError;
use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};

pub struct PngBytes(pub Vec<u8>);

/// Normalize arbitrary image bytes to a PNG format image.
/// Make sure the bitmap is in the correct mask format.
pub fn normalize_image_bytes_to_flux_mask(arbitrary_image_bytes: &[u8]) -> Result<PngBytes, ImagesError> {
  let image = craft_image_codecs::decode(arbitrary_image_bytes)?;
  let (width, height) = image.dimensions();
  let mut rgba = if image.layout() == ChannelLayout::Rgba && image.sample_type() == SampleType::U8 { image.into_data() } else { image.to_rgba8() };

  for pixel in rgba.chunks_exact_mut(4) {
    if pixel[3] == 0 {
      // Alpha pixel is transparent: set to black (mask ignore region).
      pixel.copy_from_slice(&[0, 0, 0, 255]);
    } else {
      // Set to white (mask interest region).
      pixel.copy_from_slice(&[255, 255, 255, 255]);
    }
  }

  let mask = Image::from_raw(width, height, ChannelLayout::Rgba, SampleType::U8, rgba)?;
  let output_bytes = craft_image_codecs::encode(&mask, Format::Png, &EncodeOptions::default())?;

  Ok(PngBytes(output_bytes))
}

#[cfg(test)]
mod tests {
  use super::normalize_image_bytes_to_flux_mask;
  use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};

  #[test]
  fn normalizes_transparent_to_black_and_opaque_to_white() {
    let src = Image::from_raw(
      2,
      1,
      ChannelLayout::Rgba,
      SampleType::U8,
      vec![
        12, 34, 56, 0, // transparent -> black
        12, 34, 56, 1, // non-zero alpha -> white
      ],
    )
    .unwrap();
    let png = craft_image_codecs::encode(&src, Format::Png, &EncodeOptions::default()).unwrap();

    let mask = normalize_image_bytes_to_flux_mask(&png).unwrap();
    let decoded = craft_image_codecs::decode(&mask.0).unwrap();
    assert_eq!(decoded.dimensions(), (2, 1));
    assert_eq!(decoded.to_rgba8(), vec![0, 0, 0, 255, 255, 255, 255, 255]);
  }
}
