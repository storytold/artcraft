//! Per-request trace id middleware.
//!
//! Generates a unique [`TraceId`] for every inbound HTTP request and makes it
//! available three ways:
//!
//!   1. **Request extensions** — downstream middleware and handlers can read
//!      it via `req.extensions().get::<TraceId>()`.
//!   2. **Tokio task-local** — the whole request runs inside
//!      [`trace_id::TRACE_ID_TASK_LOCAL`], so `trace_id::current_trace_id()`
//!      works from anywhere in the request's task. The env-logger format
//!      hook uses this to stamp every log line, and the pager uses it to tag
//!      notifications.
//!   3. **`x-trace-id` response header** — so clients and support tickets can
//!      quote the id.
//!
//! Register this middleware LAST in the actix `.wrap(...)` chain so it runs
//! FIRST (actix middleware executes in reverse registration order) and every
//! other middleware sees the trace id.
//!
//! NB: Detached `tokio::spawn` tasks do NOT inherit the task-local. Wrap
//! spawned futures in `TRACE_ID_TASK_LOCAL.scope(trace_id, fut)` if they
//! should stay correlated.

use std::future::{Future, Ready, ready};
use std::pin::Pin;

use actix_web::Error;
use actix_web::HttpMessage;
use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};
use actix_web::http::header::{HeaderName, HeaderValue};

use trace_id::{TraceId, TRACE_ID_TASK_LOCAL};

/// Response header carrying the request's trace id.
pub const TRACE_ID_HEADER: &str = "x-trace-id";

#[derive(Clone, Default)]
pub struct TraceIdMiddleware;

impl<S, B> Transform<S, ServiceRequest> for TraceIdMiddleware
where
  S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
  S::Future: 'static,
  B: 'static,
{
  type Response = ServiceResponse<B>;
  type Error = Error;
  type InitError = ();
  type Transform = TraceIdService<S>;
  type Future = Ready<Result<Self::Transform, Self::InitError>>;

  fn new_transform(&self, service: S) -> Self::Future {
    ready(Ok(TraceIdService { service }))
  }
}

pub struct TraceIdService<S> {
  service: S,
}

impl<S, B> Service<ServiceRequest> for TraceIdService<S>
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
    let trace_id = TraceId::generate();

    // Make the trace id readable from the request itself.
    req.extensions_mut().insert(trace_id.clone());

    let response_trace_id = trace_id.clone();
    let fut = self.service.call(req);

    Box::pin(TRACE_ID_TASK_LOCAL.scope(trace_id, async move {
      let mut response = fut.await?;

      if let Ok(header_value) = HeaderValue::from_str(response_trace_id.as_str()) {
        response.headers_mut().insert(
          HeaderName::from_static(TRACE_ID_HEADER),
          header_value,
        );
      }

      Ok(response)
    }))
  }
}
