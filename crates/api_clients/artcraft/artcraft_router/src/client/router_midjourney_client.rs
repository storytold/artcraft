use browser_emulation::browser_profile::BrowserProfile;
use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;

/// The first-party (cookie-session) Midjourney client used by the router.
///
/// Unlike the Kinovi/Seedance2Pro Midjourney path (which is backend-billed),
/// this drives the user's own logged-in midjourney.com session directly via
/// captured cookies. The `browser` profile MUST match the browser that
/// captured the cookies — Cloudflare's `cf_clearance` cookie is bound to the
/// User-Agent.
pub struct RouterMidjourneyClient {
  pub(crate) cookie_header: String,

  /// Needed to form the `singleplayer_{user_id}` channel id on submit.
  pub(crate) user_id: MidjourneyUserId,

  pub(crate) browser: BrowserProfile,
}

impl RouterMidjourneyClient {
  pub fn new(cookie_header: String, user_id: MidjourneyUserId, browser: BrowserProfile) -> Self {
    Self { cookie_header, user_id, browser }
  }
}
