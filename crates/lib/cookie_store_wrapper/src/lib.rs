//! cookie_store_wrapper
//!
//! Cookie jar for scraping-style API clients.
//!
//! Wraps the RFC 6265 `cookie_store` crate so stored cookies follow real HTTP
//! semantics: domain and path matching, replacement on repeat Set-Cookie, and
//! server-driven expiry. On top of that this crate adds Serde support (embed a
//! [`cookie_store::CookieStore`] directly in your own serializable structs), a
//! bounded change log for debugging auth flows, and a cheaply clonable
//! thread-safe handle ([`shared_cookie_store::SharedCookieStore`]).
//!
//! With the `wreq` feature enabled, `SharedCookieStore` implements wreq's
//! `CookieStore` trait, so a wreq client built with it as the cookie provider
//! transparently applies every `Set-Cookie` response to the shared store.

// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]
// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

pub mod change_log;
pub mod cookie_store;
pub mod serde_support;
pub mod shared_cookie_store;

#[cfg(feature = "wreq")]
pub mod wreq_cookie_provider;
