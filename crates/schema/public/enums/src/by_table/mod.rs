// ===== MySql =====
pub mod audit_logs;
pub mod batch_generations;
pub mod characters;
pub mod beta_keys;
pub mod comments;
pub mod email_sender_jobs;
pub mod entity_stats;
pub mod featured_items;
pub mod generic_download_jobs;
pub mod generic_inference_jobs;
pub mod generic_synthetic_ids;
pub mod media_files;
pub mod media_uploads;
pub mod model_categories;
pub mod model_weights;
pub mod prompt_context_items;
pub mod prompts;
pub mod tag_uses;
pub mod trending_model_analytics;
pub mod tts_models;
pub mod usages;
pub mod user_bookmarks;
pub mod user_ratings;
pub mod users;
pub mod voice_conversion_models;
pub mod voice_conversion_results;
pub mod wallet_ledger_entries;
pub mod zs_voices;

// ===== Sqlite =====
pub mod tts_render_tasks;
pub mod web_rendition_targets;
pub mod web_scraping_targets;
