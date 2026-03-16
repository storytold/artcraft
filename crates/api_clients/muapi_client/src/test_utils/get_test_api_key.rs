use crate::creds::muapi_session::MuapiSession;
use errors::AnyhowResult;
use std::fs::read_to_string;

#[cfg(test)]
pub fn get_test_api_key() -> AnyhowResult<MuapiSession> {
  let api_key = read_to_string("/Users/bt/Artcraft/credentials/muapi_api_key.txt")?;
  let api_key = api_key.trim().to_string();
  Ok(MuapiSession::from_api_key_string(api_key))
}
