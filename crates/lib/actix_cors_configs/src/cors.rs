use actix_cors::Cors;
use log::info;

use crate::configs::artcraft_2d::add_artcraft_2d;
use crate::configs::artcraft_3d::add_artcraft_3d;
use crate::configs::artcraft_admin_dashboard::add_artcraft_admin_dashboard;
use crate::configs::artcraft_webapp::add_artcraft_webapp;
use crate::configs::artcraft_website::add_artcraft_website;
use crate::configs::development_only::add_development_only;
use crate::configs::fakeyou::{add_fakeyou, add_fakeyou_dev_proxy};
use crate::configs::legacy::{add_legacy_storyteller_stream, add_legacy_trumped, add_legacy_vocodes, add_power_stream};
use crate::configs::storyteller::{add_storyteller, add_storyteller_dev_proxy};
use crate::configs::storyteller_board::add_storyteller_board;
use crate::configs::storyteller_render::add_storyteller_render;
use crate::configs::storyteller_studio::add_storyteller_studio;
use crate::configs::tauri::add_tauri;
use server_environment::ServerEnvironment;

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
  cors = add_artcraft_webapp(cors, is_production);
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
  //
  // NB: actix-cors 0.7 flipped the `block_on_origin_mismatch` default to
  // false (mismatched origins get a 200 without CORS headers and the browser
  // enforces the block). We keep the long-standing 0.6 behavior of rejecting
  // mismatched origins server-side with a 400.
  cors.block_on_origin_mismatch(true)
      .allowed_methods(vec!["GET", "POST", "PUT", "OPTIONS", "DELETE"])
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
  use server_environment::ServerEnvironment;

  use crate::testing::assert_no_origin_header_ok;
  use crate::testing::assert_origin_invalid;
  use crate::testing::assert_origin_ok;
  use crate::testing::assert_preflight_method_invalid;
  use crate::testing::assert_preflight_method_ok;

  use super::build_cors_config;

  /// Every production origin that hosts a product (or IS a backend that
  /// serves same-origin pages like swagger) must be allowed. This is the
  /// guard against `block_on_origin_mismatch(true)` locking out a real
  /// frontend after a CORS-crate upgrade.
  #[actix_rt::test]
  async fn test_production_product_and_backend_origins_are_allowed() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    let origins = [
      // Backends (same-origin browser requests still carry an Origin header).
      "https://api.fakeyou.com",
      "https://api.storyteller.ai",
      // Products
      "https://fakeyou.com",
      "https://storyteller.ai",
      "https://app.getartcraft.com",
      "https://getartcraft.com",
      "https://www.getartcraft.com",
      "https://artcraft.ai",
      "https://www.artcraft.ai",
      "https://artcraft-dashboard.netlify.app",
    ];
    for origin in origins {
      assert_origin_ok(&production_cors, origin).await;
    }
  }

  /// Non-browser clients (curl, python API clients, server-to-server) send
  /// no Origin header and must never be blocked, even with
  /// `block_on_origin_mismatch(true)`.
  #[actix_rt::test]
  async fn test_requests_without_origin_header_are_not_blocked() {
    let production_cors = build_cors_config(ServerEnvironment::Production);
    assert_no_origin_header_ok(&production_cors).await;
  }

  #[actix_rt::test]
  async fn test_preflight_allows_every_supported_method() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    // PUT is used by e.g. the folders routes (rename/star/color_code/cover_image).
    for method in ["GET", "POST", "PUT", "DELETE"] {
      assert_preflight_method_ok(&production_cors, "https://app.getartcraft.com", method).await;
      assert_preflight_method_ok(&production_cors, "https://storyteller.ai", method).await;
    }
  }

  #[actix_rt::test]
  async fn test_preflight_rejects_unsupported_methods() {
    let production_cors = build_cors_config(ServerEnvironment::Production);

    for method in ["PATCH", "TRACE", "CONNECT"] {
      assert_preflight_method_invalid(&production_cors, "https://app.getartcraft.com", method).await;
    }
  }

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
