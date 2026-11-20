use crate::error::ImagesError;
use craft_image_codecs::{EncodeOptions, Format};

pub fn webp_bytes_to_png_bytes(webp_bytes: &[u8]) -> Result<Vec<u8>, ImagesError> {
  let image = craft_image_codecs::decode(webp_bytes).or_else(|_| craft_image_codecs::decode_as(Format::WebP, webp_bytes))?;
  Ok(craft_image_codecs::encode(&image, Format::Png, &EncodeOptions::default())?)
}

#[cfg(test)]
mod tests {
  use super::webp_bytes_to_png_bytes;
  use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};

  #[test]
  fn converts_webp_to_png() {
    let src = Image::from_raw(2, 1, ChannelLayout::Rgba, SampleType::U8, vec![1, 2, 3, 255, 4, 5, 6, 255]).unwrap();
    let webp = craft_image_codecs::encode(&src, Format::WebP, &EncodeOptions::default()).unwrap();
    let png = webp_bytes_to_png_bytes(&webp).unwrap();
    let decoded = craft_image_codecs::decode(&png).unwrap();
    assert_eq!(decoded.dimensions(), (2, 1));
    assert_eq!(decoded.to_rgba8(), vec![1, 2, 3, 255, 4, 5, 6, 255]);
  }
}
