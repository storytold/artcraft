use lettre::{Message, SmtpTransport, Transport};
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::response::Response;

use errors::AnyhowResult;

#[derive(Clone)]
pub struct SmtpEmailSender {
  mailer: SmtpTransport,
}

impl SmtpEmailSender {

  // NB: To set this up for Gmail:
  //
  //  - https://support.google.com/a/answer/2956491?hl=en&fl=1&sjid=8333642123536524043-NA
  //
  // "Less secure apps" setting, which must be enabled at the organization level and within the
  // individual user account:
  //  - https://support.google.com/mail/thread/5621336/bad-credentials-using-gmail-smtp?hl=en
  //
  pub fn new(relay: &str, username: String, password: String) -> AnyhowResult<Self> {
    Ok(Self {
      mailer: SmtpTransport::relay(relay)?
          .credentials(Credentials::new(username, password))
          .build()
    })
  }

  pub fn send_message(&self, message: &Message) -> AnyhowResult<Response> {
    Ok(self.mailer.send(message)?)
  }
}
