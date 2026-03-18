use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

pub struct RouterSeedance2ProClient {
  pub(crate) session: Seedance2ProSession,
}

impl RouterSeedance2ProClient {
  pub fn new(session: Seedance2ProSession) -> Self {
    RouterSeedance2ProClient { session }
  }
}
