// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

//! A rate limiter using a fixed window counter for arbitrary keys, backed by Redis.
//!
//! # About
//!
//! This library provides a fixed window counter for arbitrary keys backed by a Redis instance. The
//! period length and per-period maximum limit are configurable on setup. The communication with
//! the backend is performing in a non-blocking, asynchronous fashion allowing the library to pair
//! with other async frameworks such as Tokio, Actix, etc.
//!
//! *Note*: Currently pre-*async/await* Futures are used (that is Futures 0.1.x) but that may be
//! upgraded in the near future as the Rust 1.39.0 release is near.
//!
//! # Usage
//!
//! Add `limitation` to your `Cargo.toml`:
//!
//! ```toml
//! [dependencies]
//! limitation = "0.1.1"
//! ```
//!
//! ## Quick Example
//!
//! The primary type is the [`Limiter`] which uses a builder to construct itself. Once built, use
//! the [`count`] method with a key representing a user, a session, an interaction, etc. Note that
//! `count` is a Future and therefore has to be driving to completion with a runtime. For example,
//! to run one count on a key of `"10.0.0.5"`:
//!
//! [`Limiter`]: struct.Limiter.html
//! [`count`]: struct.Limiter.html#method.count
//!
//! ```no_run
//! use limitation::Limiter;
//! use futures::Future;
//!
//! // Build a Limiter with a default rate with a local running Redis instance
//! let limiter = Limiter::build("redis://127.0.0.1/").finish()?;
//! // The key to count and track
//! let key = "10.0.0.5";
//!
//! // TODO(bt,2023-12-12): This doctest is so far behind in `futures` versions and needs to be updated.
//! //  Tokio should be executing the future and evaluating the result.
//! // Start and run a Tokio runtime to drive the Future to completion
//! //let mut rt = tokio::runtime::Runtime::new().unwrap();
//! //rt.block_on(...)//!
//! let _r = limiter
//!         // Count returns a Status if the key is under the limit and an `Error::LimitExceeded`
//!         // containing a Status if the limit has been exceeded
//!         .count(key)
//!         // This example deals with both limit exceeded and any Redis connection issues. In this
//!         // case we'll print the error to the standard error stream to show the current limit
//!         // status
//!         .map_err(|err| eprintln!("err: {}", err))
//!         // In this case we are under the limit and can print out the limit status to the
//!         // standard output stream
//!         .and_then(|status| {
//!             println!("ok: {:?}", status);
//!             Ok(())
//!         })
//!         .wait();
//! //);
//! # Ok::<(), limitation::Error>(())
//! ```
//!
//! ## The Limiter Builder
//!
//! The builder for the `Limiter` has 2 settings which can be customized to the use case:
//!
//! - [`limit`]: The high water mark for number of requests in the period. The default is `5000`.
//! - [`period`]: A `Duration` for the period window. The default is 60 minutes.
//!
//! ```no_run
//! use limitation::Limiter;
//! use std::time::Duration;
//!
//! let limiter = Limiter::build("redis://127.0.0.1/")
//!     .limit(5)
//!     .period(Duration::from_secs(10))
//!     .finish()?;
//! # Ok::<(), limitation::Error>(())
//! ```
//!
//! [`limit`]: struct.Builder.html#method.limit
//! [`period`]: struct.Builder.html#method.period
//!
//! # Examples
//!
//! A simple example that uses this library can be found in [limitation-example].
//!
//! [limitation-example]: https://github.com/fnichol/limitation/tree/master/limitation-example
//!
//! # Related Projects and References
//!
//! The primary inspiration for the implementation was a blog post called [An alternative approach
//! to building a simple API Rate limiter using NodeJS and Redis][blog-post] by [Atul
//! R](https://twitter.com/masteratul94).
//!
//! Other research and references used for this library:
//!
//! - <https://nordicapis.com/everything-you-need-to-know-about-api-rate-limiting/>
//! - <https://hechao.li/2018/06/25/Rate-Limiter-Part1/>
//! - <https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/>
//! - <https://engagor.github.io/blog/2017/05/02/sliding-window-rate-limiter-redis/>
//!
//! [blog-post]: https://blog.atulr.com/rate-limiter/
//!
//! # Ideas and Future Work
//!
//! These are some ideas and potential future work for this project. If you're reading this then
//! maybe you're curious or interesting in helping out? Great! Be sure to check out the
//! [Contributing] section and dig in!
//!
//! - Investigate and offer alternative rate-limiting algorithms, notably a Sliding Window
//! solution.
//! - Add async Redis connection pooling with the `bb8` and `bb8-redis` crates to reduce
//! connection establishment delays.
//! - Add a `status` method on `Limiter` which returns they key's `Status` without counting a
//! request.
//! - Add `RedisServer` support in an integration testing suite, similar to the infrastructure in
//! the [redis] crate.
//!
//! [Contributing]: https://github.com/fnichol/limitation/tree/master/limitation#contributing
//! [redis]: https://github.com/mitsuhiko/redis-rs/blob/master/tests/support/mod.rs

