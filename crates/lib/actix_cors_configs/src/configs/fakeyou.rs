use actix_cors::Cors;
use log::warn;
use url::{Host, Url};

pub fn add_fakeyou(cors: Cors, is_production: bool) -> Cors {
  if is_production {
    cors
        // Storyteller Engine (Production)
        .allowed_origin("https://engine.fakeyou.com")
        // FakeYou (Production)
        .allowed_origin("https://api.fakeyou.com")
        .allowed_origin("https://fakeyou.com")
        // FakeYou (Staging)
        .allowed_origin("https://staging.fakeyou.com")
        // Allow Netlify domains within "fakeyou" project.
        .allowed_origin_fn(|origin, _req_head| {
          let maybe_url = origin.to_str()
              .map(|origin| Url::parse(origin));

          let url = match maybe_url {
            Ok(Ok(url)) => url,
            _ => {
              warn!("Invalid origin: {:?}", origin);
              return false
            },
          };

          match url.host() {
            Some(Host::Domain(domain)) => {
              let is_netlify_domain = domain == "fakeyou.netlify.app";
              let is_netlify_branch_deploy = domain.ends_with("--fakeyou.netlify.app");

              is_netlify_domain || is_netlify_branch_deploy
            },
            _ => false,
          }
        })

        // NB(bt,2024-04-07): We shouldn't allow HTTP from non-dev hosts
        //.allowed_origin("http://api.fakeyou.com")
        //.allowed_origin("http://fakeyou.com")
        //.allowed_origin("http://staging.fakeyou.com")
  } else {
    cors
        // FakeYou (Development)
        .allowed_origin("http://dev.fakeyou.com")
        .allowed_origin("http://dev.fakeyou.com:7000") // Yarn default port
        .allowed_origin("http://dev.fakeyou.com:7001") // NB: Mac frontend
        .allowed_origin("https://dev.fakeyou.com")
        .allowed_origin("https://dev.fakeyou.com:7000") // Yarn default port
        .allowed_origin("https://dev.fakeyou.com:7001") // NB: Mac frontend
        // Storyteller Engine (Development)
        .allowed_origin("https://engine.fakeyou.com") // NB: We use prod for integration testing
  }
}

pub fn add_fakeyou_dev_proxy(cors: Cors, _is_production: bool) -> Cors {
  cors
      // Storyteller.ai (Development Proxy)
      .allowed_origin("http://devproxy.fakeyou.com")
      .allowed_origin("http://devproxy.fakeyou.com:5173")
      .allowed_origin("http://devproxy.fakeyou.com:7000")
      .allowed_origin("http://devproxy.fakeyou.com:7001")
      .allowed_origin("http://devproxy.fakeyou.com:7002")
      .allowed_origin("https://devproxy.fakeyou.com")
      .allowed_origin("https://devproxy.fakeyou.com:5173")
      .allowed_origin("https://devproxy.fakeyou.com:7000")
      .allowed_origin("https://devproxy.fakeyou.com:7001")
      .allowed_origin("https://devproxy.fakeyou.com:7002")
}

#[cfg(test)]
mod tests {
  use server_environment::ServerEnvironment;

  use crate::cors::build_cors_config;
  use crate::testing::assert_origin_invalid;
  use crate::testing::assert_origin_ok;

  mod netlify {
    use super::*;

    #[actix_rt::test]
    async fn main_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://fakeyou.netlify.app").await;
    }

    #[actix_rt::test]
    async fn branch_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://feature-mvp--fakeyou.netlify.app").await;
    }

    #[actix_rt::test]
    async fn deploy_preview() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_ok(&production_cors, "https://deploy-preview-86--fakeyou.netlify.app").await;
    }

    #[actix_rt::test]
    async fn invalid_netlify_preview_deploy() {
      let production_cors = build_cors_config(ServerEnvironment::Production);
      assert_origin_invalid(&production_cors, "https://bar.netlify.app").await;
      assert_origin_invalid(&production_cors, "https://deploy-preview-86--bar.netlify.app").await;
    }
  }
}
