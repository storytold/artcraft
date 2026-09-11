use crate::error::ImagesError;
use image::{GenericImage, GenericImageView, ImageFormat, ImageReader, Rgba};
use std::io::Cursor;

pub struct PngBytes(pub Vec<u8>);

/// Normalize arbitrary image bytes to a PNG format image.
/// Make sure the bitmap is in the correct mask format.
pub fn normalize_image_bytes_to_flux_mask(
  arbitrary_image_bytes: &[u8],
) -> Result<PngBytes, ImagesError> {

  let reader = ImageReader::new(Cursor::new(arbitrary_image_bytes));

  let mut image = reader
      .with_guessed_format()? // NB: Can raise IoError.
      .decode()?;

  let (width, height) = image.dimensions();

  for y in 0..height {
    for x in 0..width {
      let rgba_pixel = image.get_pixel(x, y);

      if rgba_pixel[3] == 0 {
        // Alpha pixel is transparent
        // Set to black. Mask ignore region.
        image.put_pixel(x, y, Rgba([0, 0, 0, 255]));
      } else {
        // Set to white. Mask interest region.
        image.put_pixel(x, y, Rgba([255, 255, 255, 255]));
      }
    }
  }

  let mut output_bytes: Vec<u8> = Vec::new();
  image.write_to(&mut Cursor::new(&mut output_bytes), ImageFormat::Png)?;

  Ok(PngBytes(output_bytes))
}
