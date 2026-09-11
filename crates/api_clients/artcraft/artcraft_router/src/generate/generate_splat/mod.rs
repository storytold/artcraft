// New audio-style pipeline (marble 1.x; use `GenerateSplatRequestBuilder::build2()`).
pub mod generate_splat_request_builder;
pub mod providers;
pub mod splat_generation_draft;
pub mod splat_generation_draft_context;
pub mod splat_generation_draft_or_request;
pub mod splat_generation_request;

// Shared between the new and legacy pipelines.
pub mod generate_splat_response;
pub mod splat_generation_cost_estimate;

// Legacy plan-based pipeline (marble 0.1 only; still used by the desktop app).
pub mod cost;
pub mod execute;
pub mod generate_splat_request;
pub mod plan;
pub mod splat_generation_plan;
