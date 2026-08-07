//! Internal-facing endpoints for our own worker fleets (GPU inference).
//! Authenticated with internal API keys (`INTERNAL_API_KEYS`),
//! never consumer credentials.

pub mod minimax_jobs;
