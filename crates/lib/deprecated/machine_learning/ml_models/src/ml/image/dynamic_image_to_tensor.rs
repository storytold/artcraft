use anyhow::Result;
use candle_core::{DType, Device, Tensor};
use image::DynamicImage;

pub fn dynamic_image_to_tensor(image: &DynamicImage, device: &Device, datatype: DType) -> Result<Tensor> {
  let (height, width) = (image.height() as usize, image.width() as usize);
  let height = height - height % 32;
  let width = width - width % 32;
  let image = image.resize_to_fill(width as u32, height as u32, image::imageops::FilterType::CatmullRom);
  let image = image.to_rgb8();
  let image = image.into_raw();
  Ok(Tensor::from_vec(image, (height, width, 3), device)?
    .permute((2, 0, 1))?
    .to_dtype(datatype)?
    .affine(2. / 255., -1.)?
    .unsqueeze(0)?)
}
