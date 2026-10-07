//! The app's video players (WebKit, WebView2) only play HEVC tagged `hvc1`. Seedance and AI MediaKit return
//! `hev1`-tagged MP4s, which show up black with no thumbnail. Retagging the sample entry fixes
//! that without touching the video data (the same as `ffmpeg -c copy -tag:v hvc1`).

const HEV1: &[u8; 4] = b"hev1";
const HVC1: &[u8; 4] = b"hvc1";

/// Boxes on the way from the file to the sample descriptions.
const CONTAINER_BOXES: [&[u8; 4]; 5] = [b"moov", b"trak", b"mdia", b"minf", b"stbl"];

/// `stsd` starts with version, flags and an entry count before its entries.
const STSD_PREAMBLE_LEN: usize = 8;

/// Retags `hev1` video sample entries as `hvc1` in place and returns how many changed. Anything
/// that isn't a well-formed MP4 is left alone.
pub fn retag_hevc_for_playback(mp4: &mut [u8]) -> usize {
  let mut changed = 0;
  retag_boxes(mp4, 0, mp4.len(), &mut changed);
  changed
}

fn retag_boxes(mp4: &mut [u8], start: usize, end: usize, changed: &mut usize) {
  let mut offset = start;
  while let Some(header) = read_box_header(mp4, offset, end) {
    if CONTAINER_BOXES.contains(&&header.box_type) {
      retag_boxes(mp4, header.body_start, header.end, changed);
    } else if &header.box_type == b"stsd" {
      retag_sample_entries(mp4, header.body_start + STSD_PREAMBLE_LEN, header.end, changed);
    }
    offset = header.end;
  }
}

fn retag_sample_entries(mp4: &mut [u8], start: usize, end: usize, changed: &mut usize) {
  let mut offset = start;
  while let Some(entry) = read_box_header(mp4, offset, end) {
    if &entry.box_type == HEV1 {
      mp4[offset + 4..offset + 8].copy_from_slice(HVC1);
      *changed += 1;
    }
    offset = entry.end;
  }
}

struct BoxHeader {
  box_type: [u8; 4],
  body_start: usize,
  end: usize,
}

/// The box at `offset`, when it fits before `end`.
fn read_box_header(mp4: &[u8], offset: usize, end: usize) -> Option<BoxHeader> {
  let field = |at: usize, len: usize| mp4.get(at..at.checked_add(len)?).filter(|_| at + len <= end);
  let size = u32::from_be_bytes(field(offset, 4)?.try_into().ok()?) as u64;
  let box_type: [u8; 4] = field(offset + 4, 4)?.try_into().ok()?;
  let (size, header_len) = match size {
    // Runs to the end of its parent.
    0 => ((end - offset) as u64, 8),
    // A 64-bit size follows the type.
    1 => (u64::from_be_bytes(field(offset + 8, 8)?.try_into().ok()?), 16),
    size => (size, 8),
  };
  if size < header_len as u64 {
    return None;
  }
  let box_end = offset.checked_add(usize::try_from(size).ok()?)?;
  (box_end <= end).then_some(BoxHeader { box_type, body_start: offset + header_len, end: box_end })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn retags_hevc_sample_entries_only() {
    let mut mp4 = [
      mp4_box(b"ftyp", b"isom"),
      mp4_box(b"mdat", b"....hev1...."),
      moov_with_entries(&[b"hev1", b"mp4a"]),
    ].concat();

    assert_eq!(retag_hevc_for_playback(&mut mp4), 1);
    let text = String::from_utf8_lossy(&mp4);
    assert!(text.contains("hvc1"));
    // Sample data isn't touched.
    assert!(text.contains("....hev1...."));
    assert!(text.contains("mp4a"));
    assert_eq!(retag_hevc_for_playback(&mut mp4), 0);
  }

  #[test]
  fn reads_64_bit_box_sizes() {
    let moov = moov_with_entries(&[b"hev1"]);
    let mut large = Vec::new();
    large.extend_from_slice(&1u32.to_be_bytes());
    large.extend_from_slice(b"moov");
    large.extend_from_slice(&(moov.len() as u64 + 8).to_be_bytes());
    large.extend_from_slice(&moov[8..]);

    assert_eq!(retag_hevc_for_playback(&mut large), 1);
  }

  #[test]
  fn leaves_other_data_alone() {
    let mut not_mp4 = b"hev1 is just text here".to_vec();
    assert_eq!(retag_hevc_for_playback(&mut not_mp4), 0);

    let mut truncated = moov_with_entries(&[b"hev1"]);
    truncated.truncate(truncated.len() - 4);
    let before = truncated.clone();
    assert_eq!(retag_hevc_for_playback(&mut truncated), 0);
    assert_eq!(truncated, before);

    assert_eq!(retag_hevc_for_playback(&mut []), 0);
  }

  // Manual: CREATIVE_LOFT_MP4_IN=<clip> CREATIVE_LOFT_MP4_OUT=<copy> cargo test -p artcraft
  // retags_a_real_file -- --ignored
  #[test]
  #[ignore]
  fn retags_a_real_file() {
    let input = std::env::var("CREATIVE_LOFT_MP4_IN").expect("CREATIVE_LOFT_MP4_IN");
    let output = std::env::var("CREATIVE_LOFT_MP4_OUT").expect("CREATIVE_LOFT_MP4_OUT");
    let mut bytes = std::fs::read(&input).unwrap();
    println!("retagged {} sample entries", retag_hevc_for_playback(&mut bytes));
    std::fs::write(&output, bytes).unwrap();
  }

  fn moov_with_entries(entry_types: &[&[u8; 4]]) -> Vec<u8> {
    let mut stsd_body = vec![0, 0, 0, 0];
    stsd_body.extend_from_slice(&(entry_types.len() as u32).to_be_bytes());
    for entry_type in entry_types {
      stsd_body.extend(mp4_box(entry_type, &[0u8; 16]));
    }
    let stbl = mp4_box(b"stbl", &mp4_box(b"stsd", &stsd_body));
    let trak = mp4_box(b"trak", &mp4_box(b"mdia", &mp4_box(b"minf", &stbl)));
    mp4_box(b"moov", &trak)
  }

  fn mp4_box(box_type: &[u8; 4], body: &[u8]) -> Vec<u8> {
    let mut out = ((body.len() + 8) as u32).to_be_bytes().to_vec();
    out.extend_from_slice(box_type);
    out.extend_from_slice(body);
    out
  }
}
