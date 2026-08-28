use std::future::Future;
use std::time::Duration;

use anyhow::anyhow;
use log::error;

/// Deadline for a single database round trip (pool acquire + query).
///
/// sqlx's `acquire_timeout` only bounds acquiring a connection; the query
/// itself has no read timeout and the socket has no TCP keepalive, so a peer
/// that vanishes mid-query (managed-DB failover, a NAT entry expiring) parks
/// the caller forever. This is the outage that stalled the order poller for
/// hours with no log line and no alert.
pub const DATABASE_DEADLINE: Duration = Duration::from_secs(60);

/// Run `future` with a hard deadline. On timeout, logs with `label` and
/// returns an error that reads like any other failure, so the caller's usual
/// error path (alert, back off, retry next iteration) handles it.
pub async fn with_deadline<T, E, F>(
  label: &str,
  deadline: Duration,
  future: F,
) -> anyhow::Result<T>
  where
    E: Into<anyhow::Error>,
    F: Future<Output = Result<T, E>>,
{
  match tokio::time::timeout(deadline, future).await {
    Ok(Ok(value)) => Ok(value),
    Ok(Err(err)) => Err(err.into()),
    Err(_elapsed) => {
      error!("{} did not complete within {}s; abandoning it.", label, deadline.as_secs());
      Err(anyhow!("{} timed out after {}s", label, deadline.as_secs()))
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn passes_through_ok() {
    let result: anyhow::Result<u8> = with_deadline(
      "ok",
      Duration::from_secs(1),
      async { Ok::<u8, anyhow::Error>(7) },
    ).await;
    assert_eq!(result.unwrap(), 7);
  }

  #[tokio::test]
  async fn passes_through_err() {
    let result: anyhow::Result<u8> = with_deadline(
      "err",
      Duration::from_secs(1),
      async { Err::<u8, anyhow::Error>(anyhow!("boom")) },
    ).await;
    assert_eq!(result.unwrap_err().to_string(), "boom");
  }

  #[tokio::test]
  async fn reports_timeout() {
    let result: anyhow::Result<u8> = with_deadline(
      "slow query",
      Duration::from_millis(10),
      async {
        tokio::time::sleep(Duration::from_secs(5)).await;
        Ok::<u8, anyhow::Error>(1)
      },
    ).await;
    assert_eq!(result.unwrap_err().to_string(), "slow query timed out after 0s");
  }
}
