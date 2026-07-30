use crate::http_server::common_responses::media::media_domain::MediaDomain;
use once_cell::sync::Lazy;
use server_environment::ServerEnvironment;
use url::Url;

const FAKEYOU_CDN_STR: &str = "https://cdn-2.fakeyou.com";
const STORYTELLER_CDN_STR: &str = "https://cdn-2.fakeyou.com";

const FAKEYOU_DEVELOPMENT_CDN_STR: &str = "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev";
const STORYTELLER_DEVELOPMENT_CDN_STR: &str = "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev";

// Runtime override for the CDN base, taking precedence over every constant
// above for all domains and environments. The fully-local dev stack sets
// CDN_BASE_URL=http://localhost:12345 so media URLs resolve against the
// backend's own static /media mount (see add_service_routes) instead of the
// shared r2.dev bucket. Unset (production, and dev-against-remote) keeps the
// compiled-in hosts.
//
// The override must be scheme+host only: some consumers append the rooted
// object path with Url::set_path, which would silently drop a path component
// in the base, so a base with a path is rejected loudly instead.
// Leaked once so get_cdn_host can stay &'static str.
static CDN_BASE_URL_OVERRIDE_STR: Lazy<Option<&'static str>> = Lazy::new(|| {
  let base = std::env::var("CDN_BASE_URL")
      .ok()
      .map(|s| s.trim().trim_end_matches('/').to_string())
      .filter(|s| !s.is_empty())?;
  let url = Url::parse(&base).expect("CDN_BASE_URL must be a valid absolute URL");
  if url.path() != "/" && !url.path().is_empty() {
    panic!("CDN_BASE_URL must not include a path component (got '{}'): \
            media URL builders overwrite the path", url.path());
  }
  Some(&*Box::leak(base.into_boxed_str()))
});

static CDN_BASE_URL_OVERRIDE: Lazy<Option<Url>> = Lazy::new(|| {
  CDN_BASE_URL_OVERRIDE_STR.map(|s| Url::parse(s).expect("validated above"))
});


const FAKEYOU_CDN: Lazy<Url> = Lazy::new(|| Url::parse(FAKEYOU_CDN_STR)
    .expect("should never fail"));

const STORYTELLER_CDN: Lazy<Url> = Lazy::new(|| Url::parse(STORYTELLER_CDN_STR)
    .expect("should never fail"));

const FAKEYOU_DEVELOPMENT_CDN: Lazy<Url> = Lazy::new(|| Url::parse(FAKEYOU_DEVELOPMENT_CDN_STR)
    .expect("should never fail"));

const STORYTELLER_DEVELOPMENT_CDN: Lazy<Url> = Lazy::new(|| Url::parse(STORYTELLER_DEVELOPMENT_CDN_STR)
    .expect("should never fail"));


// TODO(bt,2025-01-31): Perhaps this should be config driven and configurable at runtime instead of hardcoded.
pub fn get_cdn_host(media_domain: MediaDomain, server_environment: ServerEnvironment) -> &'static str {
  if let Some(base) = *CDN_BASE_URL_OVERRIDE_STR {
    return base;
  }
  match (media_domain, server_environment) {
    (MediaDomain::FakeYou, ServerEnvironment::Development) => FAKEYOU_DEVELOPMENT_CDN_STR,
    (MediaDomain::FakeYou, ServerEnvironment::Production) => FAKEYOU_CDN_STR,
    (MediaDomain::Storyteller, ServerEnvironment::Development) => STORYTELLER_DEVELOPMENT_CDN_STR,
    (MediaDomain::Storyteller, ServerEnvironment::Production) => STORYTELLER_CDN_STR,
  }
}

pub fn new_cdn_url(media_domain: MediaDomain, server_environment: ServerEnvironment) -> Url {
  if let Some(url) = CDN_BASE_URL_OVERRIDE.as_ref() {
    return url.clone();
  }
  match (media_domain, server_environment) {
    (MediaDomain::FakeYou, ServerEnvironment::Development) => FAKEYOU_DEVELOPMENT_CDN.clone(),
    (MediaDomain::FakeYou, ServerEnvironment::Production) => FAKEYOU_CDN.clone(),
    (MediaDomain::Storyteller, ServerEnvironment::Development) => STORYTELLER_DEVELOPMENT_CDN.clone(),
    (MediaDomain::Storyteller, ServerEnvironment::Production) => STORYTELLER_CDN.clone(),
  }
}
