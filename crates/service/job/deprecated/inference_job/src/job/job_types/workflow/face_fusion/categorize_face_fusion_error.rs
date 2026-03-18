use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub fn categorize_face_fusion_error(stderr_contents: &str) -> Option<ProcessSingleJobError> {
  if stderr_contents.contains("No face detected in the source image!") ||
      stderr_contents.contains("Error in LivePortraitCropper") {
    return Some(ProcessSingleJobError::FaceDetectionFailure);
  }
  None
}

#[cfg(test)]
mod tests {
  use anyhow::bail;

  use errors::AnyhowResult;

  use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
  use crate::job::job_types::workflow::face_fusion::categorize_face_fusion_error::categorize_face_fusion_error;

  fn assert_face_tracking_error(maybe_error: Option<ProcessSingleJobError>) -> AnyhowResult<()> {
    // NB: We have to do this since ProcessSingleJobError can't derive `PartialEq`
    match maybe_error {
      Some(ProcessSingleJobError::FaceDetectionFailure) => Ok(()),
      None => bail!("error is absent"),
      Some(_) => bail!("error is wrong type"),
    }
  }

  #[test]
  fn stack_trace_0() {
    // Failure video:
    // https://staging.fakeyou.com/media/m_xwphfcm7y8eh4dabva24sd5hwqm6z2
    let trace = r#"
    FaceAnalysisDIY warmup time: 1.020s
Detecting and cropping..:   0%|          | 0/170 [00:00<?, ?it/s]
!!! Exception during processing!!! No face detected in the source image!
Traceback (most recent call last):
  File "/app/ComfyUI/execution.py", line 151, in recursive_execute
    output_data, output_ui = get_output_data(obj, input_data_all)
  File "/app/ComfyUI/execution.py", line 81, in get_output_data
    return_values = map_node_over_list(obj, input_data_all, obj.FUNCTION, allow_interrupt=True)
  File "/app/ComfyUI/execution.py", line 74, in map_node_over_list
    results.append(getattr(obj, func)(**slice_dict(input_data_all, i)))
  File "/app/ComfyUI/custom_nodes/ComfyUI-LivePortraitKJ/nodes.py", line 408, in process
    crop_info = self.cropper.crop_single_image(source_image_np[i], dsize, scale, vy_ratio, vx_ratio, face_index, rotate)
  File "/app/ComfyUI/custom_nodes/ComfyUI-LivePortraitKJ/liveportrait/utils/cropper.py", line 55, in crop_single_image
    raise Exception("No face detected in the source image!")
Exception: No face detected in the source image!
    "#;

    assert_face_tracking_error(categorize_face_fusion_error(trace)).unwrap();
  }
}
