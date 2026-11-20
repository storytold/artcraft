use crate::error::ImagesError;
use craft_image_codecs::{EncodeOptions, Format};

pub struct PngBytesWithDimensions {
  pub png_bytes: Vec<u8>,
  pub width: u32,
  pub height: u32,
}

pub fn image_bytes_to_png_bytes_with_dimensions(arbitrary_image_bytes: &[u8]) -> Result<PngBytesWithDimensions, ImagesError> {
  let image = craft_image_codecs::decode(arbitrary_image_bytes)?;
  let (width, height) = image.dimensions();
  let png_bytes = craft_image_codecs::encode(&image, Format::Png, &EncodeOptions::default())?;

  Ok(PngBytesWithDimensions { png_bytes, width, height })
}

#[cfg(test)]
mod tests {
  use super::image_bytes_to_png_bytes_with_dimensions;
  use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};

  #[test]
  fn returns_png_bytes_and_dimensions() {
    let src = Image::from_raw(3, 2, ChannelLayout::Rgb, SampleType::U8, vec![128; 3 * 2 * 3]).unwrap();
    let jpeg = craft_image_codecs::encode(&src, Format::Jpeg, &EncodeOptions::default()).unwrap();
    let res = image_bytes_to_png_bytes_with_dimensions(&jpeg).unwrap();
    assert_eq!((res.width, res.height), (3, 2));
    assert_eq!(craft_image_codecs::probe_size(&res.png_bytes).unwrap(), (3, 2));
  }
}
