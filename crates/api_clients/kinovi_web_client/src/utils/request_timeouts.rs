use std::time::Duration;

/// Total request deadline (connect + send + receive) for ordinary Kinovi
/// API calls: tRPC queries, order/character polling, generation submits.
///
/// Without a deadline a peer that accepts the connection and then never
/// answers parks the caller forever — the job loops that poll Kinovi have no
/// other way to recover from that short of a pod restart.
pub const KINOVI_REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

/// Deadline for file uploads to Kinovi's storage, which legitimately take
/// longer than an API round trip for large reference videos.
pub const KINOVI_UPLOAD_TIMEOUT: Duration = Duration::from_secs(5 * 60);