#![doc(html_root_url = "https://docs.rs/limitation/0.1.1")]
#![deny(missing_docs)]

use chrono::SubsecRound;
use futures::Future;
use redis::Client;
use std::convert::TryInto;
use std::error;
use std::fmt;
use std::ops::Add;
use std::time::Duration;
use time;

/// The default limit of requests in a period
const DEFAULT_LIMIT: usize = 5000;
/// The default length of the period in seconds
const DEFAULT_PERIOD_SECS: u64 = 60 * 60;

/// A rate limiter using a fixed window counter, backed by Redis.
///
/// The per-period limit and the period duration are customizable when building an instance.
///
/// The [`count`] method is the primary unit of interaction which requires a key representing a
/// user, a session, an interaction, etc. This method returns a Future which needs a runtime to
/// drive the task to completion asynchronously.
///
/// [`count`]: #method.count
#[derive(Clone, Debug)]
pub struct Limiter {
    /// The Redis client
    client: Client,
    /// The per-period limit
    limit: usize,
    /// The period duration
    period: Duration,
}

impl Limiter {
    /// Returns a builder for a `Limiter`.
    ///
    /// The [`finish`] method will build the final `Limiter` and perform a **synchronous**
    /// connection test to the Redis backend.
    ///
    /// [`finish`]: struct.Builder.html#method.finish
    pub fn build(redis_url: &str) -> Builder {
        Builder {
            redis_url,
            limit: DEFAULT_LIMIT,
            period: Duration::from_secs(DEFAULT_PERIOD_SECS),
        }
    }

    /// Counts a request on a key over a period and returns a [`Status`].
    ///
    /// The `Status` type gives the caller a current state snapshot for the given key. If the limit
    /// is exceeded a `Error::LimitExceeded` will be returned which also contains a `Status`.
    /// Critically, the `Status` contains a time when the next period begins and the limit will
    /// reset. The time is a "unix timestamp" in UTC time.
    ///
    /// # Errors
    ///
    /// Returns an `Err` if:
    ///
    /// - The limit has been exceeded in the current period
    /// - A client error has occurred
    /// - A time computation failed
    ///
    /// [`Status`]: struct.Status.html
    pub fn count<K: Into<String>>(&self, key: K) -> impl Future<Item = Status, Error = Error> {
        let limit = self.limit;

        self.track(key).and_then(move |(count, reset_epoch_utc)| {
            let status = build_status(count, limit, reset_epoch_utc);

            if count > limit {
                Err(Error::LimitExceeded(status))
            } else {
                Ok(status)
            }
        })
    }

    /// Tracks the given key in a period and returns the count and TTL for the key in seconds.
    fn track<K: Into<String>>(&self, key: K) -> impl Future<Item = (usize, usize), Error = Error> {
        let key = key.into();
        let exipres = self.period.as_secs();

        self.client
            .get_async_connection()
            .from_err()
            .and_then(move |con| {
                // The seed of this approach is outlined Atul R in a blog post about rate limiting
                // using NodeJS and Redis. For more details, see
                // https://blog.atulr.com/rate-limiter/
                let mut pipe = redis::pipe();
                pipe.atomic()
                    .cmd("SET")
                    .arg(&key)
                    .arg(0)
                    .arg("EX")
                    .arg(exipres)
                    .arg("NX")
                    .ignore()
                    .cmd("INCR")
                    .arg(&key)
                    .cmd("TTL")
                    .arg(&key);

                pipe.query_async(con)
                    .from_err()
                    .and_then(|(_, (count, ttl)): (_, (usize, u64))| {
                        Ok((count, epoch_utc_plus(Duration::from_secs(ttl))?))
                    })
            })
    }
}

