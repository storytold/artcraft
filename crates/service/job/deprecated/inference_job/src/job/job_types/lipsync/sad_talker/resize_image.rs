use std::path::{Path, PathBuf};

use log::info;
use tempdir::TempDir;

use errors::AnyhowResult;
use images::image::ImageFormat;
use images::resize_image_file_preserving_aspect::resize_image_file_preserving_aspect;

pub fn resize_image<P: AsRef<Path>>(
  input_file: P,
  tempdir: &TempDir,
  new_width: u32,
  new_height: u32
) -> AnyhowResult<PathBuf> {
  let image = resize_image_file_preserving_aspect(
    input_file,
    new_width,
    new_height,
    true
  )?;
  let output_file = tempdir.path().join("resized_image.png");

  info!("File successfully resized to {}x{} !", image.width(), image.height());

  image.save_with_format(&output_file, ImageFormat::Png)?;
  Ok(output_file)
}
