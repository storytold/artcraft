use muapi_client::creds::muapi_session::MuapiSession;

pub struct RouterMuapiClient {
  pub(crate) session: MuapiSession,
}

impl RouterMuapiClient {
  pub fn new(session: MuapiSession) -> Self {
    RouterMuapiClient { session }
  }
}
