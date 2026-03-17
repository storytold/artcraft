use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy)]
pub enum ClientType {
  Artcraft,
  Fal,
  Muapi,
  Seedance2Pro,
}

impl Display for ClientType {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Artcraft => write!(f, "Artcraft"),
      Self::Fal => write!(f, "Fal"),
      Self::Muapi => write!(f, "Muapi"),
      Self::Seedance2Pro => write!(f, "Seedance2Pro"),
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

  /// Fal only accepts image URLs for image inputs, not media tokens.
  FalOnlySupportsUrls,

  /// Muapi only accepts URLs for image inputs, not media tokens.
  MuapiOnlySupportsUrls,

  /// Seedance2Pro only accepts URLs for media inputs, not media tokens.
  Seedance2ProOnlySupportsUrls,
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
      Self::FalOnlySupportsUrls => {
        write!(f, "Fal only supports image URLs for image inputs, not media tokens")
      }
      Self::MuapiOnlySupportsUrls => {
        write!(f, "Muapi only supports URLs for image inputs; resolve media tokens to URLs before calling this provider")
      }
      Self::Seedance2ProOnlySupportsUrls => {
        write!(f, "Seedance2Pro only supports URLs for media inputs; resolve media tokens to URLs before calling this provider")
      }
    }
  }
}
