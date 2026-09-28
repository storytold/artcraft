//! artcraft_client_identity
//!
//! How the ArtCraft desktop app identifies itself (`Origin`, `User-Agent`) to each destination.
//!
//! Our own APIs get the declared ArtCraft desktop identity. Known third-party providers get an
//! identity close to their own website, and never ours. The native third-party Rust clients
//! (Grok, Midjourney, Sora, etc.) set their own headers and do not use this crate.

pub mod destination;
pub mod origins;
pub mod third_party_provider;
pub mod user_agents;