/// A report for a given key containing the limit status.
///
/// The status contains the following information:
///
/// - [`limit`]: the maximum number of requests allowed in the current period
/// - [`remaining`]: how many requests are left in the current period
/// - [`reset_epoch_utc`]: a UNIX timestamp in UTC approximately when the next period will begin
///
/// [`limit`]: #method.limit
/// [`remaining`]: #method.remaining
/// [`reset_epoch_utc`]: #method.reset_epoch_utc
#[derive(Clone, Debug)]
pub struct Status {
    limit: usize,
    remaining: usize,
    reset_epoch_utc: usize,
}

impl Status {
    /// Returns the maximum number of requests permitted in the current period.
    pub fn limit(&self) -> usize {
        self.limit
    }

    /// Returns the number of requests remaining in the current period.
    pub fn remaining(&self) -> usize {
        self.remaining
    }

    /// Returns a UNIX timestamp in UTC approximately when the next period will begin.
    pub fn reset_epoch_utc(&self) -> usize {
        self.reset_epoch_utc
    }
}

/// A builder for a [`Limiter`].
///
/// [`Limiter`]: struct.Limiter.html
pub struct Builder<'a> {
    redis_url: &'a str,
    limit: usize,
    period: Duration,
}

impl Builder<'_> {
    /// Sets a new maximum limit for the Limiter.
    pub fn limit(&mut self, limit: usize) -> &mut Self {
        self.limit = limit;
        self
    }

    /// Sets a new period duration for the Limiter.
    pub fn period(&mut self, period: Duration) -> &mut Self {
        self.period = period;
        self
    }

    /// Finializes and returns a `Limiter`.
    ///
    /// Note that this method will connect to the Redis server to test its connection which is a
    /// **synchronous** operation.
    ///
    /// # Errors
    ///
    /// Returns an `Err` if the Redis client fails to be created or fails to connect.
    pub fn finish(&self) -> Result<Limiter, Error> {
        Ok(Limiter {
            client: Client::open(self.redis_url)?,
            limit: self.limit,
            period: self.period,
        })
    }
}

/// Error type for this crate.
#[derive(Debug)]
pub enum Error {
    /// The Redis client failed to connect or run a query.
    Client(redis::RedisError),
    /// The limit is exceeded for a key.
    LimitExceeded(Status),
    /// A time conversion failed.
    Time(time::Error),
    /// A time conversion failed (Chrono).
    ChronoTime(chrono::OutOfRangeError),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::Client(ref err) => write!(f, "client error ({})", err),
            Error::LimitExceeded(ref status) => write!(f, "rate limit exceeded ({:?})", status),
            Error::Time(ref err) => write!(f, "time conversion error ({})", err),
            Error::ChronoTime(ref err) => write!(f, "time conversion error ({})", err),
        }
    }
}

impl error::Error for Error {
    fn source(&self) -> Option<&(dyn error::Error + 'static)> {
        match self {
            Error::Client(ref err) => err.source(),
            Error::LimitExceeded(_) => None,
            Error::Time(ref err) => err.source(),
            Error::ChronoTime(ref err) => err.source(),
        }
    }
}

impl From<redis::RedisError> for Error {
    fn from(err: redis::RedisError) -> Self {
        Error::Client(err)
    }
}

impl From<time::Error> for Error {
    fn from(err: time::Error) -> Self {
        Error::Time(err)
    }
}

impl From<chrono::OutOfRangeError> for Error {
    fn from(err: chrono::OutOfRangeError) -> Self {
        Error::ChronoTime(err)
    }
}

/// Builds a `Status`.
fn build_status(count: usize, limit: usize, reset_epoch_utc: usize) -> Status {
    let remaining = if count >= limit { 0 } else { limit - count };

    Status {
        limit,
        remaining,
        reset_epoch_utc,
    }
}

/// Calculates a timestamp for "now plus a duration".
fn epoch_utc_plus(duration: Duration) -> Result<usize, chrono::OutOfRangeError> {
    Ok(chrono::Utc::now()
        .add(chrono::Duration::from_std(duration)?)
        .round_subsecs(0)
        .timestamp()
        .try_into()
        .unwrap_or(0))
}
