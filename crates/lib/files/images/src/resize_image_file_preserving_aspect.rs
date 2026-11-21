use std::path::Path;

use craft_image_codecs::{ChannelLayout, Image, SampleType};
use image::{DynamicImage, GrayAlphaImage, GrayImage, ImageBuffer, Luma, LumaA, Rgb, RgbImage, Rgba, RgbaImage};

use errors::{AnyhowResult, anyhow};

use crate::resize_preserving_aspect::resize_preserving_aspect;

fn craft_image_to_dynamic(image: Image) -> AnyhowResult<DynamicImage> {
  let (w, h) = image.dimensions();
  let layout = image.layout();
  let sample_type = image.sample_type();
  match (layout, sample_type) {
    (ChannelLayout::Gray, SampleType::U8) => Ok(DynamicImage::ImageLuma8(GrayImage::from_raw(w, h, image.into_data()).ok_or_else(|| anyhow!("invalid gray8 buffer"))?)),
    (ChannelLayout::GrayA, SampleType::U8) => Ok(DynamicImage::ImageLumaA8(GrayAlphaImage::from_raw(w, h, image.into_data()).ok_or_else(|| anyhow!("invalid grayA8 buffer"))?)),
    (ChannelLayout::Rgb, SampleType::U8) => Ok(DynamicImage::ImageRgb8(RgbImage::from_raw(w, h, image.into_data()).ok_or_else(|| anyhow!("invalid rgb8 buffer"))?)),
    (ChannelLayout::Rgba, SampleType::U8) => Ok(DynamicImage::ImageRgba8(RgbaImage::from_raw(w, h, image.into_data()).ok_or_else(|| anyhow!("invalid rgba8 buffer"))?)),
    (ChannelLayout::Gray, SampleType::U16) => {
      let samples = image.to_u16_samples().ok_or_else(|| anyhow!("could not read 16-bit image samples"))?;
      Ok(DynamicImage::ImageLuma16(ImageBuffer::<Luma<u16>, Vec<u16>>::from_raw(w, h, samples).ok_or_else(|| anyhow!("invalid gray16 buffer"))?))
    },
    (ChannelLayout::GrayA, SampleType::U16) => {
      let samples = image.to_u16_samples().ok_or_else(|| anyhow!("could not read 16-bit image samples"))?;
      Ok(DynamicImage::ImageLumaA16(ImageBuffer::<LumaA<u16>, Vec<u16>>::from_raw(w, h, samples).ok_or_else(|| anyhow!("invalid grayA16 buffer"))?))
    },
    (ChannelLayout::Rgb, SampleType::U16) => {
      let samples = image.to_u16_samples().ok_or_else(|| anyhow!("could not read 16-bit image samples"))?;
      Ok(DynamicImage::ImageRgb16(ImageBuffer::<Rgb<u16>, Vec<u16>>::from_raw(w, h, samples).ok_or_else(|| anyhow!("invalid rgb16 buffer"))?))
    },
    (ChannelLayout::Rgba, SampleType::U16) => {
      let samples = image.to_u16_samples().ok_or_else(|| anyhow!("could not read 16-bit image samples"))?;
      Ok(DynamicImage::ImageRgba16(ImageBuffer::<Rgba<u16>, Vec<u16>>::from_raw(w, h, samples).ok_or_else(|| anyhow!("invalid rgba16 buffer"))?))
    },
    _ => Ok(DynamicImage::ImageRgba8(RgbaImage::from_raw(w, h, image.to_rgba8()).ok_or_else(|| anyhow!("invalid rgba8 fallback buffer"))?)),
  }
}

pub fn resize_image_file_preserving_aspect<P: AsRef<Path>>(source_image_file: P, new_width: u32, new_height: u32, exact_fit: bool) -> AnyhowResult<DynamicImage> {
  let bytes = std::fs::read(source_image_file)?;
  let img = craft_image_to_dynamic(craft_image_codecs::decode(&bytes)?)?;

  Ok(resize_preserving_aspect(&img, new_width, new_height, exact_fit))
}

#[cfg(test)]
mod tests {
  use test_utils::test_file_path::test_file_path;

  use crate::resize_image_file_preserving_aspect::resize_image_file_preserving_aspect;

  #[test]
  fn test_happy_path() {
    // NB: The other function does most of the testing
    let path = test_file_path("test_data/image/mochi.jpg").unwrap();
    let image = resize_image_file_preserving_aspect(path, 100, 100, true).unwrap();
    assert_eq!(image.width(), 100);
    assert_eq!(image.height(), 100);
  }

  #[test]
  fn decodes_png_and_webp_files_via_shared_codecs() {
    use craft_image_codecs::{ChannelLayout, EncodeOptions, Format, Image, SampleType};
    let src = Image::from_raw(8, 4, ChannelLayout::Rgba, SampleType::U8, vec![90; 8 * 4 * 4]).unwrap();
    for (ext, format) in [("png", Format::Png), ("webp", Format::WebP)] {
      let bytes = craft_image_codecs::encode(&src, format, &EncodeOptions::default()).unwrap();
      let path = std::env::temp_dir().join(format!("artcraft-images-resize-test-{}.{ext}", std::process::id()));
      std::fs::write(&path, bytes).unwrap();
      let resized = resize_image_file_preserving_aspect(&path, 4, 4, false).unwrap();
      let _ = std::fs::remove_file(&path);
      assert_eq!((resized.width(), resized.height()), (4, 2));
    }
  }
}
