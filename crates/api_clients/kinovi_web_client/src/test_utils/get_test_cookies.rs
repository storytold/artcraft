use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub fn get_test_cookies() -> AnyhowResult<String> {
  let cookies = read_to_string("/Users/bt/Artcraft/credentials/seedance2pro_cookies.txt")?;
  let cookies = cookies.trim().to_string();
  Ok(cookies)
}
