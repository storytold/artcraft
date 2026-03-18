use crate::http_server::common_responses::media::media_domain::MediaDomain;
use once_cell::sync::Lazy;
use server_environment::ServerEnvironment;
use url::Url;

const FAKEYOU_CDN_STR: &str = "https://cdn-2.fakeyou.com";
const STORYTELLER_CDN_STR: &str = "https://cdn-2.fakeyou.com";

const FAKEYOU_DEVELOPMENT_CDN_STR: &str = "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev";
const STORYTELLER_DEVELOPMENT_CDN_STR: &str = "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev";


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
  match (media_domain, server_environment) {
    (MediaDomain::FakeYou, ServerEnvironment::Development) => FAKEYOU_DEVELOPMENT_CDN_STR,
    (MediaDomain::FakeYou, ServerEnvironment::Production) => FAKEYOU_CDN_STR,
    (MediaDomain::Storyteller, ServerEnvironment::Development) => STORYTELLER_DEVELOPMENT_CDN_STR,
    (MediaDomain::Storyteller, ServerEnvironment::Production) => STORYTELLER_CDN_STR,
  }
}

pub fn new_cdn_url(media_domain: MediaDomain, server_environment: ServerEnvironment) -> Url {
  match (media_domain, server_environment) {
    (MediaDomain::FakeYou, ServerEnvironment::Development) => FAKEYOU_DEVELOPMENT_CDN.clone(),
    (MediaDomain::FakeYou, ServerEnvironment::Production) => FAKEYOU_CDN.clone(),
    (MediaDomain::Storyteller, ServerEnvironment::Development) => STORYTELLER_DEVELOPMENT_CDN.clone(),
    (MediaDomain::Storyteller, ServerEnvironment::Production) => STORYTELLER_CDN.clone(),
  }
}
