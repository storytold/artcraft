use errors::AnyhowResult;
use std::path::Path;
use std::str::FromStr;

pub struct VideoInfo {
  pub dimensions: Option<VideoDimensions>,
  pub duration: Option<VideoDuration>,
  pub frame_rate: Option<VideoFrameRate>,
}

pub struct VideoDimensions {
  pub width: u64,
  pub height: u64,
}

pub struct VideoDuration {
  /// We have to convert ffprobe's seconds (with decimal) into milliseconds.
  /// We use a u32 as this can hold 49 days of milliseconds.
  pub millis: u32,

  /// This is the original value returned by ffprobe (for debugging).
  pub seconds_original: String,
}

pub struct VideoFrameRate {
  pub fps: f32,
  /// This is the original value returned by ffprobe (for debugging).
  pub fps_original: String,
}

pub fn ffprobe_get_info(
  video_path: impl AsRef<Path>
) -> AnyhowResult<VideoInfo>
{
  let result = ffprobe::ffprobe(video_path)?;

  let mut maybe_dimensions = None;
  let mut maybe_duration = None;
  let mut maybe_frame_rate = None;

  let video_streams = result.streams.iter()
      .filter(|stream| stream.codec_type.as_deref() == Some("video"));

  for stream in video_streams {
    // Grab the first video stream with dimensions and duration.
    if let (Some(width), Some(height), Some(duration)) =
        (stream.width, stream.height, stream.duration.as_deref())
    {
      maybe_dimensions = Some(VideoDimensions {
        width: width.unsigned_abs(),
        height: height.unsigned_abs(),
      });
      maybe_duration = Some(duration.to_string());
      // avg_frame_rate vs r_frame_rate: https://github.com/eugeneware/ffprobe/issues/7
      maybe_frame_rate = Some(stream.avg_frame_rate.to_string());
    }
  }

  let maybe_duration = match maybe_duration {
    None => None,
    Some(duration) => {
      let millis = parse_seconds(&duration)?;
      Some(VideoDuration {
        millis,
        seconds_original: duration,
      })
    }
  };

  let maybe_frame_rate = match maybe_frame_rate {
    None => None,
    Some(frame_rate) => {
      let fps = parse_fps(&frame_rate)?;
      Some(VideoFrameRate {
        fps,
        fps_original: frame_rate,
      })
    }
  };

  Ok(VideoInfo {
    dimensions: maybe_dimensions,
    duration: maybe_duration,
    frame_rate: maybe_frame_rate,
  })
}

fn parse_seconds(ffprobe_seconds: &str) -> AnyhowResult<u32> {
  let (seconds, decimal_seconds) = ffprobe_seconds.split_once('.')
      .unwrap_or_else(|| (ffprobe_seconds, ""));

  let seconds = u32::from_str(seconds)?;
  let milliseconds = seconds.saturating_mul(1000);

  let decimal_seconds = f32::from_str(&format!("0.{decimal_seconds}"))?;
  let remaining_millis = (decimal_seconds * 1000.0).round() as u32;

  let total_milliseconds = milliseconds.saturating_add(remaining_millis);
  Ok(total_milliseconds)
}

fn parse_fps(ffprobe_fps: &str) -> AnyhowResult<f32> {
  if let Some((num, denom)) = ffprobe_fps.split_once('/') {
    let num = f32::from_str(num)?;
    let denom = f32::from_str(denom)?;
    let fps = num / denom;
    return Ok(fps);
  }
  let fps = f32::from_str(ffprobe_fps)?;
  Ok(fps)
}

#[cfg(test)]
pub mod tests {
  use testing::test_file_path::test_file_path;

  use super::{ffprobe_get_info, parse_seconds};

  #[test]
  pub fn test_decode_mp4() {
    let filename = test_file_path("test_data/video/mp4/golden_sun_garoh.mp4")
        .expect("path should exist");

    let info = ffprobe_get_info(filename)
        .expect("should be able to read with ffprobe");

    let dimensions = info.dimensions.expect("video should have dimensions");

    assert_eq!(dimensions.width, 640);
    assert_eq!(dimensions.height, 480);
    assert_eq!(info.duration.unwrap().millis, 15133);
    assert_eq!(info.frame_rate.unwrap().fps, 30.0);
  }

  mod parse_seconds {
    use super::*;

    #[test]
    pub fn one_second() {
      let seconds = "1.000";
      let millis = parse_seconds(seconds).expect("should be able to parse seconds");
      assert_eq!(millis, 1000);
    }

    #[test]
    pub fn seconds_no_decimal() {
      // NB: I'm not sure if ffprobe returns data like this. Just covering all bases.
      let seconds = "5.";
      let millis = parse_seconds(seconds).expect("should be able to parse seconds");
      assert_eq!(millis, 5000);
    }

    #[test]
    pub fn seconds_no_period() {
      // NB: I'm not sure if ffprobe returns data like this. Just covering all bases.
      let seconds = "123";
      let millis = parse_seconds(seconds).expect("should be able to parse seconds");
      assert_eq!(millis, 123000);
    }

    #[test]
    pub fn real_data() {
      // Duration: 00:00:26.23, start: 0.000000, bitrate: 1007 kb/s
      let seconds = "26.226200";
      let millis = parse_seconds(seconds).expect("should be able to parse seconds");
      assert_eq!(millis, 26226);
    }
  }
}
