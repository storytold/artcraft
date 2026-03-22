use utoipa::ToSchema;

/// A forward-compatible version of `FrontendFailureCategory` for API clients.
///
/// Contains all known variants plus an `Unknown(String)` catch-all so that
/// newer server-side values never cause deserialization failures on the client.
#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FrontendFailureCategoryForApiClients {
  FaceNotDetected,
  KeepAliveElapsed,
  NotYetImplemented,
  RetryableWorkerError,
  ModelRulesViolation,
  RuleBansUserImage,
  RuleBansUserImageWithFaces,
  RuleBansUserTextPrompt,
  RuleBansUserContent,
  RuleBansGeneratedVideo,
  RuleBansGeneratedAudio,
  RuleBansGeneratedContent,
  GenerationFailed,

  /// Catch-all for values the client doesn't yet know about.
  /// The contained string is the raw serialized value from the server.
  #[serde(untagged)]
  Unknown(String),
}
