#[cfg(feature = "client")]
pub use client::{Client, ClientBuilder};
pub use span::{Span, SpanBatch};

///
/// Copyright 2020 New Relic Corporation. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///
pub mod attribute;

pub mod span;
#[cfg(feature = "client")]
mod client;

#[cfg(feature = "blocking")]
pub mod blocking {
  pub use super::client::blocking::Client;
}
