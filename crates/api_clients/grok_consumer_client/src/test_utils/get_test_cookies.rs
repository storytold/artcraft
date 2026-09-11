use crate::credentials::grok_cookies::GrokCookies;
use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub fn get_test_cookies() -> AnyhowResult<String> {
  let cookies = read_to_string("/Users/bt/Artcraft/credentials/grok_cookies.txt")?;
  let cookies = cookies.trim().to_string();
  Ok(cookies)
}

pub fn get_typed_test_cookies() -> AnyhowResult<GrokCookies> {
  let cookies = get_test_cookies()?;
  Ok(GrokCookies::new(cookies))
}
