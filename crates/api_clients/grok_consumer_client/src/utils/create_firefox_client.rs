use crate::error::grok_client_error::GrokClientError;
use wreq::Client;
use wreq_util::Emulation;

pub fn create_firefox_client() -> Result<Client, GrokClientError> {
  Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))
}
