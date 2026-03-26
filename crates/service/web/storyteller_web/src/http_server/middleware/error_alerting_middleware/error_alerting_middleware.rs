use std::future::{Future, Ready, ready};
use std::pin::Pin;

use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::Error;

use pager::client::pager::Pager;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::flags::paging_flags::PagingFlags;
use super::check_common_web_error::check_common_web_error;
use super::check_status_code_fallback::check_status_code_fallback;

// ======================== Transform (factory) ========================

/// Middleware that intercepts error responses and enqueues pager alerts.
///
/// Inspects errors in two ways:
/// 1. **Typed error matching** via downcast (e.g. `CommonWebError::ServerError`)
/// 2. **Status code fallback** for untyped 500s that slip through
///
/// Both `PagingFlags.is_paging_enabled` and `PagingFlags.is_paging_for_500s_enabled`
/// must be true for any alerting to fire. Otherwise the middleware is a passthrough.
///
/// To add new error types, create a new `check_*.rs` matcher module and
/// add a downcast branch in `check_ok_response_for_alerts` / `check_err_for_alerts`.
#[derive(Clone)]
pub struct ErrorAlertingMiddleware {
  pager: Pager,
  paging_flags: PagingFlags,
}

impl ErrorAlertingMiddleware {
  pub fn new(pager: Pager, paging_flags: PagingFlags) -> Self {
    Self { pager, paging_flags }
  }
}

impl<S, B> Transform<S, ServiceRequest> for ErrorAlertingMiddleware
  where
      S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
      S::Future: 'static,
      B: 'static,
{
  type Response = ServiceResponse<B>;
  type Error = Error;
  type InitError = ();
  type Transform = ErrorAlertingService<S>;
  type Future = Ready<Result<Self::Transform, Self::InitError>>;

  fn new_transform(&self, service: S) -> Self::Future {
    ready(Ok(ErrorAlertingService {
      service,
      pager: self.pager.clone(),
      paging_flags: self.paging_flags.clone(),
    }))
  }
}

// ======================== Service (per-request) ========================

pub struct ErrorAlertingService<S> {
  service: S,
  pager: Pager,
  paging_flags: PagingFlags,
}

impl<S, B> Service<ServiceRequest> for ErrorAlertingService<S>
  where
      S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
      S::Future: 'static,
      B: 'static,
{
  type Response = ServiceResponse<B>;
  type Error = Error;
  type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

  actix_service::forward_ready!(service);

  fn call(&self, req: ServiceRequest) -> Self::Future {
    // Fast path: if paging is disabled, skip all inspection.
    if !self.paging_flags.is_paging_enabled || !self.paging_flags.is_paging_for_500s_enabled {
      return Box::pin(self.service.call(req));
    }

    let method = req.method().to_string();
    let path = req.path().to_string();
    let pager = self.pager.clone();
    let fut = self.service.call(req);

    Box::pin(async move {
      match fut.await {
        Ok(res) => {
          check_ok_response_for_alerts(&pager, &method, &path, &res);
          Ok(res)
        }
        Err(err) => {
          check_err_for_alerts(&pager, &method, &path, &err);
          Err(err)
        }
      }
    })
  }
}

// ======================== Response inspection ========================

/// Inspect a successful `ServiceResponse` that may contain an error response.
///
/// Actix-web converts `ResponseError` types into HTTP responses and stashes
/// the original error in `response.error()`. We can downcast from there.
fn check_ok_response_for_alerts<B>(
  pager: &Pager,
  method: &str,
  path: &str,
  response: &ServiceResponse<B>,
) {
  let status = response.status();

  // Try to get the original typed error from the response (if it came from ResponseError).
  if let Some(err) = response.response().error() {
    // --- Typed matchers (add new check_*.rs modules and downcast branches here) ---

    if let Some(common_err) = err.as_error::<CommonWebError>() {
      if check_common_web_error(pager, method, path, common_err) {
        return;
      }
    }
  }

  // --- Status code fallback ---
  check_status_code_fallback(pager, method, path, status.as_u16());
}

/// Inspect an `actix_web::Error` returned from the handler or inner middleware.
fn check_err_for_alerts(
  pager: &Pager,
  method: &str,
  path: &str,
  err: &Error,
) {
  // --- Typed matchers (add new check_*.rs modules and downcast branches here) ---

  if let Some(common_err) = err.as_error::<CommonWebError>() {
    if check_common_web_error(pager, method, path, common_err) {
      return;
    }
  }

  // --- Status code fallback ---
  let status = err.as_response_error().status_code();
  check_status_code_fallback(pager, method, path, status.as_u16());
}
