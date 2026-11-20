use crate::error::ImagesError;
use craft_image_codecs::{EncodeOptions, Format};

pub fn image_bytes_to_png_bytes(arbitrary_image_bytes: &[u8]) -> Result<Vec<u8>, ImagesError> {
  let image = craft_image_codecs::decode(arbitrary_image_bytes)?;
  Ok(craft_image_codecs::encode(&image, Format::Png, &EncodeOptions::default())?)
}

#[cfg(test)]
mod tests {
  use super::image_bytes_to_png_bytes;
  use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};

  #[test]
  fn converts_webp_and_preserves_u16_png() {
    let src8 = Image::from_raw(2, 1, ChannelLayout::Rgba, SampleType::U8, vec![10, 20, 30, 255, 40, 50, 60, 255]).unwrap();
    let webp = craft_image_codecs::encode(&src8, Format::WebP, &EncodeOptions::default()).unwrap();
    let png = image_bytes_to_png_bytes(&webp).unwrap();
    let decoded = craft_image_codecs::decode(&png).unwrap();
    assert_eq!(decoded.dimensions(), (2, 1));
    assert_eq!(decoded.to_rgba8(), vec![10, 20, 30, 255, 40, 50, 60, 255]);

    let raw16: Vec<u8> = [100_u16, 200, 300, u16::MAX].into_iter().flat_map(u16::to_ne_bytes).collect();
    let src16 = Image::from_raw(1, 1, ChannelLayout::Rgba, SampleType::U16, raw16).unwrap();
    let png16 = craft_image_codecs::encode(&src16, Format::Png, &EncodeOptions::default()).unwrap();
    let out16 = image_bytes_to_png_bytes(&png16).unwrap();
    let decoded16 = craft_image_codecs::decode(&out16).unwrap();
    assert_eq!(decoded16.sample_type(), SampleType::U16);
    assert_eq!(decoded16.to_u16_samples().unwrap(), vec![100, 200, 300, u16::MAX]);
  }
}
