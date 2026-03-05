use actix_cors::Cors;
use log::info;

use crate::configs::artcraft_admin_dashboard::add_artcraft_admin_dashboard;
use crate::configs::artcraft_2d::add_artcraft_2d;
use crate::configs::artcraft_3d::add_artcraft_3d;
use crate::configs::artcraft_website::add_artcraft_website;
use crate::configs::development_only::add_development_only;
use crate::configs::fakeyou::{add_fakeyou, add_fakeyou_dev_proxy};
use crate::configs::legacy::{add_legacy_storyteller_stream, add_legacy_trumped, add_legacy_vocodes, add_power_stream};
use crate::configs::storyteller::{add_storyteller, add_storyteller_dev_proxy};
use crate::configs::storyteller_board::add_storyteller_board;
use crate::configs::storyteller_render::add_storyteller_render;
use crate::configs::storyteller_studio::add_storyteller_studio;
use crate::configs::tauri::add_tauri;
use reusable_types::server_environment::ServerEnvironment;

/// Return cors config for FakeYou / Vocodes / OBS / local development
pub fn build_cors_config(server_environment: ServerEnvironment) -> Cors {
  let is_production = server_environment.is_deployed_in_production();

  info!("Building CORS for environment: {:?}", server_environment);

  do_build_cors_config(is_production)
}

/// Return cors config for FakeYou / Vocodes / OBS / local development
pub fn build_production_cors_config() -> Cors {
  const IS_PRODUCTION : bool = true;
  do_build_cors_config(IS_PRODUCTION)
}

fn do_build_cors_config(is_production: bool) -> Cors {
  let mut cors = Cors::default();

  info!("Building CORS for production: {}", is_production);

  // Current product
  cors = add_fakeyou(cors, is_production);
  cors = add_fakeyou_dev_proxy(cors, is_production);
  cors = add_storyteller(cors, is_production);
  cors = add_storyteller_dev_proxy(cors, is_production);
  cors = add_storyteller_studio(cors, is_production);
  cors = add_storyteller_board(cors, is_production);
  cors = add_storyteller_render(cors, is_production);

  // Artcraft
  cors = add_tauri(cors, is_production);
  cors = add_artcraft_2d(cors, is_production);
  cors = add_artcraft_3d(cors, is_production);
  cors = add_artcraft_website(cors, is_production);
  cors = add_artcraft_admin_dashboard(cors, is_production);

  // Legacy
  cors = add_legacy_trumped(cors, is_production);
  cors = add_power_stream(cors, is_production);
  cors = add_legacy_storyteller_stream(cors, is_production);
  cors = add_legacy_vocodes(cors, is_production);

  // Development
  if !is_production {
    cors = add_development_only(cors);
  }

  // Remaining setup
  cors.allowed_methods(vec!["GET", "POST", "OPTIONS", "DELETE"])
      .supports_credentials()
      .allowed_headers(vec![
        actix_http::header::ACCEPT,
        actix_http::header::ACCESS_CONTROL_ALLOW_ORIGIN, // Tabulator Ajax
        actix_http::header::CONTENT_TYPE,
        actix_http::header::ACCESS_CONTROL_ALLOW_CREDENTIALS, // https://stackoverflow.com/a/46412839
        actix_http::header::HeaderName::from_static("x-requested-with"), // Tabulator Ajax sends
        actix_http::header::HeaderName::from_static("session"), // Custom header sent by Three.js Storyteller Studio
      ])
      .max_age(3600)
}

#[cfg(test)]
mod tests {
  use reusable_types::server_environment::ServerEnvironment;

  use crate::testing::assert_origin_invalid;
  use crate::testing::assert_origin_ok;

  use super::build_cors_config;

  #[actix_rt::test]
  async fn test_fakeyou_production() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    // Valid Origin
    assert_origin_ok(&production_cors, "https://fakeyou.com").await;
    assert_origin_ok(&production_cors, "https://api.fakeyou.com").await;
    assert_origin_ok(&production_cors, "https://staging.fakeyou.com").await;

    // Invalid Origin
    assert_origin_invalid(&production_cors, "https://fake.fakeyou.com").await;
    assert_origin_invalid(&production_cors, "https://jungle.horse").await;
    assert_origin_invalid(&production_cors, "http://localhost:54321").await;
  }

  #[actix_rt::test]
  async fn test_fakeyou_development() {
    let development_cors = build_cors_config(ServerEnvironment::Development);

    // Valid Origin
    assert_origin_ok(&development_cors, "https://dev.fakeyou.com").await;
    assert_origin_ok(&development_cors, "http://localhost:54321").await;

    // Invalid Origin
    assert_origin_invalid(&development_cors, "https://fakeyou.com").await;
    assert_origin_invalid(&development_cors, "https://api.fakeyou.com").await;
    assert_origin_invalid(&development_cors, "https://staging.fakeyou.com").await;
  }

  #[actix_rt::test]
  async fn test_storyteller_production() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    // Valid Origin
    assert_origin_ok(&production_cors, "https://storyteller.ai").await;
    assert_origin_ok(&production_cors, "https://api.storyteller.ai").await;
    assert_origin_ok(&production_cors, "https://staging.storyteller.ai").await;

    // Invalid Origin
    assert_origin_invalid(&production_cors, "https://dev.storyteller.ai").await;
    assert_origin_invalid(&production_cors, "http://dev.storyteller.ai").await;
  }

  #[actix_rt::test]
  async fn test_storyteller_development() {
    let development_cors = build_cors_config(ServerEnvironment::Development);

    // Valid Origin
    assert_origin_ok(&development_cors, "https://dev.storyteller.ai").await;
    assert_origin_ok(&development_cors, "http://localhost:54321").await;

    // Invalid Origin
    assert_origin_invalid(&development_cors, "https://storyteller.ai").await;
    assert_origin_invalid(&development_cors, "https://staging.storyteller.ai").await;
  }
}
