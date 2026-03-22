use actix_helpers::extractors::get_request_origin_uri::get_request_origin_uri;
use actix_web::HttpRequest;
use enums_api::by_table::users::user_signup_source::UserSignupSource;
use log::warn;

pub fn get_request_signup_source_enum(http_request: &HttpRequest) -> Option<UserSignupSource> {
  // NB: "Origin" vs "Referrer"
  //
  // Basically:
  //  - "In order to preserve privacy, any browser request can decide to omit the Referer header."
  //  - "The Origin header is similar to the Referer header, but does not disclose the path, and may be null."
  //  - "Origin" is sent on cross-origin, same-origin (except GET and HEAD requests - typically).
  //
  // Reading:
  //  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin
  //  - https://stackoverflow.com/a/71040145
  //
  let maybe_origin = get_request_origin_uri(&http_request);

  match maybe_origin {
    Ok(Some(uri)) => {
      if let Some(host) = uri.host() {
        if host.contains("getartcraft.com") {
          return Some(UserSignupSource::ArtCraftGetWeb);
        } else if host.contains("artcraft.ai") {
          return Some(UserSignupSource::ArtCraftAiWeb);
        } else if host.contains("storyteller") {
          return Some(UserSignupSource::Storyteller);
        } else if host.contains("fakeyou") {
          return Some(UserSignupSource::FakeYou);
        }
      }
    }
    // Fail open for now.
    Ok(None) => {}
    Err(err) => {
      warn!("Origin header error: {:?}", err);
    }
  }

  // NB: We don't want to check the "Host" header because we might have misconfigured
  // a future frontend to talk to some other API gateway and might be improperly and
  // silently misattributing signup statistics.

  None
}

#[cfg(test)]
mod tests {
  use actix_web::test::TestRequest;

  mod origin_header_enum {
    use super::*;
    use crate::requests::get_request_signup_source_enum::get_request_signup_source_enum;
    use enums_api::by_table::users::user_signup_source::UserSignupSource;

    #[test]
    fn artcraft_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://artcraft.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::ArtCraftAiWeb));
    }

    #[test]
    fn get_artcraft_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://getartcraft.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::ArtCraftGetWeb));
    }

    #[test]
    fn api_dot_get_artcraft_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.getartcraft.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::ArtCraftGetWeb));
    }

    #[test]
    fn fakeyou_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://fakeyou.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::FakeYou));
    }

    #[test]
    fn api_dot_fakeyou_dot_com() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.fakeyou.com"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::FakeYou));
    }

    #[test]
    fn storyteller_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://storyteller.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::Storyteller));
    }

    #[test]
    fn api_dot_storyteller_dot_ai() {
      let request = TestRequest::get()
          .insert_header(("origin", "https://api.storyteller.ai"))
          .to_http_request();
      assert_eq!(get_request_signup_source_enum(&request), Some(UserSignupSource::Storyteller));
    }
  }
}
