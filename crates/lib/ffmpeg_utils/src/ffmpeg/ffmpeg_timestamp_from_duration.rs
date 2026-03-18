use std::time::Duration;

/// Create an ffmpeg-formatted timestamp from a `Duration`.
/// This is useful for trimming videos with ffmpeg.
pub fn ffmpeg_timestamp_from_duration(duration: Duration) -> String {
  let seconds = duration.as_secs();
  let millis = duration.subsec_millis();

  let hours = seconds / 3600;
  let minutes = (seconds % 3600) / 60;
  let seconds = seconds % 60;

  if millis > 0 {
    format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, seconds, millis)
  } else {
    format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
  }
}

#[cfg(test)]
mod tests {
  use super::ffmpeg_timestamp_from_duration;
  use std::time::Duration;

  #[test]
  fn test_zero_duration() {
    let duration = Duration::new(0, 0);
    let expected = "00:00:00";
    let actual = ffmpeg_timestamp_from_duration(duration);
    assert_eq!(expected, actual);
  }

  #[test]
  fn test_one_hour() {
    let duration = Duration::new(3600, 0);
    let expected = "01:00:00";
    let actual = ffmpeg_timestamp_from_duration(duration);
    assert_eq!(expected, actual);
  }

  #[test]
  fn test_arbitrary_duration_1() {
    let duration = Duration::new(84751, 543_000_000);
    let expected = "23:32:31.543";
    let actual = ffmpeg_timestamp_from_duration(duration);
    assert_eq!(expected, actual);
  }

  #[test]
  fn test_arbitrary_duration_2() {
    let duration = Duration::new(65, 123_456_789);
    let expected = "00:01:05.123";
    let actual = ffmpeg_timestamp_from_duration(duration);
    assert_eq!(expected, actual);
  }
}
