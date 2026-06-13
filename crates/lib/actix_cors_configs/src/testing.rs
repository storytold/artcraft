use actix_cors::Cors;
use actix_http::body::{BoxBody, EitherBody};
use actix_http::StatusCode;
use actix_web::dev::{ServiceResponse, Transform};
use actix_web::http::Method;
use actix_web::test;
use actix_web::test::TestRequest;
use speculoos::asserting;

pub (crate) async fn assert_origin_ok(cors: &Cors, hostname: &str) {
  let response = make_test_request(cors, hostname).await;
  asserting(&format!("Hostname {} is valid", hostname))
      .that(&response.status())
      .is_equal_to(StatusCode::OK);
}

pub (crate) async fn assert_origin_invalid(cors: &Cors, hostname: &str) {
  let response = make_test_request(cors, hostname).await;
  asserting(&format!("Hostname {} is invalid", hostname))
      .that(&response.status())
      .is_equal_to(StatusCode::BAD_REQUEST);
}

/// Assert that a CORS preflight (OPTIONS + Access-Control-Request-Method)
/// for the given method is accepted from the given origin.
pub (crate) async fn assert_preflight_method_ok(cors: &Cors, hostname: &str, method: &str) {
  let response = make_preflight_request(cors, hostname, method).await;
  asserting(&format!("Preflight for {} from {} is allowed", method, hostname))
      .that(&response.status())
      .is_equal_to(StatusCode::OK);
}

/// Assert that a CORS preflight for the given method is rejected.
pub (crate) async fn assert_preflight_method_invalid(cors: &Cors, hostname: &str, method: &str) {
  let response = make_preflight_request(cors, hostname, method).await;
  asserting(&format!("Preflight for {} from {} is rejected", method, hostname))
      .that(&response.status())
      .is_equal_to(StatusCode::BAD_REQUEST);
}

/// Assert that a request WITHOUT an Origin header (curl, server-to-server,
/// native API clients) is never blocked by CORS, regardless of
/// `block_on_origin_mismatch`.
pub (crate) async fn assert_no_origin_header_ok(cors: &Cors) {
  let cors = cors.new_transform(test::ok_service())
      .await
      .unwrap();

  let request = TestRequest::default().to_srv_request();
  let response = test::call_service(&cors, request).await;

  asserting("Requests without an Origin header are not blocked")
      .that(&response.status())
      .is_equal_to(StatusCode::OK);
}

async fn make_test_request(cors: &Cors, hostname: &str) -> ServiceResponse<EitherBody<BoxBody>> {
  let cors= cors.new_transform(test::ok_service())
      .await
      .unwrap();

  let request = TestRequest::default()
      .insert_header(("Origin", hostname))
      .to_srv_request();

  test::call_service(&cors, request).await
}

async fn make_preflight_request(
  cors: &Cors,
  hostname: &str,
  method: &str,
) -> ServiceResponse<EitherBody<BoxBody>> {
  let cors = cors.new_transform(test::ok_service())
      .await
      .unwrap();

  let request = TestRequest::default()
      .method(Method::OPTIONS)
      .insert_header(("Origin", hostname))
      .insert_header(("Access-Control-Request-Method", method))
      .to_srv_request();

  test::call_service(&cors, request).await
}
