use base64::prelude::BASE64_STANDARD;
use base64::Engine;

pub fn web_base64_decode(base64_string: &str) -> Result<Vec<u8>, base64::DecodeError> {
  // Remove the data URL prefix if it exists
  // eg: "data:image/png;base64,..." 
  let base64_data = if base64_string.starts_with("data:") {
    base64_string.split(',').nth(1).unwrap_or(base64_string)
  } else {
    base64_string
  };

  BASE64_STANDARD.decode(base64_data)
}
