use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub (crate) fn get_test_bearer_token_raw() -> AnyhowResult<String> {
  let cookies = read_to_string("/Users/bt/Artcraft/credentials/worldlabs_bearer.txt")?;
  //let cookies = read_to_string("/home/bt/Artcraft/credentials/world_labs_bearer.txt")?;
  let cookies = cookies.trim().to_string();
  Ok(cookies)
}

#[cfg(test)]
pub (crate) fn get_test_bearer_token() -> AnyhowResult<WorldLabsBearerToken> {
  let cookies = get_test_bearer_token_raw()?;
  Ok(WorldLabsBearerToken::new(cookies))
}
