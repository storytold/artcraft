//! A client for OpenRouter (https://openrouter.ai), which runs many providers' models behind one
//! API key. Only the Image API (`POST /api/v1/images`) is implemented: it is synchronous and
//! returns the images inline, base64 encoded.

pub mod api;
pub mod creds;
pub mod error;
