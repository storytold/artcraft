use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use image::{DynamicImage, ImageReader};
use std::io::Cursor;

pub fn decode_base64_image(base64_image: &str) -> anyhow::Result<DynamicImage> {
  let bytes = BASE64_STANDARD.decode(base64_image)?;

  let image = ImageReader::new(Cursor::new(bytes))
    .with_guessed_format()?
    .decode()?;

  Ok(image)
}
