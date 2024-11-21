use once_cell::sync::Lazy;
use url::Url;

//const FAKEYOU_CDN_STR: &str = "https://storage.googleapis.com/dev-vocodes-public";
const FAKEYOU_CDN_STR: &str = "https://cdn-2.fakeyou.com";

const STORYTELLER_CDN_STR: &str = "https://cdn.storyteller.ai";

const FAKEYOU_CDN: Lazy<Url> = Lazy::new(|| Url::parse(FAKEYOU_CDN_STR)
    .expect("should never fail"));

const STORYTELLER_CDN: Lazy<Url> = Lazy::new(|| Url::parse(STORYTELLER_CDN_STR)
    .expect("should never fail"));

/// Which domain to generate CDN, etc. links for.
#[derive(Copy, Clone, Debug)]
pub enum MediaDomain {
  FakeYou,
  Storyteller,
}

impl MediaDomain {
  pub fn new_cdn_url(&self) -> Url {
    match self {
      MediaDomain::FakeYou => FAKEYOU_CDN.clone(),
      MediaDomain::Storyteller => STORYTELLER_CDN.clone(),
    }
  }
  pub fn cdn_url_str(&self) -> &'static str {
    match self {
      MediaDomain::FakeYou => FAKEYOU_CDN_STR,
      MediaDomain::Storyteller => STORYTELLER_CDN_STR,
    }
  }
}
