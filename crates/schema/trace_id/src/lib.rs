//! trace_id
//!
//! Request-scoped trace identifiers for observability.
//!
//! A `TraceId` is generated for every inbound HTTP request (see the
//! `trace_id_middleware` in `storyteller-web`), stored in a tokio task-local,
//! and emitted with every log line and pager notification produced while
//! serving that request.

use std::fmt;

use serde_derive::{Deserialize, Serialize};

/// The string prefix for trace ids.
pub const TRACE_ID_PREFIX: &str = "trace_";

/// Number of Crockford base32 characters after the prefix.
/// 26 characters × 5 bits = 130 bits of entropy (≥ the 128-bit industry
/// standard for trace ids). Total length: 6 + 26 = 32 characters.
pub const TRACE_ID_ENTROPY_CHARS: usize = 26;

/// Total serialized length of a trace id ("trace_" + entropy).
pub const TRACE_ID_TOTAL_LENGTH: usize = 32;

/// Crockford base32 alphabet, lowercase (no i, l, o, u).
const CROCKFORD_LOWERCASE_CHARSET: &[u8] = b"0123456789abcdefghjkmnpqrstvwxyz";

/// A unique-per-request trace identifier, eg. `trace_1h3x9k2m4p7q8r5t6v0w2y3z4a`.
#[derive(Clone, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize)]
pub struct TraceId(String);

impl TraceId {
  /// Generate a new random trace id. Infallible.
  #[inline]
  pub fn generate() -> Self {
    use rand::Rng;

    let mut rng = rand::thread_rng();

    let entropy: String = (0..TRACE_ID_ENTROPY_CHARS)
      .map(|_| {
        let idx = rng.gen_range(0..CROCKFORD_LOWERCASE_CHARSET.len());
        CROCKFORD_LOWERCASE_CHARSET[idx] as char
      })
      .collect();

    TraceId(format!("{}{}", TRACE_ID_PREFIX, entropy))
  }

  #[inline]
  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl fmt::Display for TraceId {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl fmt::Debug for TraceId {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

tokio::task_local! {
  /// The trace id for the currently-executing request, if any.
  ///
  /// Set by the HTTP middleware via [`TRACE_ID_TASK_LOCAL.scope(...)`], and
  /// readable from anywhere within the request's task — including the
  /// logger's format closure and the pager — via [`current_trace_id`].
  pub static TRACE_ID_TASK_LOCAL: TraceId;
}

/// The trace id of the currently-executing request, if one is in scope.
///
/// Returns `None` outside of a request context (startup, background threads,
/// detached `tokio::spawn` tasks that weren't explicitly re-scoped).
#[inline]
pub fn current_trace_id() -> Option<TraceId> {
  TRACE_ID_TASK_LOCAL.try_with(|trace_id| trace_id.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;

  mod generation {
    use super::*;

    #[test]
    fn total_length_is_32() {
      assert_eq!(TraceId::generate().as_str().len(), TRACE_ID_TOTAL_LENGTH);
    }

    #[test]
    fn has_prefix() {
      assert!(TraceId::generate().as_str().starts_with(TRACE_ID_PREFIX));
    }

    #[test]
    fn entropy_uses_crockford_lowercase_only() {
      let trace_id = TraceId::generate();
      let entropy = &trace_id.as_str()[TRACE_ID_PREFIX.len()..];
      assert_eq!(entropy.len(), TRACE_ID_ENTROPY_CHARS);
      for c in entropy.chars() {
        assert!(
          CROCKFORD_LOWERCASE_CHARSET.contains(&(c as u8)),
          "unexpected character: {}",
          c
        );
      }
    }

    #[test]
    fn ids_are_unique() {
      let a = TraceId::generate();
      let b = TraceId::generate();
      assert_ne!(a, b);
    }
  }

  mod task_local {
    use super::*;

    #[tokio::test]
    async fn absent_outside_scope() {
      assert!(current_trace_id().is_none());
    }

    #[tokio::test]
    async fn present_inside_scope() {
      let trace_id = TraceId::generate();
      let expected = trace_id.clone();
      TRACE_ID_TASK_LOCAL
        .scope(trace_id, async move {
          assert_eq!(current_trace_id(), Some(expected));
        })
        .await;
    }

    #[tokio::test]
    async fn survives_await_points() {
      let trace_id = TraceId::generate();
      let expected = trace_id.clone();
      TRACE_ID_TASK_LOCAL
        .scope(trace_id, async move {
          tokio::task::yield_now().await;
          assert_eq!(current_trace_id(), Some(expected));
        })
        .await;
    }
  }
}
