[![Community Project header](https://github.com/newrelic/open-source-office/raw/master/examples/categories/images/Community_Project.png)](https://github.com/newrelic/open-source-office/blob/master/examples/categories/index.md#community-project)

# New Relic Rust Telemetry SDK

![Build status](https://github.com/newrelic/newrelic-telemetry-sdk-rust/workflows/CI/badge.svg)
[![Release](https://img.shields.io/github/v/release/newrelic/newrelic-telemetry-sdk-rust?include_prereleases&style=)](https://github.com/newrelic/newrelic-telemetry-sdk-rust/releases/)

What is the New Relic Rust Telemetry SDK?

* It's a helper library that supports sending New Relic data from within your Rust application.
* It's the foundation of [New Relic's C Telemetry SDK](https://github.com/newrelic/newrelic-telemetry-sdk-c).
* It’s an example of "best practices" for sending us data.

[The Telemetry SDK](https://docs.newrelic.com/docs/telemetry-data-platform/get-started/capabilities/telemetry-sdks-send-custom-telemetry-data-new-relic) provides you, the end-user programmer, with a `Client `that sends `Spans` to New Relic. Individual spans are collected together into batches (via a `SpanBatch` object), and clients send these batches.  It serves as a foundation for getting open-standards based telemetry data like [OpenCensus](https://opencensus.io/), [OpenTracing](https://opentracing.io/), and [OpenTelemetry](https://opentelemetry.io/) into New Relic. You can use this to build tracers/exporters, such as ones based on these open standards.

This SDK currently supports sending spans to the [Trace API](https://docs.newrelic.com/docs/understand-dependencies/distributed-tracing/trace-api/introduction-trace-api).

**This project is currently in an alpha state.** The API of this crate is
likely to change, therefore there's no API documentation available yet.

## Getting Started

In order to send telemetry data to New Relic APIs, you will need an Insert API key. To find out how to generate this key, see our [docs](https://docs.newrelic.com/docs/apis/get-started/intro-apis/types-new-relic-api-keys).

The Rust Telemetry SDK is not published on [crates.io](https://crates.io) 
yet. In order to use it in your Rust application, you have to clone this
repository locally and include the crate via the local path name. If you
cloned the Rust Telemetry SDK into a `vendor` subfolder of your Rust crate,
you can add it as a dependency to your crate by adding the following dependency
to your `Cargo.toml`:

```toml
[dependencies]
newrelic-telemetry = { path = "vendor/newrelic-telemetry-sdk-rust" }
```

This is a simple application that sends a single span via the asynchronous
client:
```rust
use newrelic_telemetry::{ClientBuilder, Span};
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

#[tokio::main]
async fn main() {
    // Obtain a license key from the environment.
    let license_key = env::var("NEW_RELIC_API_KEY").unwrap();

    // Build an asynchronous client.
    let client = ClientBuilder::new(&license_key).build().unwrap();

    // Create a span and a span batch.
    let span = Span::new(
        "e9f54a2c322d7578",
        "1b1bf29379951c1d",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    )
    .name("/index.html")
    .attribute("username", "user")
    .service_name("Telemetry Application");

    let span_batch = vec![span].into();

    // Send a span batch and await the future.
    client.send_spans(span_batch).await;
}
```

## Find and use your data

Tips on how to find and query your data in New Relic:
- [Find trace/span data](https://docs.newrelic.com/docs/understand-dependencies/distributed-tracing/trace-api/introduction-trace-api#view-data)

For general querying information, see:
- [Query New Relic data](https://docs.newrelic.com/docs/query-your-data/explore-query-data/explore-data/introduction-querying-new-relic-data)
- [Intro to NRQL](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/get-started/introduction-nrql-new-relics-query-language)

## Support

New Relic hosts and moderates an online forum where customers can interact with
New Relic employees as well as other customers to get help and share best
practices. Like all official New Relic open source projects, there's a related
Community topic in the New Relic Explorers Hub. You can find this project's
topic/threads in the [Telemetry SDK section of Explorers Hub](https://discuss.newrelic.com/t/new-relic-rust-telemetry-sdk/114558)

## Contributing

We encourage your contributions to improve the Rust Telemetry SDK! Keep in mind
when you submit your pull request, you'll need to sign the CLA via the 
click-through using CLA-Assistant. You only have to sign the CLA one time per
project. If you have any questions, or to execute our corporate CLA, required
if your contribution is on behalf of a company,  please drop us an email at
opensource@newrelic.com.

## License

The Rust Telemetry SDK is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) 
License.

### Limitations

The New Relic Telemetry APIs are rate limited. Please reference the
documentation for [New Relic Metric API](https://docs.newrelic.com/docs/introduction-new-relic-metric-api) 
and [New Relic Trace API requirements and limits](https://docs.newrelic.com/docs/apm/distributed-tracing/trace-api/trace-api-general-requirements-limits)
on the specifics of the rate limits.
