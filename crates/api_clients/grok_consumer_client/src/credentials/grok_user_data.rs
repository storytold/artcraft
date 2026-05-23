use crate::datatypes::api::user_email::UserEmail;
use crate::datatypes::api::user_id::UserId;

#[derive(Clone)]
pub struct GrokUserData {
  /// From index.html
  /// Not strictly needed to sign requests, but typically needed to generate URLs.
  pub user_id: UserId,

  /// From index.html
  /// Not needed, but returned alongside other details.
  pub user_email: Option<UserEmail>,
}

impl GrokUserData {
  pub fn from_id_and_email(id: String, email: Option<String>) -> Self {
    Self {
      user_id: UserId(id),
      user_email: email.map(|email| UserEmail(email)),
    }
  }
}
