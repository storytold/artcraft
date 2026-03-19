use std::io::{BufReader, Cursor, Read, Seek};
use std::time::Duration;

use log::warn;
use mp4::TrackType;

use errors::AnyhowResult;

#[derive(Debug, Clone)]
pub struct Mp4Info {
  /// Framerate of the longest video track.
  pub framerate: f64,

  /// Duration of the entire mp4.
  pub duration_millis: u128,

  /// Width of the longest video track.
  pub width: u16,

  /// Height of the longest video track.
  pub height: u16,
}

#[deprecated(note = "The `mp4` crate doesn't handle a lot of real world mp4s. Transition to ffprobe instead.")]
pub fn get_mp4_info_for_bytes(file_bytes: &[u8]) -> AnyhowResult<Mp4Info> {
  get_mp4_info_for_bytes_and_len(file_bytes, file_bytes.len())
}

#[deprecated(note = "The `mp4` crate doesn't handle a lot of real world mp4s. Transition to ffprobe instead.")]
pub fn get_mp4_info_for_bytes_and_len(file_bytes: &[u8], file_size: usize) -> AnyhowResult<Mp4Info> {
  let reader = BufReader::new(Cursor::new(file_bytes));
  get_mp4_info(reader, file_size as u64)
}

#[deprecated(note = "The `mp4` crate doesn't handle a lot of real world mp4s. Transition to ffprobe instead.")]
pub fn get_mp4_info<T: Seek + Read>(reader: T, file_size: u64) -> AnyhowResult<Mp4Info> {
  let mp4 = mp4::Mp4Reader::read_header(reader, file_size)?;

  let mut longest_duration = Duration::from_secs(0);

  let mut framerate = 0.0;
  let mut width = 0;
  let mut height = 0;

  for track in mp4.tracks().values() {
    match track.track_type() {
      Ok(TrackType::Video) => {
        if track.duration() > longest_duration {
          longest_duration = track.duration();
          framerate = track.frame_rate();
          width = track.width();
          height = track.height();
        }
      }
      Err(err) => {
        warn!("Error determining track type: {:?}", err);
        continue;
      },
      _ => continue,
    }
  }

  Ok(Mp4Info {
    framerate,
    duration_millis: mp4.duration().as_millis(),
    width,
    height,
  })
}

#[cfg(test)]
pub mod tests {
  use std::fs::File;
  use std::io::BufReader;

  use test_utils::test_file_path::test_file_path;

  use crate::get_mp4_info::get_mp4_info;

  #[test]
  pub fn test_decode_mp4() {
    let filename = test_file_path("test_data/video/mp4/golden_sun_garoh.mp4")
        .expect("path should exist");

    let file = File::open(filename).expect("file should open");
    let size = file.metadata().expect("should be able to grab metadata").len();
    let reader = BufReader::new(file);

    let info = get_mp4_info(reader, size).expect("mp4 reader should work");

    assert_eq!(info.framerate, 30.0);
    assert_eq!(info.duration_millis, 15168);
    assert_eq!(info.width, 640);
    assert_eq!(info.height, 480);
  }
}
