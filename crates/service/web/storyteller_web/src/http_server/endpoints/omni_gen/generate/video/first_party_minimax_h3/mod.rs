//! First-party Minimax H3 (Turbo / Ultra) video generation.
//!
//! These models are fulfilled by our own GPU inference rather than an
//! external provider, so enqueueing only writes database records — a
//! scheduler runs the jobs later.

pub mod enqueue_first_party_minimax_h3_job;
pub mod minimax_h3_ultra_cost;
