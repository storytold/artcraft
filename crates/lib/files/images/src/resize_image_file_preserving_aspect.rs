use std::fs::File;
use std::io::BufReader;
use std::path::Path;

use image::DynamicImage;
use image::io::Reader;

use errors::AnyhowResult;

use crate::resize_preserving_aspect::resize_preserving_aspect;

pub fn resize_image_file_preserving_aspect<P: AsRef<Path>>(
  source_image_file: P,
  new_width: u32,
  new_height: u32,
  exact_fit: bool,
) -> AnyhowResult<DynamicImage> {
  let file = File::open(source_image_file)?;
  let reader = BufReader::new(file);

  let reader = Reader::new(reader)
      .with_guessed_format()?;

  let img = reader.decode()?;

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
}