use candle_core::Tensor;
use image::{ImageBuffer, Rgb};

pub type RgbImage = ImageBuffer<Rgb<u8>, Vec<u8>>;

pub fn tensor_to_image_buffer(img: &Tensor) -> anyhow::Result<RgbImage> {
  let (channel, height, width) = img.dims3()?;

  if channel != 3 {
    anyhow::bail!("save_image expects an input of shape (3, height, width)")
  }

  let img = img.permute((1, 2, 0))?.flatten_all()?;
  let pixels = img.to_vec1::<u8>()?;

  ImageBuffer::from_raw(width as u32, height as u32, pixels)
    .ok_or_else(|| anyhow::anyhow!("error loading image from raw tensor"))
}
