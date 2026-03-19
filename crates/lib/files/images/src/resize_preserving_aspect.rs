use image::DynamicImage;
use image::imageops::FilterType;

/// Resize an image preserving the exact aspect ratio of the source image.
///
/// If `exact_fit` is true, the image will be resized to fit the largest dimension,
/// then cropped to fit the precise dimensions specified.
pub fn resize_preserving_aspect(
  source_image: &DynamicImage,
  new_width: u32,
  new_height: u32,
  exact_fit: bool,
) -> DynamicImage {
  if exact_fit {
    source_image.resize_to_fill(new_width, new_height, FilterType::Lanczos3)
  } else {
    source_image.resize(new_width, new_height, FilterType::Lanczos3)
  }
}

#[cfg(test)]
mod tests {
  use image::DynamicImage;

  use errors::AnyhowResult;
  use test_utils::test_file_path::test_file_path;

  use crate::resize_preserving_aspect::resize_preserving_aspect;

  fn open_test_image(filename: &str) -> AnyhowResult<DynamicImage> {
    let path = test_file_path(filename)?;
    Ok(image::open(path)?)
  }

  fn open_tall_image() -> AnyhowResult<DynamicImage> {
    let image = open_test_image("test_data/image/mochi.jpg").unwrap();
    assert!(image.width() < image.height());
    assert_eq!(image.width(), 753);
    assert_eq!(image.height(), 1000);
    Ok(image)
  }

  fn open_wide_image() -> AnyhowResult<DynamicImage> {
    let image = open_test_image("test_data/image/juno.jpg").unwrap();
    assert!(image.width() > image.height());
    assert_eq!(image.width(), 1000);
    assert_eq!(image.height(), 750);
    Ok(image)
  }

  #[test]
  fn downsize_wide_image_preserving_aspect() {
    let image = open_wide_image().unwrap();
    let resized = resize_preserving_aspect(&image, 500, 500, false);
    assert!(resized.width() > resized.height());
    assert_eq!(resized.width(), 500);
    assert_eq!(resized.height(), 375);
  }

  #[test]
  fn downsize_tall_image_preserving_aspect() {
    let image = open_tall_image().unwrap();
    let resized = resize_preserving_aspect(&image, 500, 500, false);
    assert!(resized.width() < resized.height());
    assert_eq!(resized.width(), 377);
    assert_eq!(resized.height(), 500);
  }

  #[test]
  fn enlarge_wide_image_preserving_aspect() {
    let image = open_wide_image().unwrap();
    let resized = resize_preserving_aspect(&image, 1200, 1200, false);
    assert!(resized.width() > resized.height());
    assert_eq!(resized.width(), 1200);
    assert_eq!(resized.height(), 900);
  }

  #[test]
  fn enlarge_tall_image_preserving_aspect() {
    let image = open_tall_image().unwrap();
    let resized = resize_preserving_aspect(&image, 1200, 1200, false);
    assert!(resized.width() < resized.height());
    assert_eq!(resized.width(), 904);
    assert_eq!(resized.height(), 1200);
  }

  #[test]
  fn resize_wide_image_preserving_aspect_exact() {
    // Downscale
    let image = open_wide_image().unwrap();
    let resized = resize_preserving_aspect(&image, 500, 500, true);
    assert_eq!(resized.width(), 500);
    assert_eq!(resized.height(), 500);

    // Upscale
    let resized = resize_preserving_aspect(&image, 1200, 1200, true);
    assert_eq!(resized.width(), 1200);
    assert_eq!(resized.height(), 1200);

    // Really wide
    let resized = resize_preserving_aspect(&image, 1200, 100, true);
    assert_eq!(resized.width(), 1200);
    assert_eq!(resized.height(), 100);

    // Really tall
    let resized = resize_preserving_aspect(&image, 100, 1200, true);
    assert_eq!(resized.width(), 100);
    assert_eq!(resized.height(), 1200);
  }

  #[test]
  fn resize_tall_image_preserving_aspect_exact() {
    // Downscale
    let image = open_tall_image().unwrap();
    let resized = resize_preserving_aspect(&image, 500, 500, true);
    assert_eq!(resized.width(), 500);
    assert_eq!(resized.height(), 500);

    // Upscale
    let resized = resize_preserving_aspect(&image, 1200, 1200, true);
    assert_eq!(resized.width(), 1200);
    assert_eq!(resized.height(), 1200);

    // Really wide
    let resized = resize_preserving_aspect(&image, 1200, 100, true);
    assert_eq!(resized.width(), 1200);
    assert_eq!(resized.height(), 100);

    // Really tall
    let resized = resize_preserving_aspect(&image, 100, 1200, true);
    assert_eq!(resized.width(), 100);
    assert_eq!(resized.height(), 1200);
  }
}
