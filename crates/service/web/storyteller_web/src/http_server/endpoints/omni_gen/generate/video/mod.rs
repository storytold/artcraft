pub mod omni_gen_video_generate_handler;
pub mod first_party_minimax_h3;
pub mod helpers;
pub mod pipeline_v2;
pub mod insert_db_job;

// Database fixture tests. Always compiled with `cfg(test)` so IDEs discover
// them and they can't bit-rot, but each test is `ignore`d unless the
// `database_tests` feature is enabled (see tests/mod.rs).
#[cfg(test)]
mod tests;
