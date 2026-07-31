use seedance2pro_web_client::creds::seedance2pro_session::Seedance2ProSession;

pub struct RouterSeedance2ProWebClient {
  pub(crate) session: Seedance2ProSession,
}

impl RouterSeedance2ProWebClient {
  pub fn new(session: Seedance2ProSession) -> Self {
    RouterSeedance2ProWebClient { session }
  }
}
