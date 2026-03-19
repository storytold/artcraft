use anyhow::Result;
use candle_core::{DType, Device, Tensor};

pub fn load_image_file_to_tensor_2<T: AsRef<std::path::Path>>(path: T) -> Result<Tensor> {
  let img = image::ImageReader::open(path)?.decode()?;
  let (height, width) = (img.height() as usize, img.width() as usize);
  let height = height - height % 32;
  let width = width - width % 32;
  let img = img.resize_to_fill(width as u32, height as u32, image::imageops::FilterType::CatmullRom);
  let img = img.to_rgb8();
  let img = img.into_raw();
  let img = Tensor::from_vec(img, (height, width, 3), &Device::Cpu)?
    .permute((2, 0, 1))?
    .to_dtype(DType::F32)?
    .affine(2. / 255., -1.)?
    .unsqueeze(0)?;
  Ok(img)
}
