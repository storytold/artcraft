//! A fal wrapper
//!
//! fal.ai hosts many third-party AI models (image, video, 3D mesh, audio) behind one HTTP API.
//! This crate is ArtCraft's client for it. The pieces, in the order a job moves through them:
//!
//! 1. `requests` builds and submits a job to the fal queue (one folder per model).
//! 2. `polling` asks fal for the job's status and, when finished, downloads the result.
//! 3. `webhook_payload` parses the result when fal pushes it to us instead of us polling.
//!
//! The rest is support code: `creds` (API keys), `error` (error types) and `utils`.
//! `requests_old` is the older per-model code, kept until callers move to `requests`.

// API key wrappers.
pub mod creds;
// Error types and the logic that sorts fal failures into friendly categories.
pub mod error;
// Checking on queued jobs and fetching their results.
pub mod polling;
// Submitting new jobs (the current model-by-model layout).
pub mod requests;
// Older submission functions, kept for existing callers.
pub mod requests_old;
// Small helpers.
pub mod utils;
// Parsing the result that fal POSTs to our webhook.
pub mod webhook_payload;
