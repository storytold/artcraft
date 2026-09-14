//! browser_emulation
//!
//! A small, shared vocabulary of browser identities for anti-bot-sensitive
//! HTTP clients (Cloudflare-guarded scraping endpoints, websockets, etc.).
//!
//! Pick a [`BrowserProfile`] and it configures `wreq` end to end: the TLS/JA3
//! and HTTP/2 fingerprint, the User-Agent, and the coherent identity headers
//! (`sec-ch-ua`, `accept`, `accept-encoding`, …) that a real browser sends.
//! These MUST live on the client/connection, not on individual requests, so
//! the primary entry point builds a configured client:
//!
//! ```ignore
//! let client = BrowserProfile::Firefox139.build_client()?;
//! // Every request from `client` now carries Firefox 139's fingerprint.
//! ```
//!
//! When the cookies you send were captured from a specific browser (e.g. a
//! Cloudflare `cf_clearance` cookie, which is bound to the capturing browser's
//! User-Agent), pick the profile that matches that browser so the cookie
//! validates.

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

pub mod browser_profile;
