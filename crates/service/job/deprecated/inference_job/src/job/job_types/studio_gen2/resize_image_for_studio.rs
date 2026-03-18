use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use anyhow::anyhow;
use images::image::io::Reader;
use images::resize_preserving_aspect::resize_preserving_aspect;
use log::info;
use std::fs::{read_to_string, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};

#[derive(Copy,Clone)]
pub enum ImageResizeType {
  AnimateX,
  StableAnimator,
}

pub struct Dimensions {
  pub width: u32,
  pub height: u32,
}

impl ImageResizeType {
  /// The maximum for the large dimension of a horizontal or vertical image
  fn max_large_dimension(&self) -> u32 {
    match self {
      ImageResizeType::AnimateX => 768,
      ImageResizeType::StableAnimator => 1024,
    }
  }
  /// The maximum for the small dimension of a horizontal or vertical image
  fn max_small_dimension(&self) -> u32 {
    match self {
      ImageResizeType::AnimateX => 512,
      ImageResizeType::StableAnimator => 576,
    }
  }
  /// The maximum dimension for a square image
  fn max_square_dimension(&self) -> u32 {
    512
  }
}

pub fn resize_image_for_studio(input_image_path: &Path, output_image_path: &Path, image_resize_type: ImageResizeType) -> Result<Dimensions, ProcessSingleJobError> {
  // NB(bt,2025-01-31): Using non-tokio blocking reads for now due to better compatability
  // with image processing libraries. We can update this in the future.
  let file = File::open(input_image_path)?;
  let reader = BufReader::new(file);

  let reader = Reader::new(reader)
      .with_guessed_format()?;

  let image = reader.decode()
      .map_err(|err| anyhow!("Could not decode image: {:?}", err))?;

  info!("Original image is {}x{}", image.width(), image.height());

  let width_bounds;
  let height_bounds;

  if image.width() > image.height() {
    width_bounds = image_resize_type.max_large_dimension();;
    height_bounds = image_resize_type.max_small_dimension();
  } else if image.height() > image.width() {
    width_bounds = image_resize_type.max_small_dimension();
    height_bounds = image_resize_type.max_large_dimension();
  } else {
    width_bounds = image_resize_type.max_square_dimension();
    height_bounds = image_resize_type.max_square_dimension();
  }

  info!("Desired resize bounds {}x{}", width_bounds, height_bounds);

  let resized_image = resize_preserving_aspect(&image, width_bounds, height_bounds, false);

  info!("Resized image to {}x{}", resized_image.width(), resized_image.height());

  resized_image.save(output_image_path)
      .map_err(|err| anyhow!("Could not save resized image to {:?}: {:?}", output_image_path, err))?;

  Ok(Dimensions {
    width: resized_image.width(),
    height: resized_image.height(),
  })
}
