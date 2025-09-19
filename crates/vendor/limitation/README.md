# limitation

|                 |                                             |
| --------------: | ------------------------------------------- |
|              CI | [![CI Status][badge-ci-overall]][ci]        |
|  Latest Version | [![Latest version][badge-version]][crate]   |
|   Documentation | [![Documentation][badge-docs]][docs]        |
| Crate Downloads | [![Crate downloads][badge-crate-dl]][crate] |
|         License | [![Crate license][badge-license]][github]   |

**Table of Contents**

<!-- toc -->

- [About](#about)
- [Usage](#usage)
  - [Quick Example](#quick-example)
  - [The Limiter Builder](#the-limiter-builder)
- [Examples](#examples)
- [Related Projects and References](#related-projects-and-references)
- [Ideas and Future Work](#ideas-and-future-work)
- [CI Status](#ci-status)
  - [Build (master branch)](#build-master-branch)
  - [Test (master branch)](#test-master-branch)
  - [Check (master branch)](#check-master-branch)
- [Code of Conduct](#code-of-conduct)
- [Issues](#issues)
- [Contributing](#contributing)
- [Release History](#release-history)
- [Authors](#authors)
- [License](#license)

<!-- tocstop -->

A rate limiter using a fixed window counter for arbitrary keys, backed by Redis.

## About

This library provides a fixed window counter for arbitrary keys backed by a
Redis instance. The period length and per-period maximum limit are configurable
on setup. The communication with the backend is performing in a non-blocking,
asynchronous fashion allowing the library to pair with other async frameworks
such as Tokio, Actix, etc.

_Note_: Currently pre-_async/await_ Futures are used (that is Futures 0.1.x) but
that may be upgraded in the near future as the Rust 1.39.0 release is near.

## Usage

Add `limitation` to your `Cargo.toml`:

```toml
[dependencies]
limitation = "0.1.1"
```

### Quick Example

The primary type is the [`Limiter`] which uses a builder to construct itself.
Once built, use the [`count`] method with a key representing a user, a session,
an interaction, etc. Note that `count` is a Future and therefore has to be
driving to completion with a runtime. For example, to run one count on a key of
`"10.0.0.5"`:

[`limiter`]: struct.Limiter.html
[`count`]: struct.Limiter.html#method.count

```rust
use limitation::Limiter;
use futures::Future;

// Build a Limiter with a default rate with a local running Redis instance
let limiter = Limiter::build("redis://127.0.0.1/").finish()?;
// The key to count and track
let key = "10.0.0.5";

// Start and run a Tokio runtime to drive the Future to completion
tokio::run(
    limiter
        // Count returns a Status if the key is under the limit and an `Error::LimitExceeded`
        // containing a Status if the limit has been exceeded
        .count(key)
        // This example deals with both limit exceeded and any Redis connection issues. In this
        // case we'll print the error to the standard error stream to show the current limit
        // status
        .map_err(|err| eprintln!("err: {}", err))
        // In this case we are under the limit and can print out the limit status to the
        // standard output stream
        .and_then(|status| {
            println!("ok: {:?}", status);
            Ok(())
        }),
);
```

### The Limiter Builder

The builder for the `Limiter` has 2 settings which can be customized to the use
case:

- [`limit`]: The high water mark for number of requests in the period. The
  default is `5000`.
- [`period`]: A `Duration` for the period window. The default is 60 minutes.

```rust
use limitation::Limiter;
use std::time::Duration;

let limiter = Limiter::build("redis://127.0.0.1/")
    .limit(5)
    .period(Duration::from_secs(10))
    .finish()?;
```

[`limit`]: struct.Builder.html#method.limit
[`period`]: struct.Builder.html#method.period

## Examples

A simple example that uses this library can be found in [limitation-example].

[limitation-example]:
  https://github.com/fnichol/limitation/tree/master/limitation-example

## Related Projects and References

The primary inspiration for the implementation was a blog post called [An
alternative approach to building a simple API Rate limiter using NodeJS and
Redis][blog-post] by [Atul R](https://twitter.com/masteratul94).

Other research and references used for this library:

- <https://nordicapis.com/everything-you-need-to-know-about-api-rate-limiting/>
- <https://hechao.li/2018/06/25/Rate-Limiter-Part1/>
- <https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/>
- <https://engagor.github.io/blog/2017/05/02/sliding-window-rate-limiter-redis/>

[blog-post]: https://blog.atulr.com/rate-limiter/

## Ideas and Future Work

These are some ideas and potential future work for this project. If you're
reading this then maybe you're curious or interesting in helping out? Great! Be
sure to check out the [Contributing] section and dig in!

- Investigate and offer alternative rate-limiting algorithms, notably a Sliding
  Window solution.
- Add async Redis connection pooling with the `bb8` and `bb8-redis` crates to
  reduce connection establishment delays.
- Add a `status` method on `Limiter` which returns they key's `Status` without
  counting a request.
- Add `RedisServer` support in an integration testing suite, similar to the
  infrastructure in the [redis] crate.

[contributing]:
  https://github.com/fnichol/limitation/tree/master/limitation#contributing
[redis]: https://github.com/mitsuhiko/redis-rs/blob/master/tests/support/mod.rs

## CI Status

### Build (master branch)

| Operating System | Stable Rust                                                             | Nightly Rust                                                              | <abbr title="Minimum Supported Rust Version">MSRV</abbr>                |
| ---------------: | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
|          FreeBSD | [![FreeBSD Stable Build Status][badge-stable_freebsd-build]][ci-master] | [![FreeBSD Nightly Build Status][badge-nightly_freebsd-build]][ci-master] | [![FreeBSD Oldest Build Status][badge-oldest_freebsd-build]][ci-master] |
|            Linux | [![Linux Stable Build Status][badge-stable_linux-build]][ci-master]     | [![Linux Nightly Build Status][badge-nightly_linux-build]][ci-master]     | [![Linux Oldest Build Status][badge-oldest_linux-build]][ci-master]     |
|            macOS | [![macOS Stable Build Status][badge-stable_macos-build]][ci-master]     | [![macOS Nightly Build Status][badge-nightly_macos-build]][ci-master]     | [![macOS Oldest Build Status][badge-oldest_macos-build]][ci-master]     |
|          Windows | [![Windows Stable Build Status][badge-stable_windows-build]][ci-master] | [![Windows Nightly Build Status][badge-nightly_windows-build]][ci-master] | [![Windows Oldest Build Status][badge-oldest_windows-build]][ci-master] |

### Test (master branch)

| Operating System | Stable Rust                                                           | Nightly Rust                                                            | <abbr title="Minimum Supported Rust Version">MSRV</abbr>              |
| ---------------: | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
|          FreeBSD | [![FreeBSD Stable Test Status][badge-stable_freebsd-test]][ci-master] | [![FreeBSD Nightly Test Status][badge-nightly_freebsd-test]][ci-master] | [![FreeBSD Oldest Test Status][badge-oldest_freebsd-test]][ci-master] |
|            Linux | [![Linux Stable Test Status][badge-stable_linux-test]][ci-master]     | [![Linux Nightly Test Status][badge-nightly_linux-test]][ci-master]     | [![Linux Oldest Test Status][badge-oldest_linux-test]][ci-master]     |
|            macOS | [![macOS Stable Test Status][badge-stable_macos-test]][ci-master]     | [![macOS Nightly Test Status][badge-nightly_macos-test]][ci-master]     | [![macOS Oldest Test Status][badge-oldest_macos-test]][ci-master]     |
|          Windows | [![Windows Stable Test Status][badge-stable_windows-test]][ci-master] | [![Windows Nightly Test Status][badge-nightly_windows-test]][ci-master] | [![Windows Oldest Test Status][badge-oldest_windows-test]][ci-master] |

### Check (master branch)

|        | Status                                            |
| ------ | ------------------------------------------------- |
| Lint   | [![Lint Status][badge-check-lint]][ci-master]     |
| Format | [![Format Status][badge-check-format]][ci-master] |

## Code of Conduct

This project adheres to the Contributor Covenant [code of
conduct][code-of-conduct]. By participating, you are expected to uphold this
code. Please report unacceptable behavior to fnichol@nichol.ca.

## Issues

If you have any problems with or questions about this project, please contact us
through a [GitHub issue][issues].

## Contributing

You are invited to contribute to new features, fixes, or updates, large or
small; we are always thrilled to receive pull requests, and do our best to
process them as fast as we can.

Before you start to code, we recommend discussing your plans through a [GitHub
issue][issues], especially for more ambitious contributions. This gives other
contributors a chance to point you in the right direction, give you feedback on
your design, and help you find out if someone else is working on the same thing.

## Release History

See the [changelog] for a full release history.

## Authors

Created and maintained by [Fletcher Nichol][fnichol] (<fnichol@nichol.ca>).

## License

Licensed under the Mozilla Public License Version 2.0 ([LICENSE.txt][license]).

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the MPL-2.0 license, shall be
licensed as above, without any additional terms or conditions.

[badge-check-format]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=check&script=format
[badge-check-lint]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=check&script=lint
[badge-ci-overall]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square
[badge-crate-dl]:
  https://img.shields.io/crates/d/limitation.svg?style=flat-square
[badge-docs]: https://docs.rs/limitation/badge.svg?style=flat-square
[badge-license]:
  https://img.shields.io/crates/l/limitation.svg?style=flat-square
[badge-nightly_freebsd-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_freebsd&script=build
[badge-nightly_freebsd-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_freebsd&script=test
[badge-nightly_linux-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_linux&script=build
[badge-nightly_linux-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_linux&script=test
[badge-nightly_macos-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_macos&script=build
[badge-nightly_macos-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_macos&script=test
[badge-nightly_windows-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_windows&script=build
[badge-nightly_windows-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_nightly_windows&script=test
[badge-oldest_freebsd-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_freebsd&script=build
[badge-oldest_freebsd-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_freebsd&script=test
[badge-oldest_linux-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_linux&script=build
[badge-oldest_linux-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_linux&script=test
[badge-oldest_macos-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_macos&script=build
[badge-oldest_macos-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_macos&script=test
[badge-oldest_windows-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_windows&script=build
[badge-oldest_windows-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_1.35.0_windows&script=test
[badge-stable_freebsd-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_freebsd&script=build
[badge-stable_freebsd-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_freebsd&script=test
[badge-stable_linux-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_linux&script=build
[badge-stable_linux-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_linux&script=test
[badge-stable_macos-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_macos&script=build
[badge-stable_macos-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_macos&script=test
[badge-stable_windows-build]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_windows&script=build
[badge-stable_windows-test]:
  https://img.shields.io/cirrus/github/fnichol/limitation.svg?style=flat-square&task=test_stable_windows&script=test
[badge-version]:
  https://img.shields.io/crates/v/limitation.svg?style=flat-square
[changelog]:
  https://github.com/fnichol/limitation/blob/master/limitation/CHANGELOG.md
[ci]: https://cirrus-ci.com/github/fnichol/limitation
[ci-master]: https://cirrus-ci.com/github/fnichol/limitation/master
[code-of-conduct]:
  https://github.com/fnichol/limitation/blob/master/limitation/CODE_OF_CONDUCT.md
[commonmark]: https://commonmark.org/
[crate]: https://crates.io/crates/limitation
[docs]: https://docs.rs/limitation
[fnichol]: https://github.com/fnichol
[github]: https://github.com/fnichol/limitation
[issues]: https://github.com/fnichol/limitation/issues
[license]:
  https://github.com/fnichol/limitation/blob/master/limitation/LICENSE.txt
