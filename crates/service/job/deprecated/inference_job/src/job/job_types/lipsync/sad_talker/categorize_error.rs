use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub fn categorize_error(stderr_contents: &str) -> Option<ProcessSingleJobError> {
  if stderr_contents.contains("Face not detected in source image") ||
      stderr_contents.contains("can not detect the landmark from source image") ||
      stderr_contents.contains("face3d/extract_kp_videos_safe.py") ||
      stderr_contents.contains("cv2.error") {
    return Some(ProcessSingleJobError::FaceDetectionFailure);
  }
  None
}

#[cfg(test)]
mod tests {
  use anyhow::bail;

  use errors::AnyhowResult;

  use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
  use crate::job::job_types::lipsync::sad_talker::categorize_error::categorize_error;

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
    // TODO: I don't have the full stack trace for these anymore
    let trace = "Face not detected in source image";
    assert_face_tracking_error(categorize_error(trace)).unwrap();
  }

  #[test]
  fn stack_trace_1() {
    // Failure image example:
    // https://storage.googleapis.com/vocodes-public/media_upload/n/y/y/t/m/nyytmrzxs2jyczx8qsp65q1r4njp03zb/original_upload.bin
    // Cartoon hat obscures face
    let trace = r#"
        Traceback (most recent call last):
      File "/common/sadtalker-code/model_code/inference.py", line 175, in <module>
        main(args)
      File "/common/sadtalker-code/model_code/inference.py", line 71, in main
        first_coeff_path, crop_pic_path, crop_info =  preprocess_model.generate(pic_path, first_frame_dir, args.preprocess,\
      File "/common/sadtalker-code/model_code/src/utils/preprocess.py", line 124, in generate
        lm = self.propress.predictor.extract_keypoint(frames_pil, landmarks_path)
      File "/common/sadtalker-code/model_code/src/face3d/extract_kp_videos_safe.py", line 57, in extract_keypoint
        current_kp = self.extract_keypoint(image)
      File "/common/sadtalker-code/model_code/src/face3d/extract_kp_videos_safe.py", line 75, in extract_keypoint
        bboxes = bboxes[0]
    IndexError: index 0 is out of bounds for axis 0 with size 0
    "#;

    assert_face_tracking_error(categorize_error(trace)).unwrap();
  }

  #[test]
  fn stack_trace_2() {
    // Failure image example:
    // https://storage.googleapis.com/vocodes-public/media_upload/s/x/v/n/1/sxvn18fyyf9g8ywxyh92am1zc3zthpef/original_upload.bin
    // (Too small - 130x130)
    let trace = r#"
        OpenCV: FFMPEG: tag 0x5634504d/'MP4V' is not supported with codec id 12 and format 'mp4 / MP4 (MPEG-4 Part 14)'
    OpenCV: FFMPEG: fallback to use tag 0x7634706d/'mp4v'
seamlessClone::   0%|          | 0/322 [00:00<?, ?it/s]
    Traceback (most recent call last):
      File "/common/sadtalker-code/model_code/inference.py", line 175, in <module>
        main(args)
      File "/common/sadtalker-code/model_code/inference.py", line 112, in main
        result = animate_from_coeff.generate(data, save_dir, pic_path, crop_info, \
      File "/common/sadtalker-code/model_code/src/facerender/animate.py", line 230, in generate
        paste_pic(path, pic_path, crop_info, new_audio_path, full_video_path, extended_crop= True if 'ext' in preprocess.lower() else False)
      File "/common/sadtalker-code/model_code/src/utils/paste_pic.py", line 63, in paste_pic
        gen_img = cv2.seamlessClone(p, full_img, mask, location, cv2.NORMAL_CLONE)
    cv2.error: OpenCV(4.8.0) /io/opencv/modules/core/src/matrix.cpp:808: error: (-215:Assertion failed) 0 <= roi.x && 0 <= roi.width && roi.x + roi.width <= m.cols && 0 <= roi.y && 0 <= roi.height && roi.y + roi.height <= m.rows in function 'Mat'
    "#;

    assert_face_tracking_error(categorize_error(trace)).unwrap();
  }

  #[test]
  fn stack_trace_3() {
    // Failure image example:
    // https://storage.googleapis.com/vocodes-public/media_upload/s/h/h/a/6/shha6jn69d2km0wxys5yzk0ce85jwvw1/original_upload.bin
    // No idea what the issue is here
    let trace = r#"
        Traceback (most recent call last):
      File "/common/sadtalker-code/model_code/inference.py", line 175, in <module>
        main(args)
      File "/common/sadtalker-code/model_code/inference.py", line 71, in main
        first_coeff_path, crop_pic_path, crop_info =  preprocess_model.generate(pic_path, first_frame_dir, args.preprocess,\
      File "/common/sadtalker-code/model_code/src/utils/preprocess.py", line 124, in generate
        lm = self.propress.predictor.extract_keypoint(frames_pil, landmarks_path)
      File "/common/sadtalker-code/model_code/src/face3d/extract_kp_videos_safe.py", line 57, in extract_keypoint
        current_kp = self.extract_keypoint(image)
      File "/common/sadtalker-code/model_code/src/face3d/extract_kp_videos_safe.py", line 78, in extract_keypoint
        keypoints = landmark_98_to_68(self.detector.get_landmarks(img)) # [0]
      File "/common/sadtalker-code/model_code/src/face3d/util/my_awing_arch.py", line 363, in get_landmarks
        img = cv2.resize(img, (256, 256))
    cv2.error: OpenCV(4.8.0) /io/opencv/modules/imgproc/src/resize.cpp:4062: error: (-215:Assertion failed) !ssize.empty() in function 'resize'
    "#;

    assert_face_tracking_error(categorize_error(trace)).unwrap();
  }

  #[test]
  fn stack_trace_4() {
    // Failure image example:
    // https://storage.googleapis.com/vocodes-public/media_upload/s/h/h/a/6/shha6jn69d2km0wxys5yzk0ce85jwvw1/original_upload.bin
    // No idea what the issue is here
    let trace = r#"
        Traceback (most recent call last):
      File "/common/sadtalker-code/model_code/inference.py", line 175, in <module>
        main(args)
      File "/common/sadtalker-code/model_code/inference.py", line 71, in main
        first_coeff_path, crop_pic_path, crop_info =  preprocess_model.generate(pic_path, first_frame_dir, args.preprocess,\
      File "/common/sadtalker-code/model_code/src/utils/preprocess.py", line 103, in generate
        x_full_frames, crop, quad = self.propress.crop(x_full_frames, still=True if 'ext' in crop_or_resize.lower() else False, xsize=512)
      File "/common/sadtalker-code/model_code/src/utils/croper.py", line 131, in crop
        raise 'can not detect the landmark from source image'
    TypeError: exceptions must derive from BaseException
    "#;

    assert_face_tracking_error(categorize_error(trace)).unwrap();
  }
}
