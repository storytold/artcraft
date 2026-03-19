use crate::ml::background_removal::onnx_session::onnx_session;
use image::{imageops, DynamicImage};
use ndarray::{Array, CowArray};
use ort::Value;
use std::path::Path;
use image_algorithms::remove_image_border::remove_image_border;

pub async fn remove_image_background<P: AsRef<Path>>(model_path: P, image: DynamicImage) -> anyhow::Result<DynamicImage> {
  // NB: Real time needed cuDNN 9, but this uses cuDNN 8:
  // sudo apt-get install libcudnn8-dev libcudnn8
  // update-alternatives: warning: forcing reinstallation of alternative /usr/include/x86_64-linux-gnu/cudnn_v9.h because link group libcudnn is broken
  // update-alternatives: using /usr/include/x86_64-linux-gnu/cudnn_v8.h to provide /usr/include/cudnn.h (libcudnn) in manual mode
  let session = onnx_session(model_path.as_ref())?;
  let image = process_dynamic_image(&session, image)?;
  
  // Crop transparent border cruft away.
  let image = remove_image_border(&image)?;
  
  Ok(image)
}

fn process_dynamic_image(
  session: &ort::Session,
  dynamic_img: DynamicImage,
) -> Result<DynamicImage, anyhow::Error> {
  let input_shape = session.inputs[0]
    .dimensions()
    .map(|dim| dim.unwrap())
    .collect::<Vec<usize>>();
  let input_img = dynamic_img.into_rgba8();
  let scaling_factor = f32::min(
    1., // Avoid upscaling
    f32::min(
      input_shape[3] as f32 / input_img.width() as f32, // Width ratio
      input_shape[2] as f32 / input_img.height() as f32, // Height ratio
    ),
  );
  let mut resized_img = imageops::resize(
    &input_img,
    input_shape[3] as u32,
    input_shape[2] as u32,
    imageops::FilterType::Triangle,
  );
  let input_tensor = CowArray::from(
    Array::from_shape_fn(input_shape, |indices| {
      let mean = 128.;
      let std = 256.;

      (resized_img[(indices[3] as u32, indices[2] as u32)][indices[1]] as f32 - mean) / std
    })
      .into_dyn(),
  );
  let inputs = vec![Value::from_array(session.allocator(), &input_tensor)?];
  let outputs = session.run(inputs)?;
  let output_tensor = outputs[0].try_extract::<f32>()?;
  for (indices, alpha) in output_tensor.view().indexed_iter() {
    resized_img[(indices[3] as u32, indices[2] as u32)][3] = (alpha * 255.) as u8;
  }
  let output_img = imageops::resize(
    &resized_img,
    (input_img.width() as f32 * scaling_factor) as u32,
    (input_img.height() as f32 * scaling_factor) as u32,
    imageops::FilterType::Triangle,
  );
  Ok(DynamicImage::ImageRgba8(output_img))
}
