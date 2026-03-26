use std::future::{Future, Ready, ready};
use std::pin::Pin;

use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::Error;
use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details::NotificationDetails;

// ======================== Transform (factory) ========================

/// Middleware that intercepts error responses and enqueues pager alerts.
///
/// Currently catches:
/// - 500 Internal Server Error responses
///
/// Extensible: add new matchers to `check_response_for_alerts()`.
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
      let res = fut.await?;
      check_response_for_alerts(&pager, &method, &path, &res);
      Ok(res)
    })
  }
}

// ======================== Alert matchers ========================

/// Inspect a response and enqueue pager alerts for error conditions.
///
/// To add new alerting rules, add a new function call here.
fn check_response_for_alerts<B>(
  pager: &Pager,
  method: &str,
  path: &str,
  response: &ServiceResponse<B>,
) {
  let status = response.status();

  // Rule: Alert on 500 Internal Server Error
  if status.as_u16() == 500 {
    alert_on_500(pager, method, path);
  }

  // Future rules can be added here:
  // - alert_on_repeated_429s(pager, method, path, status);
  // - alert_on_specific_error_type(pager, response);
  // etc.
}

fn alert_on_500(pager: &Pager, method: &str, path: &str) {
  let summary = format!("HTTP 500: {} {}", method, path);
  let description = format!(
    "An internal server error (HTTP 500) was returned.\n\n\
     Endpoint: {} {}\n\
     Time: {}",
    method,
    path,
    chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
  );

  let notification = NotificationDetails::with_summary_and_description(summary, description);

  if let Err(err) = pager.enqueue_page(notification) {
    warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
  } else {
    debug!("Error alerting middleware: enqueued alert for 500 on {} {}", method, path);
  }
}
