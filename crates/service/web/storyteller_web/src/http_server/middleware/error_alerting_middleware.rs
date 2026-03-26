use std::future::{Future, Ready, ready};
use std::pin::Pin;

use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::Error;
use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details::NotificationDetails;

use crate::http_server::common_responses::common_web_error::CommonWebError;

// ======================== Transform (factory) ========================

/// Middleware that intercepts error responses and enqueues pager alerts.
///
/// Inspects errors in two ways:
/// 1. **Typed error matching** via downcast (e.g. `CommonWebError::ServerError`)
/// 2. **Status code fallback** for untyped 500s that slip through
///
/// To add new error types, add a new branch to `check_common_web_error()`
/// or add a new `if let Some(...)` downcast block in the matcher functions.
/// To add new status-based rules, add to `check_status_fallback()`.
#[derive(Clone)]
pub struct ErrorAlertingMiddleware {
  pager: Pager,
}

impl ErrorAlertingMiddleware {
  pub fn new(pager: Pager) -> Self {
    Self { pager }
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
    }))
  }
}

// ======================== Service (per-request) ========================

pub struct ErrorAlertingService<S> {
  service: S,
  pager: Pager,
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
    let method = req.method().to_string();
    let path = req.path().to_string();
    let pager = self.pager.clone();
    let fut = self.service.call(req);

    Box::pin(async move {
      match fut.await {
        Ok(res) => {
          // The handler returned a response (possibly an error response via ResponseError).
          // Check for typed errors stashed in the response, then fall back to status code.
          check_ok_response_for_alerts(&pager, &method, &path, &res);
          Ok(res)
        }
        Err(err) => {
          // The handler (or inner middleware) returned an Err(actix_web::Error).
          // Try typed downcast first, then fall back to status code.
          check_err_for_alerts(&pager, &method, &path, &err);
          Err(err)
        }
      }
    })
  }
}

// ======================== Ok(response) path ========================

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
    // --- Typed matchers (add new error types here) ---

    if let Some(common_err) = err.as_error::<CommonWebError>() {
      if check_common_web_error(pager, method, path, common_err) {
        return;
      }
    }

    // Add more typed matchers here:
    // if let Some(my_err) = err.as_error::<MyOtherError>() {
    //   if check_my_other_error(pager, method, path, my_err) { return; }
    // }
  }

  // --- Status code fallback ---
  check_status_fallback(pager, method, path, status.as_u16());
}

// ======================== Err(error) path ========================

/// Inspect an `actix_web::Error` returned from the handler or inner middleware.
fn check_err_for_alerts(
  pager: &Pager,
  method: &str,
  path: &str,
  err: &Error,
) {
  // --- Typed matchers (add new error types here) ---

  if let Some(common_err) = err.as_error::<CommonWebError>() {
    if check_common_web_error(pager, method, path, common_err) {
      return;
    }
  }

  // Add more typed matchers here:
  // if let Some(my_err) = err.as_error::<MyOtherError>() {
  //   if check_my_other_error(pager, method, path, my_err) { return; }
  // }

  // --- Status code fallback ---
  let status = err.as_response_error().status_code();
  check_status_fallback(pager, method, path, status.as_u16());
}

// ======================== Typed error matchers ========================

/// Check `CommonWebError` and alert on server errors.
/// Returns `true` if the error was handled (alerted or intentionally skipped).
fn check_common_web_error(
  pager: &Pager,
  method: &str,
  path: &str,
  error: &CommonWebError,
) -> bool {
  match error {
    CommonWebError::ServerError => {
      enqueue_alert(
        pager,
        format!("CommonWebError::ServerError on {} {}", method, path),
        format!(
          "A CommonWebError::ServerError was returned.\n\n\
           Endpoint: {} {}\n\
           Error: {:?}\n\
           Time: {}",
          method, path, error,
          chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        ),
      );
      true
    }
    // Don't alert on client errors (400, 401, 404, 402).
    CommonWebError::BadInputWithSimpleMessage(_) => true,
    CommonWebError::NotFound => true,
    CommonWebError::NotAuthorized => true,
    CommonWebError::PaymentRequired => true,
  }
}

// ======================== Status code fallback ========================

/// Fallback alerting based on HTTP status code when no typed error matched.
fn check_status_fallback(
  pager: &Pager,
  method: &str,
  path: &str,
  status_code: u16,
) {
  match status_code {
    500 => {
      enqueue_alert(
        pager,
        format!("HTTP 500: {} {}", method, path),
        format!(
          "An untyped HTTP 500 response was returned (no typed error matched).\n\n\
           Endpoint: {} {}\n\
           Time: {}",
          method, path,
          chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        ),
      );
    }
    // Add more status-based rules here:
    // 503 => { enqueue_alert(...); }
    _ => {}
  }
}

// ======================== Helpers ========================

fn enqueue_alert(pager: &Pager, summary: String, description: String) {
  let notification = NotificationDetails::with_summary_and_description(summary, description);

  if let Err(err) = pager.enqueue_page(notification) {
    warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
  } else {
    debug!("Error alerting middleware: enqueued alert");
  }
}
