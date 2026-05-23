//! Minimal Datadog HTTP API client.
//!
//! This is a *transport* crate — it knows how to talk to the Datadog metrics
//! API and nothing else. Buffering, aggregation, and the actix middleware
//! that feeds it live in the `metrics` library. Mirrors the
//! `rootly_client` + `pager` split.
//!
//! Supports two endpoints:
//!
//! - `POST /api/v1/distribution_points` — submit raw observation lists.
//!   Datadog computes p50/p75/p90/p95/p99/avg/min/max/count server-side.
//! - `POST /api/v1/series` — submit pre-aggregated counts/gauges/rates.

pub mod client;
pub mod creds;
pub mod error;

#[cfg(test)]
mod test_utils;
