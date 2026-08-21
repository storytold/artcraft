use actix_web::cookie::Cookie;

use crate::state::server_state::ServerState;

pub const ALPHA_COOKIE_NAME : &str = "enable-alpha";

pub fn alpha_cookie(server_state: &ServerState) -> Cookie<'_> {
  Cookie::build(ALPHA_COOKIE_NAME, "true")
      .domain(&server_state.env_config.cookie_domain)
      .secure(server_state.env_config.cookie_secure) // HTTPS-only
      .http_only(false) // This is meant to be exposed to Javascript!
      .permanent()
      .finish()
}
