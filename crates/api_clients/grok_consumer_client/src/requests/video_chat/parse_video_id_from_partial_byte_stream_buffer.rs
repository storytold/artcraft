use crate::datatypes::api::file_id::FileId;
use bstr::ByteSlice;
use once_cell::sync::Lazy;
use regex::Regex;

/// Find the video id in the response (which is streamed, appended JSON)
/// eg. {\"videoId\":\"34fa0313-3cde-4693-b046-319093374dbe\"
static JSON_REGEX: Lazy<Regex> = Lazy::new(|| {
  // NB: Should be a 36 character UUID.
  Regex::new(r#"\\?"videoI[dD]\\?":\s*\\?"([a-zA-Z0-9-]{25,})\\?",?"#)
      .expect("Regex should parse")
});

/// Look for this in the incomplete byte stream to try parsing it out.
const VIDEO_BYTES : &[u8] = b"videoI";

/// Parse the video ID from the streamed response
pub fn parse_video_id_from_partial_byte_stream_buffer(bytes: &[u8]) -> Option<FileId> {
  let found = bytes.find(VIDEO_BYTES).is_some();
  if !found {
    return None;
  }

  let partial_json = bytes.to_str_lossy();
  let maybe_meta = scrape_video_id_via_regex(&partial_json);

  if let Some(meta) = maybe_meta {
    return Some(FileId(meta))
  }

  None
}

fn scrape_video_id_via_regex(html: &str) -> Option<String> {
  let captures = JSON_REGEX.captures(html)?;
  let capture = captures.get(1)?;
  Some(capture.as_str().to_string())
}

#[cfg(test)]
mod tests {
  use crate::requests::video_chat::parse_video_id_from_partial_byte_stream_buffer::parse_video_id_from_partial_byte_stream_buffer;
  use errors::AnyhowResult;

  #[test]
  fn present_in_partial_bytes() -> AnyhowResult<()> {
    let partial_bytes = b"}}}\n{\"result\":{\"response\":{\"streamingVideoGenerationResponse\":{\"videoId\":\"34fa0313-3cde-4693-b046-319093374dbe\",\"pro";
    let video_id = parse_video_id_from_partial_byte_stream_buffer(partial_bytes).unwrap();
    let expected = "34fa0313-3cde-4693-b046-319093374dbe";
    assert_eq!(&video_id.0, expected);
    Ok(())
  }

  #[test]
  fn field_present_but_data_incomplete() -> AnyhowResult<()> {
    let partial_bytes = b"Response\":{\"videoId\":\"34fa0313-3cde-4693-b046-";
    let result = parse_video_id_from_partial_byte_stream_buffer(partial_bytes);
    assert!(result.is_none());
    Ok(())
  }

  #[test]
  fn not_present() -> AnyhowResult<()> {
    let partial_bytes = b"}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}]";
    let result = parse_video_id_from_partial_byte_stream_buffer(partial_bytes);
    assert!(result.is_none());
    Ok(())
  }
}
