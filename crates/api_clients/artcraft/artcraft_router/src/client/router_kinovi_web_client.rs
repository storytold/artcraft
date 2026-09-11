use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;

pub struct RouterKinoviWebClient {
  pub(crate) session: KinoviWebSession,
}

impl RouterKinoviWebClient {
  pub fn new(session: KinoviWebSession) -> Self {
    RouterKinoviWebClient { session }
  }
}
