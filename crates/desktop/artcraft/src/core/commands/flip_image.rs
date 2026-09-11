use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageReader;
use std::io::Cursor;

#[tauri::command]
pub fn flip_image(image: &str) -> Result<String, String> {
  println!("infer_image called; processing image...");

  let bytes = BASE64_STANDARD.decode(image)
    .map_err(|err| format!("Base64 decode error: {}", err))?;

  let image = ImageReader::new(Cursor::new(bytes))
    .with_guessed_format()
    .map_err(|err| format!("Image format error: {}", err))?
    .decode()
    .map_err(|err| format!("Image decode error: {}", err))?;

  let rotated_image = image.rotate180();

  let mut buffer = Vec::new(); // TODO: Preallocate, better data structure
  let mut writer = Cursor::new(&mut buffer);

  let encoder = PngEncoder::new_with_quality
    (&mut writer, CompressionType::Fast, FilterType::Adaptive);
  
  rotated_image.write_with_encoder(encoder)
    .map_err(|err| format!("Image encoding error: {}", err))?;

  let encoded = BASE64_STANDARD.encode(&buffer);

  println!("Encoded: {:?}", encoded.split_at(10).0);

  Ok(encoded)
}
