use std::str::FromStr;

use actix_web::http::Uri;
use actix_web::HttpRequest;
use anyhow::anyhow;

use actix_helpers::extractors::get_request_host::get_request_host;
use server_environment::ServerEnvironment;

/// Multi-environment configuration for 3rd party redirects, eg. Stripe checkout flow and
/// Twitch OAuth flow.
///
/// Right now only "FakeYou" and "Storyteller" domains use OAuth-like redirect flows, so
/// only their domains are supported.
///
/// This supports production and development testing.
#[derive(Copy, Clone)]
pub struct ThirdPartyUrlRedirector {
    environment: ServerEnvironment,
}

impl ThirdPartyUrlRedirector {
    pub fn new(environment: ServerEnvironment) -> Self {
        Self { environment }
    }

    /// Determine the appropriate frontend redirect to send to a 3rd party gateway (OAuth, Payments, etc.)
    /// based on the local server hostname according to the inbound HTTP request.
    pub fn frontend_redirect_url_for_path(&self, http_request: &HttpRequest, path: &str) -> anyhow::Result<String> {
        let request_hostname = get_request_host(http_request)
            .ok_or(anyhow!("request did not have host header"))?;

        fn url_from_hostname_and_path(scheme: &str, hostname: &str, path: &str) -> anyhow::Result<String> {
            Ok(Uri::builder()
                .scheme(scheme)
                .authority(hostname)
                .path_and_query(path)
                .build()?
                .to_string())
        }

        let redirect_hostname = match (self.environment, request_hostname) {
            (ServerEnvironment::Production, "api.fakeyou.com") => "fakeyou.com",
            (ServerEnvironment::Production, "api.storyteller.io") => "storyteller.io",
            (ServerEnvironment::Production, "api.storyteller.ai") => "storyteller.ai",
            (ServerEnvironment::Development, "api.dev.fakeyou.com") => "dev.fakeyou.com",
            (ServerEnvironment::Development, "api.dev.storyteller.io") => "dev.storyteller.io",
            (ServerEnvironment::Development, "api.dev.storyteller.ai") => "dev.storyteller.ai",
            (ServerEnvironment::Development, hostname ) => {
                // Handle localhost with ports.
                let parts = hostname.split(":")
                    .collect::<Vec<&str>>();

                let maybe_host = parts.get(0).map(|s| *s);
                let maybe_port = parts
                    .get(1)
                    .map(|p| u32::from_str(p))
                    .transpose()?;

                match (parts.len(), maybe_host, maybe_port) {
                    (2, Some("localhost"), Some(port)) => {
                        let redirect_hostname = format!("localhost:{}", port + 1000);
                        return url_from_hostname_and_path("http", &redirect_hostname, path);
                    },
                    _ => {
                        return Err(anyhow!("invalid development hostname: {}", hostname));
                    },
                }
            }
            (_, hostname) => {
                return Err(anyhow!("invalid environment and hostname: {:?}, {}", self.environment, hostname));
            }
        };

        url_from_hostname_and_path("https", redirect_hostname, path)
    }
}

#[cfg(test)]
mod tests {
  use actix_web::http::header::HOST;
  use actix_web::HttpRequest;
  use actix_web::test::TestRequest;

  use server_environment::ServerEnvironment;

  use crate::third_party_url_redirector::ThirdPartyUrlRedirector;

  fn request_with_host(hostname: &str) -> HttpRequest {
        TestRequest::default()
            .insert_header((HOST, hostname))
            .to_http_request()
    }

    #[test]
    fn test_development_fakeyou_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Development);
        let http_request  = request_with_host("api.dev.fakeyou.com");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/foo/bar/baz");
        assert_eq!("https://dev.fakeyou.com/foo/bar/baz", result.unwrap());
    }

    #[test]
    fn test_development_storyteller_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Development);
        let http_request  = request_with_host("api.dev.storyteller.io");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/something");
        assert_eq!("https://dev.storyteller.io/something", result.unwrap());
    }

    #[test]
    fn test_development_storyteller_ai_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Development);
        let http_request  = request_with_host("api.dev.storyteller.ai");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/something");
        assert_eq!("https://dev.storyteller.ai/something", result.unwrap());
    }

    #[test]
    fn test_development_localhost_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Development);
        let http_request  = request_with_host("localhost:8000");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/a/b/c");
        assert_eq!("http://localhost:9000/a/b/c", result.unwrap());
    }

    #[test]
    fn test_production_fakeyou_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Production);
        let http_request  = request_with_host("api.fakeyou.com");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/profile/bob");
        assert_eq!("https://fakeyou.com/profile/bob", result.unwrap());
    }

    #[test]
    fn test_production_storyteller_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Production);
        let http_request  = request_with_host("api.storyteller.io");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/account");
        assert_eq!("https://storyteller.io/account", result.unwrap());
    }

    #[test]
    fn test_production_storyteller_ai_redirect() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Production);
        let http_request  = request_with_host("api.storyteller.ai");
        let result = redirector.frontend_redirect_url_for_path(&http_request, "/account");
        assert_eq!("https://storyteller.ai/account", result.unwrap());
    }

    #[test]
    fn test_wrong_environment_development_hostnames() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Development);
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("api.storyteller.io"), "/foo")
            .is_err());
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("api.fakeyou.com"), "/foo")
            .is_err());
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("unrelated.com"), "/foo")
            .is_err());
    }

    #[test]
    fn test_wrong_environment_production_hostnames() {
        let redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Production);
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("dev.api.storyteller.io"), "/foo")
            .is_err());
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("dev.api.fakeyou.com"), "/foo")
            .is_err());
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("localhost"), "/foo")
            .is_err());
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("localhost:1000"), "/foo")
            .is_err());
        assert!(redirector.frontend_redirect_url_for_path(
            &request_with_host("unrelated.com"), "/foo")
            .is_err());
    }
}
