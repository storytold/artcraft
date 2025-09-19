# {{crate}}

|                 |                                             |
| --------------: | ------------------------------------------- |
|              CI | [![CI Status][badge-ci-overall]][ci]        |
|  Latest Version | [![Latest version][badge-version]][crate]   |
|   Documentation | [![Documentation][badge-docs]][docs]        |
| Crate Downloads | [![Crate downloads][badge-crate-dl]][crate] |
|         License | [![Crate license][badge-license]][github]   |

**Table of Contents**

<!-- toc -->

{{readme}}

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
