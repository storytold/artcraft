//! Load the accepted internal API keys (worker fleet auth) from the
//! environment at startup.
//!
//! Missing or empty configuration is not fatal — the internal endpoints will
//! simply reject every request until keys are configured.

use std::collections::HashSet;
use std::env;

use log::{info, warn};

use crate::util::internal_api_key::InternalApiKey;

const ACCEPTED_INTERNAL_API_KEYS_ENV_VAR: &str = "ACCEPTED_INTERNAL_API_KEYS";

pub fn setup_internal_api_keys() -> HashSet<InternalApiKey> {
  let keys = match env::var(ACCEPTED_INTERNAL_API_KEYS_ENV_VAR) {
    Ok(value) => InternalApiKey::parse_comma_separated_list(&value),
    Err(_) => HashSet::new(),
  };

  if keys.is_empty() {
    warn!(
      "{} is unset or empty; internal worker endpoints will reject all requests.",
      ACCEPTED_INTERNAL_API_KEYS_ENV_VAR,
    );
  } else {
    info!("Loaded {} accepted internal API key(s).", keys.len());
  }

  keys
}
