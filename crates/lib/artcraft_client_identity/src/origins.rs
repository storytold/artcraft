/// `Origin` sent to our deployed APIs.
/// Keep in sync with `actix_cors_configs/src/configs/artcraft_desktop.rs` in artcraft-services.
pub const ARTCRAFT_DESKTOP_ORIGIN: &str = "https://desktop.getartcraft.com";

/// `Origin` sent to a locally running API (eg. `http://localhost:12345`).
/// Development CORS accepts any `localhost` origin.
pub const ARTCRAFT_DESKTOP_DEVELOPMENT_ORIGIN: &str = "http://localhost";

/// `Origin` packaged builds historically sent everywhere. Now only sent to our non-API hosts
/// (CDNs, websites), where it is left unchanged.
pub const LEGACY_DESKTOP_ORIGIN: &str = "https://studio.storyteller.ai";
