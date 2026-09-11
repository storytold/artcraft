
#[derive(Clone)]
pub struct Cookie {
  pub name: String,
  pub value: String,

  // TODO: Later.
  // pub domain: String,
  // pub path: String,
  // pub secure: bool,
  // pub http_only: bool,
  // pub expires: Option<String>,
}

impl Cookie {
  pub fn new(name: String, value: String) -> Self {
    Self { name, value }
  }

  pub fn new_from_str(name: &str, value: &str) -> Self {
    Self {
      name: name.to_string(),
      value: value.to_string(),
    }
  }

  pub fn name(&self) -> &str {
    &self.name
  }

  pub fn value(&self) -> &str {
    &self.value
  }
}
