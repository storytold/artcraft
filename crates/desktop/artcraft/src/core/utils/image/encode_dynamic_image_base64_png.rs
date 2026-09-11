use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use image::{DynamicImage, ImageFormat};
use std::io::Cursor;

pub fn encode_dynamic_image_base64_png(image: DynamicImage) -> anyhow::Result<String> {
  let mut bytes = Vec::with_capacity(1024*1024);

  image.write_to(&mut Cursor::new(&mut bytes), ImageFormat::Png)?;

  let bytes = BASE64_STANDARD.encode(bytes);

  Ok(bytes)
}
