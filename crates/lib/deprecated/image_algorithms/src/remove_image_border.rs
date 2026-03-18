use image::{DynamicImage, Pixel};
use errors::AnyhowResult;

pub fn remove_image_border(image: &DynamicImage) -> AnyhowResult<DynamicImage> {
  let mut image = image.to_rgba8();

  let mut top = 0u32;
  let mut bottom = image.height();
  let mut left = 0u32;
  let mut right = image.width();

  // TODO: Iterate with binary search - it'll probably be much faster.

  for (i, mut row) in image.rows().enumerate() {
    let count_non_transparent = row.filter(|pixel| pixel.0[3] != 0).count();
    if count_non_transparent < 5 {
      top = i as u32;
    } else {
      break;
    }
  }

  for (i, mut row) in image.rows().enumerate().rev() {
    //let all_transparent = row.all(|pixel| pixel.0[3] == 0);
    let count_non_transparent = row.filter(|pixel| pixel.0[3] != 0).count();
    //if all_transparent {
    if count_non_transparent < 5 {
      bottom = i as u32;
    } else {
      break;
    }
  }

  for (x, y, pixel) in image.enumerate_pixels() {
    
  }

  for (y, mut row) in image.enumerate_rows() {
    for (x, y, pixel) in row {
      
    }
  }


  let image = DynamicImage::ImageRgba8(image);

  let width = image.width();
  let height = bottom - top;

  println!("top: {},  bottom: {}", top, bottom);
  println!("orig width: {},  height: {}", image.width(), image.height());
  println!("new width: {},  height: {}", width, height);

  let image = image.crop_imm(0, top, width, height);

  Ok(image)
}

#[cfg(test)]
mod tests {
  use image::{ImageFormat, ImageReader};
  use errors::AnyhowResult;
  use testing::test_file_path::test_file_path;
  use crate::remove_image_border::remove_image_border;

  #[ignore] // NB: Not going to check these files into the repo. Just for manual testing.
  #[test]
  fn test_crop_image() -> AnyhowResult<()> {
    let filename = test_file_path("test_data/image/mario.png")?;
    let image = ImageReader::open(filename)?.decode()?;

    let image = remove_image_border(&image)?;

    image.save_with_format("testing_output.png", ImageFormat::Png)?;

    Ok(())
  }
}