/// Type for User Emails
#[derive(Clone, Debug)]
pub struct UserEmail(pub String);

impl UserEmail {
  pub fn to_string(&self) -> String {
    self.0.clone()
  }
}
