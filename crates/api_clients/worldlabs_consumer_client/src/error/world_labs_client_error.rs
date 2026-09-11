use base64::DecodeError;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum WorldLabsClientError {

  /// An error was encountered in building the Wreq client
  WreqClientError(wreq::Error),
  
  /// Failed to parse JWT claims.
  FailedToParseJwtClaims(jwt_light::error::JwtError),

  /// Error serializing a message to send the websocket
  WebsocketRequestSerializationError(serde_json::Error),

  /// Error locking the websocket for sending/receiving
  WebsocketLockError,

  /// Error reading from a websocket.
  WebsocketReadError(wreq::Error),

  /// Error sending to an open websocket.
  WebsocketSendError(wreq::Error),

  /// Can't open a local file for uploading.
  CannotOpenLocalFileForUpload(std::io::Error),

  /// Can't read a local file for uploading.
  CannotReadLocalFileForUpload(std::io::Error),

  /// Couldn't write to the file
  CannotOpenLocalFileForWriting(std::io::Error),

  /// Couldn't write to the file
  CannotWriteLocalFile(std::io::Error),

  /// File for upload has an invalid path.
  FileForUploadHasInvalidPath,

  /// Error parsing HTML
  HtmlParsingError,
  
  /// Error decoding verification token
  FailedToDecodeVerificationToken(DecodeError),
  
  /// Verification token bytes are invalid
  InvalidVerificationTokenBytes,
  
  /// Our script logic is out of date
  ScriptLogicOutOfDate,

  /// Our script logic is out of date (SVG)
  ScriptSvgLogicOutOfDate,

  /// Our script logic is out of date (script 1)
  Script1LogicOutOfDate,

  /// Our script logic is out of date (script 2)
  Script2LogicOutOfDate,
  
  /// Our script logic is out of date (xsid script)
  ScriptXsidLogicOutOfDate,

  /// Signature algorithm isn't working with inputs
  BadSignatureInputs,
  
  /// Something is broken with timeout math
  TimeoutMathBroken,

  /// Can't make request because cookies aren't present
  NoCookiesPresent,

  /// Unknown error generating video
  ErrorGeneratingVideo,

//  /// An error reading the file for upload.
//  FileForUploadReadError(std::io::Error),
//
//  /// The file path provided for upload is invalid.
//  FileForUploadHasInvalidPath,
//
//  /// Something is wrong with the JWT bearer token.
//  /// This error originates on our end as we try to parse the JWT.
//  LocalJwtClaimsParseError(String),
//
//  /// There was an error constructing the form-multipart request.
//  MultipartFormError(wreq::Error),
//
//  /// We haven't received a bearer token yet
//  /// This is our own internal application state error, not something Sora returns.
//  /// We know our client can't make the request, so we preemptively fail it.
//  NoBearerTokenForRequest,
//
//  /// A sentinel token is not present in the client, which is required for some requests.
//  NoSentinelTokenForRequest,
//
//  /// Issue with using the SoraCredentialBuilder.
//  SoraCredentialBuilderError(&'static str),
//
//  /// Error parsing a request URL.
//  UrlParseError(url::ParseError),
//
//  /// Error serializing the sentinel store token to JSON (typically for persistent storage).
//  CouldNotSerializeSentinelTokenStore(serde_json::Error),
//
//  /// Error deserializing the sentinel token from JSON (typically for persistent storage).
//  CouldNotDeserializeSentinelTokenStore {
//    error: serde_json::Error,
//    raw_json: String
//  },
}

impl Error for WorldLabsClientError {}

impl Display for WorldLabsClientError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::WreqClientError(err) => write!(f, "Wreq client error (during client creation): {}", err),
      Self::FailedToParseJwtClaims(err) => write!(f, "Failed to parse JWT claims: {}", err),
      Self::WebsocketRequestSerializationError(err) => write!(f, "Websocket request serialization error: {}", err),
      Self::WebsocketLockError => write!(f, "Websocket lock error"),
      Self::WebsocketReadError(err) => write!(f, "Websocket read error: {}", err),
      Self::WebsocketSendError(err) => write!(f, "Websocket send error: {}", err),
      Self::CannotOpenLocalFileForUpload(err) => write!(f, "Cannot open local file for upload: {}", err),
      Self::CannotReadLocalFileForUpload(err) => write!(f, "Cannot read local file for upload: {}", err),
      Self::CannotOpenLocalFileForWriting(err) => write!(f, "Cannot open local file for writing: {}", err),
      Self::CannotWriteLocalFile(err) => write!(f, "Cannot write local file: {}", err),
      Self::FileForUploadHasInvalidPath => write!(f, "File for upload has invalid path"),
      Self::HtmlParsingError => write!(f, "Html parsing error"),
      Self::FailedToDecodeVerificationToken(err) => write!(f, "Failed to decode verification token: {}", err),
      Self::InvalidVerificationTokenBytes => write!(f, "Invalid verification token bytes"),
      Self::ScriptLogicOutOfDate => write!(f, "Script logic out of date"),
      Self::ScriptSvgLogicOutOfDate => write!(f, "Script logic out of date (SVG parsing)"),
      Self::Script1LogicOutOfDate => write!(f, "Script logic out of date (script 1)"),
      Self::Script2LogicOutOfDate => write!(f, "Script logic out of date (script 2)"),
      Self::ScriptXsidLogicOutOfDate => write!(f, "Script logic out of date (xsid script)"),
      Self::BadSignatureInputs => write!(f, "Bad signature inputs"),
      Self::TimeoutMathBroken => write!(f, "Timeout math is broken"),
      Self::NoCookiesPresent => write!(f, "No cookies present"),
      Self::ErrorGeneratingVideo => write!(f, "Error generating video"),

      //Self::FileForUploadReadError(err) => write!(f, "Error reading file for upload: {}", err),
      //Self::FileForUploadHasInvalidPath => write!(f, "The file path provided for upload is invalid."),
      //Self::LocalJwtClaimsParseError(msg) => write!(f, "Local JWT claims parse error: {}", msg),
      //Self::MultipartFormError(err) => write!(f, "Multipart form error: {}", err),
      //Self::NoBearerTokenForRequest => write!(f, "No bearer token available. The client needs a bearer token to make the request."),
      //Self::NoSentinelTokenForRequest => write!(f, "No sentinel token available. The client needs a sentinel token to make the request."),
      //Self::SoraCredentialBuilderError(msg) => write!(f, "Sora Credential Builder error: {}", msg),
      //Self::UrlParseError(err) => write!(f, "URL parse error: {}", err),
      //Self::CouldNotSerializeSentinelToken(err) => write!(f, "Could not serialize sentinel token to JSON: {}", err),
      //Self::CouldNotSerializeSentinelTokenStore(err) => write!(f, "Could not serialize sentinel token store to JSON: {}", err),
      //Self::CouldNotDeserializeSentinelTokenStore { error, raw_json} => {
      //  write!(f, "Could not deserialize sentinel token store from JSON: {:?}, raw JSON: {}", error, raw_json)
      //},
    }
  }
}
