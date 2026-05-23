//! Per-request metrics for HTTP services, backed by Datadog.
//!
//! Three pieces:
//!
//! - [`collector::MetricsCollector`] — cheap-to-clone handle that
//!   middleware/handlers call to record a request observation. Pushes the
//!   sample onto a shared in-memory buffer; never blocks on I/O.
//! - [`queue::SampleQueue`] — the buffer itself (bounded, oldest dropped).
//! - [`worker::MetricsWorker`] — a long-lived tokio task that drains the
//!   queue every `flush_interval`, groups samples by (route, method,
//!   status_code), and submits one distribution-points POST plus one
//!   series POST to Datadog. Submission failures are logged, not
//!   propagated.
//!
//! Mirrors the `pager` library's collector/worker split. Build with
//! [`builder::MetricsBuilder`].

pub mod builder;
pub mod collector;
pub mod queue;
pub mod sample;
pub mod worker;
