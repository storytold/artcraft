use candle_core::{DType, Device, Tensor};

pub fn load_image_file_to_tensor<T: AsRef<std::path::Path>>(path: T, device: &Device) -> anyhow::Result<Tensor> {
  let img = image::ImageReader::open(path)?.decode()?;
  let (height, width) = (img.height() as usize, img.width() as usize);
  println!("INPUT IMAGE WIDTH AND HEIGHT: {}x{}", width, height);

  // TODO: Downscale from 1024 -- YES! THIS HACK DOES THE TRICK OF GETTING THE TENSOR SHAPE TO [1,4,64,64] !!
  let height = height / 2;
  let width = width  / 2;
  
  let height = height - height % 32;
  let width = width - width % 32;
  let img = img.resize_to_fill(
    width as u32,
    height as u32,
    image::imageops::FilterType::CatmullRom,
  );
  println!("RESIZED IMAGE WIDTH AND HEIGHT: {}x{}", width, height);
  let img = img.to_rgb8();
  let img = img.into_raw();
  let img = Tensor::from_vec(img, (height, width, 3), device)?
    .permute((2, 0, 1))?
    .to_dtype(DType::F32)?
    .affine(2. / 255., -1.)?
    .unsqueeze(0)?;
  Ok(img)
}
