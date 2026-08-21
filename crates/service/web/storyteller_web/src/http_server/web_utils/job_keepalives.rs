use log::error;
use r2d2::Pool;
use redis::Client;

use redis_common::redis_keys::RedisKeys;

/// For certain jobs or job classes (eg. non-premium), we kill the jobs if the user hasn't
/// maintained a keepalive. This prevents wasted work when users who are unlikely to return
/// navigate away. Premium users have accounts and can always return to the site, so they
/// typically do not require keepalive.
pub const JOB_KEEPALIVE_TTL_SECONDS: u64 = 60 * 3;

/// Refresh the keepalive keys for the given jobs in a single pipelined Redis round trip.
///
/// Fails open: Redis errors are logged and swallowed rather than failing the request (a failed
/// request wouldn't have refreshed the keepalive either, and the job data is already in hand).
///
/// The Redis I/O here is blocking, so callers MUST release any pooled MySQL connection before
/// calling this — holding one across Redis round trips starves the MySQL pool (this crate has
/// had pool-timeout incidents).
pub fn write_job_keepalives(redis_pool: &Pool<Client>, job_tokens: &[&str]) {
  if job_tokens.is_empty() {
    return;
  }

  let mut redis = match redis_pool.get() {
    Ok(connection) => connection,
    Err(err) => {
      // NB: Failing open can kill keepalive-required jobs if Redis is down for a while.
      error!("redis pool error writing job keepalives: {:?}", err);
      return;
    }
  };

  let mut pipe = redis::pipe();
  for job_token in job_tokens {
    let key = RedisKeys::generic_inference_keepalive(job_token);
    pipe.set_ex(key, "1", JOB_KEEPALIVE_TTL_SECONDS).ignore();
  }

  if let Err(err) = pipe.query::<()>(&mut *redis) {
    // NB: Failing open can kill keepalive-required jobs if Redis is down for a while.
    error!("redis error writing job keepalives: {:?}", err);
  }
}
