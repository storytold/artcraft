use crate::credentials::world_labs_cookies::WorldLabsCookies;
use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub (crate) fn get_test_cookies() -> AnyhowResult<String> {
  //let cookies = read_to_string("/home/bt/Artcraft/credentials/worldlabs_cookies.txt")?;
  let cookies = read_to_string("/Users/bt/Artcraft/credentials/worldlabs_cookies.txt")?;
  let cookies = cookies.trim().to_string();
  Ok(cookies)
}

#[cfg(test)]
pub (crate) fn get_typed_test_cookies() -> AnyhowResult<WorldLabsCookies> {
  let cookies = get_test_cookies()?;
  Ok(WorldLabsCookies::new(cookies))
}
