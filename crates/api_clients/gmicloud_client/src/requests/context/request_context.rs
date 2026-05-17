use std::time::Duration;

use crate::creds::gmicloud_api_key::GmiCloudApiKey;

pub struct RequestContext<'a> {
  pub api_key: &'a GmiCloudApiKey,
  pub maybe_timeout: Option<Duration>,
}
