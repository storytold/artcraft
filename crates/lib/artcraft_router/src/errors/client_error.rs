use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy)]
pub enum ClientType {
  Artcraft,
}

impl Display for ClientType {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Artcraft => write!(f, "Artcraft"),
    }
  }
}

#[derive(Debug)]
pub enum ClientError {
  /// The requested client is not configured on the RouterClient.
  ClientNotConfigured(ClientType),

  /// The model does not support the given option value.
  /// `field` is the request field name, `value` is what was requested.
  ModelDoesNotSupportOption { field: &'static str, value: String },

  /// The caller requested zero generations, which is never valid.
  UserRequestedZeroGenerations,

  /// ArtCraft only accepts media tokens for image inputs, not raw URLs.
  ArtcraftOnlySupportsMediaTokens,
}

impl Error for ClientError {}

impl Display for ClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::ClientNotConfigured(client_type) => {
        write!(f, "{} client is not configured on the RouterClient", client_type)
      }
      Self::ModelDoesNotSupportOption { field, value } => {
        write!(f, "Model does not support '{}' for field '{}'", value, field)
      }
      Self::UserRequestedZeroGenerations => {
        write!(f, "Cannot request zero generations")
      }
      Self::ArtcraftOnlySupportsMediaTokens => {
        write!(f, "ArtCraft only supports media tokens for image inputs; upload the image first to obtain a media token")
      }
    }
  }
}
