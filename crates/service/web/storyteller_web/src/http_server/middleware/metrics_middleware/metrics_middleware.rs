//! Per-request metrics middleware.
//!
//! Captures `(route_pattern, method, status_code, duration_ms)` for every
//! request and hands it to the [`MetricsCollector`], which buffers it for a
//! background worker. Submission happens off the request path — this
//! middleware never awaits anything except the inner service call itself.
//!
//! Cardinality control: we use [`actix_web::dev::ServiceResponse::request()`]
//! `.match_pattern()` (the registered route template like
//! `/v1/users/{user_token}`) rather than the raw URL, so tags don't explode
//! with per-user IDs. Requests that don't match a registered route are
//! tagged `route:unmatched`.

use std::future::{Future, Ready, ready};
use std::pin::Pin;
use std::time::Instant;

use actix_web::Error;
use actix_web::dev::{Service, ServiceRequest, ServiceResponse, Transform};

use metrics::collector::MetricsCollector;

const UNMATCHED_ROUTE: &str = "unmatched";

#[derive(Clone)]
pub struct MetricsMiddleware {
  collector: MetricsCollector,
}

impl MetricsMiddleware {
  pub fn new(collector: MetricsCollector) -> Self {
    Self { collector }
  }
}

impl<S, B> Transform<S, ServiceRequest> for MetricsMiddleware
where
  S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
  S::Future: 'static,
  B: 'static,
{
  type Response = ServiceResponse<B>;
  type Error = Error;
  type InitError = ();
  type Transform = MetricsService<S>;
  type Future = Ready<Result<Self::Transform, Self::InitError>>;

  fn new_transform(&self, service: S) -> Self::Future {
    ready(Ok(MetricsService {
      service,
      collector: self.collector.clone(),
    }))
  }
}

pub struct MetricsService<S> {
  service: S,
  collector: MetricsCollector,
}

impl<S, B> Service<ServiceRequest> for MetricsService<S>
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
    // Skip everything when metrics are disabled — keeps the no-op path
    // cheap (still pays one Instant::now and an awaited service call).
    if !self.collector.is_enabled() {
      return Box::pin(self.service.call(req));
    }

    let collector = self.collector.clone();
    let method = req.method().to_string();
    let started = Instant::now();
    let future = self.service.call(req);

    Box::pin(async move {
      let result = future.await;
      let duration_ms = started.elapsed().as_secs_f64() * 1000.0;
      match &result {
        Ok(response) => {
          let route = response.request()
            .match_pattern()
            .unwrap_or_else(|| UNMATCHED_ROUTE.to_string());
          let status_code = response.status().as_u16();
          collector.record_request(route, method, status_code, duration_ms);
        }
        Err(_) => {
          // The service returned an error before producing a response, so
          // we can't recover match_pattern. Surface this as 500/unmatched
          // — it's rare in practice (most actix error paths still produce
          // a ServiceResponse).
          collector.record_request(UNMATCHED_ROUTE, method, 500, duration_ms);
        }
      }
      result
    })
  }
}
