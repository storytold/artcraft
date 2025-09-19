///
/// Copyright 2020 New Relic Corporation. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///
#[cfg(feature = "blocking")]
#[macro_use]
mod common;

#[cfg(feature = "blocking")]
mod blocking {
  use std::thread;
  use std::time::Duration;

  use anyhow::Result;

  use common::Endpoint;
  use newrelic_telemetry::{blocking::Client, ClientBuilder, Span, SpanBatch};

  use super::common;

  pub fn setup() -> Result<(Endpoint, Client)> {
        let _ = env_logger::builder().is_test(true).try_init();

        let endpoint = Endpoint::new();
        let client = ClientBuilder::new(&endpoint.license)
            .endpoint_traces(&endpoint.host, Some(endpoint.port))
            .tls(false)
            .build_blocking()?;

        Ok((endpoint, client))
    }

    #[test]
    fn backoff() -> Result<()> {
        let _ = env_logger::builder().is_test(true).try_init();

        let mut endpoint = Endpoint::new();
        thread::sleep(Duration::from_secs(2));
        let client = ClientBuilder::new(&endpoint.license)
            .retries_max(3)
            .backoff_factor(Duration::from_secs(0))
            .endpoint_traces(&endpoint.host, Some(endpoint.port))
            .tls(false)
            .build_blocking()?;

        let span_batch = SpanBatch::new();

        client.send_spans(span_batch);

        // Four payloads should be sent: the initial one and 3 retries.
        for num in 1..4 {
            endpoint.reply(500)?;
            assert!(endpoint.next_payload().is_ok(), "receiving payload {}", num);
        }

        assert!(endpoint.next_payload().is_err(), "dropping payload");

        Ok(())
    }

    #[test]
    fn retry_after() -> Result<()> {
        let _ = env_logger::builder()
            .is_test(true)
            .parse_filters("debug")
            .try_init();

        let mut endpoint = Endpoint::new();
        let client = ClientBuilder::new(&endpoint.license)
            .retries_max(5)
            .backoff_factor(Duration::from_secs(3600))
            .endpoint_traces(&endpoint.host, Some(endpoint.port))
            .tls(false)
            .build_blocking()?;

        let span_batch = SpanBatch::new();

        client.send_spans(span_batch);

        // Six payloads should be sent: the initial one and 5 retries.
        //
        // If the retry-after header is not read, this should hang for a very long time.
        for num in 1..6 {
            endpoint.reply_details(
                429,
                vec![("Retry-After".to_string(), "0".to_string())],
                "{}",
            )?;
            assert!(endpoint.next_payload().is_ok(), "receiving payload {}", num);
        }

        assert!(endpoint.next_payload().is_err(), "dropping payload");

        Ok(())
    }

    #[test]
    fn headers() -> Result<()> {
        let (mut endpoint, client) = setup()?;

        let span_batch = SpanBatch::new();

        client.send_spans(span_batch);
        endpoint.reply(202)?;

        let p = endpoint.next_payload()?;

        assert_eq!(
            p.headers.get("content-type"),
            Some(&"application/json".to_string())
        );
        assert_eq!(p.headers.get("content-encoding"), Some(&"gzip".to_string()));

        assert_eq!(p.headers.get("data-format"), Some(&"newrelic".to_string()));
        assert_eq!(p.headers.get("data-format-version"), Some(&"1".to_string()));

        let user_agent = format!("NewRelic-Rust-TelemetrySDK/{}", env!("CARGO_PKG_VERSION"));
        assert_eq!(p.headers.get("user-agent"), Some(&user_agent));

        Ok(())
    }

    #[test]
    fn product() -> Result<()> {
        let _ = env_logger::builder().is_test(true).try_init();

        let mut endpoint = Endpoint::new();
        let client = ClientBuilder::new(&endpoint.license)
            .endpoint_traces(&endpoint.host, Some(endpoint.port))
            .product_info("SomeProduct", "3.14.9")
            .tls(false)
            .build_blocking()?;

        let span_batch = SpanBatch::new();

        client.send_spans(span_batch);
        endpoint.reply(202)?;

        let p = endpoint.next_payload()?;

        let user_agent = format!(
            "NewRelic-Rust-TelemetrySDK/{} SomeProduct/3.14.9",
            env!("CARGO_PKG_VERSION")
        );
        assert_eq!(p.headers.get("user-agent"), Some(&user_agent));

        Ok(())
    }

    #[test]
    fn drop_payload() -> Result<()> {
        for code in vec![400, 401, 403, 404, 405, 409, 410, 411] {
            let (mut endpoint, client) = setup()?;

            let span_batch = SpanBatch::new();

            client.send_spans(span_batch);
            endpoint.reply(code)?;

            assert!(endpoint.next_payload().is_ok(), "first attempt to send");
            assert!(endpoint.next_payload().is_err(), "payload dropped");
        }

        Ok(())
    }

    #[test]
    fn backpressure() -> Result<()> {
        let _ = env_logger::builder().is_test(true).try_init();

        let mut endpoint = Endpoint::new();
        let client = ClientBuilder::new(&endpoint.license)
            .endpoint_traces(&endpoint.host, Some(endpoint.port))
            .tls(false)
            .blocking_queue_max(1)
            .build_blocking()?;

        for _ in 0..10 {
            client.send_spans(SpanBatch::new());
        }

        endpoint.reply(202)?;
        assert!(endpoint.next_payload().is_ok(), "first batch sent");

        assert!(
            endpoint.next_payload().is_err(),
            "additional batches dropped"
        );

        Ok(())
    }

    #[test]
    fn split_payload() -> Result<()> {
        let (mut endpoint, client) = setup()?;

        let mut span_batch = SpanBatch::new();

        let span_batch = vec![
            Span::new("id1", "tid1", 1000),
            Span::new("id2", "tid2", 2000),
            Span::new("id1", "tid1", 1000),
            Span::new("id2", "tid2", 2000),
        ]
        .into();

        client.send_spans(span_batch);
        endpoint.reply(413)?;
        endpoint.reply(202)?;
        endpoint.reply(202)?;

        assert_json_eq!(
            &endpoint.next_payload()?.body,
            r#"
            [{
              "spans": [
                {
                  "id": "id1",
                  "timestamp": 1000,
                  "trace.id": "tid1"
                },
                {
                  "id": "id2",
                  "timestamp": 2000,
                  "trace.id": "tid2"
                }
              ]
            }]"#
        );

        assert_json_eq!(
            &endpoint.next_payload()?.body,
            r#"
            [{
              "spans": [
                {
                  "id": "id1",
                  "timestamp": 1000,
                  "trace.id": "tid1"
                },
                {
                  "id": "id2",
                  "timestamp": 2000,
                  "trace.id": "tid2"
                }
              ]
            }]"#
        );

        // Skip the first payload that is rejected.
        endpoint.next_payload()?.body;

        Ok(())
    }
}
