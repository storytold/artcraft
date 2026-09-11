use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use image::{ImageFormat, RgbImage};
use std::io::Cursor;

pub fn encode_rgb_image_base64_png(
  image: RgbImage
) -> anyhow::Result<String> {
  let mut bytes = Vec::with_capacity(1024*1024);

  image.write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)?;

  let bytes = (&BASE64_STANDARD).encode(bytes);

  Ok(bytes)
}
