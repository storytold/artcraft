use crate::credentials::worldlabs_refresh_token::WorldLabsRefreshToken;
use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub (crate) fn get_test_refresh_token() -> AnyhowResult<String> {
  //let cookies = read_to_string("/home/bt/Artcraft/credentials/worldlabs_cookies.txt")?;
  let token = read_to_string("/Users/bt/Artcraft/credentials/worldlabs_refresh.txt")?;
  let token = token.trim().to_string();
  Ok(token)
}

#[cfg(test)]
pub (crate) fn get_typed_test_refresh_token() -> AnyhowResult<WorldLabsRefreshToken> {
  let token = get_test_refresh_token()?;
  Ok(WorldLabsRefreshToken::new(token))
}
