/// A centralized accounting of various priority levels, since they would otherwise be strewn
/// across various microservices.

// TODO: Prioritize certain geographic regions? By time of day? Other heuristics?
// TODO: Prioritize first few uses? Cooldown on priority?
// TODO: Paid priority levels.

/// Anonymous browser sessions
pub const FAKEYOU_ANONYMOUS_PRIORITY_LEVEL : u8 = 0;

/// Logged in users
pub const FAKEYOU_LOGGED_IN_PRIORITY_LEVEL : u8 = 1;

/// Default API priority
/// This is only for "valid" API tokens and can be adjusted up or down.
pub const FAKEYOU_DEFAULT_VALID_API_TOKEN_PRIORITY_LEVEL : u8 = 1;

/// Investors accessing storyteller.io
pub const FAKEYOU_INVESTOR_PRIORITY_LEVEL : u8 = 2;

/// Twitch users get priority above all FakeYou users.
///  TODO: In the future, there should be higher priority for paid users.
pub const TWITCH_TTS_PRIORITY_LEVEL : u8 = 10;
