use anyhow::{Error as E, Result};
use candle_core::Tensor;
use image::{ImageBuffer, Rgb};

pub fn save_image_from_tensor<P: AsRef<std::path::Path>>(img: &Tensor, p: P) -> Result<()> {
  println!("Saving image to {:?}", p.as_ref());
  let p = p.as_ref();
  let (channel, height, width) = img.dims3()?;
  println!("Image dimensions: {}x{} with {} channels", width, height, channel);

  if channel != 3 {
    anyhow::bail!("save_image expects an input of shape (3, height, width)")
  }
  let img = img.permute((1, 2, 0))?.flatten_all()?;
  let pixels = img.to_vec1::<u8>()?;
  println!("Converting tensor to image buffer...");

  let image: ImageBuffer<Rgb<u8>, Vec<u8>> =
    match ImageBuffer::from_raw(width as u32, height as u32, pixels) {
      Some(image) => image,
      None => anyhow::bail!("error saving image {p:?}"),
    };
  println!("Successfully created image buffer");

  image.save(p).map_err(E::from)?;
  println!("Successfully saved image to disk");
  Ok(())
}
