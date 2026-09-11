use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum SoraClientError {
  /// An error reading the file for upload.
  FileForUploadReadError(std::io::Error),
  
  /// The file path provided for upload is invalid.
  FileForUploadHasInvalidPath,

  /// Something is wrong with the JWT bearer token.
  /// This error originates on our end as we try to parse the JWT.
  LocalJwtClaimsParseError(String),
  
  /// There was an error constructing the form-multipart request.
  MultipartFormError(wreq::Error),

  /// We haven't received a bearer token yet
  /// This is our own internal application state error, not something Sora returns.
  /// We know our client can't make the request, so we preemptively fail it.
  NoBearerTokenForRequest,
  
  /// A sentinel token is not present in the client, which is required for some requests.
  NoSentinelTokenForRequest,

  /// Issue with using the SoraCredentialBuilder.
  SoraCredentialBuilderError(&'static str),
  
  /// Error parsing a request URL.
  UrlParseError(url::ParseError),

  /// An error was encountered in building the Wreq client
  WreqClientError(wreq::Error),
  
  /// Error serializing the sentinel token to JSON
  CouldNotSerializeSentinelToken(serde_json::Error),

  /// Error serializing the sentinel store token to JSON (typically for persistent storage).
  CouldNotSerializeSentinelTokenStore(serde_json::Error),
  
  /// Error deserializing the sentinel token from JSON (typically for persistent storage).
  CouldNotDeserializeSentinelTokenStore { 
    error: serde_json::Error, 
    raw_json: String 
  },
}

impl Error for SoraClientError {}

impl Display for SoraClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::FileForUploadReadError(err) => write!(f, "Error reading file for upload: {}", err),
      Self::FileForUploadHasInvalidPath => write!(f, "The file path provided for upload is invalid."),
      Self::LocalJwtClaimsParseError(msg) => write!(f, "Local JWT claims parse error: {}", msg),
      Self::MultipartFormError(err) => write!(f, "Multipart form error: {}", err),
      Self::NoBearerTokenForRequest => write!(f, "No bearer token available. The client needs a bearer token to make the request."),
      Self::NoSentinelTokenForRequest => write!(f, "No sentinel token available. The client needs a sentinel token to make the request."),
      Self::SoraCredentialBuilderError(msg) => write!(f, "Sora Credential Builder error: {}", msg),
      Self::UrlParseError(err) => write!(f, "URL parse error: {}", err),
      Self::WreqClientError(err) => write!(f, "Wreq client error (during client creation): {}", err),
      Self::CouldNotSerializeSentinelToken(err) => write!(f, "Could not serialize sentinel token to JSON: {}", err),
      Self::CouldNotSerializeSentinelTokenStore(err) => write!(f, "Could not serialize sentinel token store to JSON: {}", err),
      Self::CouldNotDeserializeSentinelTokenStore { error, raw_json} => {
        write!(f, "Could not deserialize sentinel token store from JSON: {:?}, raw JSON: {}", error, raw_json)
      },
    }
  }
}
