//! OpenRouter's Image API takes the same normalized options for every model, so one builder
//! serves them all; `models` holds what each model accepts.

pub mod build;
pub mod models;
pub mod request;
