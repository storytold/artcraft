use std::error::Error;
use std::fmt::{Display, Formatter};

/// Errors from building/configuring a Pager instance.
#[derive(Debug)]
pub enum PagerBuilderError {
  /// The pager was not configured with a backend.
  NoBackendConfigured,
}

impl Error for PagerBuilderError {}

impl Display for PagerBuilderError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::NoBackendConfigured => write!(f, "No pager backend configured. Call .rootly() or .client_config() on PagerBuilder."),
    }
  }
}
