use std::future::Future;
use std::io::Write;
use std::pin::Pin;
use std::thread;
use std::time::Duration;

use anyhow::{anyhow, Result};
use flate2::Compression;
use flate2::write::GzEncoder;
use hyper::{Body, HeaderMap, Method, Request, Response, Uri};
use hyper::client::HttpConnector;
use hyper::header::{CONTENT_ENCODING, CONTENT_TYPE, USER_AGENT};
use hyper_tls::HttpsConnector;
use log::{debug, error, info};

///
/// Copyright 2020 New Relic Corporation. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///
use crate::span::SpanBatch;

const VERSION: &str = env!("CARGO_PKG_VERSION");
const TRACE_API_PATH: &str = "trace/v1";

/// Types that can be sent to a New Relic ingest API
///
/// New Relic ingest APIs currently accept batches of traces, metrics, events
/// or logs.
pub trait Sendable: std::fmt::Display + Send {
    /// Return the uuid for the `Sendable`
    ///
    /// This method returns a version 4 UUID string which enables the ingest
    /// service to identify duplicate requests.
    fn uuid(&self) -> &str;

    // Create a payload
    //
    // This method creates a JSON payload representing the contents of the
    // `Sendable` object, conforming to the requirements of a related ingest
    // API (traces, metrics, events or logs).
    fn marshall(&self) -> Result<String>;

    // Split a `Sendable`
    //
    // New Relic ingest APIs reject payloads that are too large. In that case,
    // a 413 response code is sent, the payload must be split and sent again
    // (see [the specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/communication.md#response-codes)
    // for further details).
    //
    // This method removes half of the content of the `Sendable` object and
    // puts it into a second `Sendable` object, which is returned.
    fn split(&mut self) -> Box<dyn Sendable>;
}

// Represents a New Relic ingest endpoint.
#[derive(Debug)]
struct Endpoint {
    // The host name or address of the endpoint.
    host: String,

    // The port of the endpoint. This is optional, if not given it will default
    // to the standard HTTPS port.
    port: Option<u16>,

    // The path for the endpoint.
    path: &'static str,
}

impl Endpoint {
    // Create an URI from an endpoint.
    //
    // This uses the parser of `hyper::Uri` to validate the URI and returns
    // `https` or `http` URIs, based on the `use_tls` flag.
    fn uri(&self, use_tls: bool) -> Result<Uri> {
        let port_str = match self.port {
            Some(p) => format!(":{}", p),
            _ => "".to_string(),
        };

        let uri = format!(
            "{}://{}{}/{}",
            if use_tls { "https" } else { "http" },
            self.host,
            port_str,
            self.path
        );

        Ok(uri.parse::<Uri>()?)
    }
}

/// `ClientBuilder` acts as builder for initializing a `Client`.
///
/// It can be used to customize ingest URLs, the backoff factor, the retry
/// maximum, and the product info.
///
/// ```
/// # use anyhow::Result;
/// # use newrelic_telemetry::ClientBuilder;
/// # use std::time::Duration;
/// # fn main() -> Result<()> {
/// # let api_key = "";
/// let mut builder = ClientBuilder::new(api_key);
///
/// let client = builder.backoff_factor(Duration::from_secs(10))
///                     .product_info("RustDoc", "1.0")
///                     .build()?;
/// # Ok(())
/// # }
/// ```
pub struct ClientBuilder {
    api_key: String,
    backoff_factor: Duration,
    retries_max: u32,
    endpoint_traces: Endpoint,
    product_info: Option<(String, String)>,
    blocking_queue_max: usize,
    use_tls: bool,
}

impl ClientBuilder {
    /// Initialize the client builder with an API key.
    ///
    /// Other values will be set to defaults:
    ///  * The default backoff factor will be 5 seconds.
    ///  * The default maximum of retries is 8.
    ///  * The default trace endpoint is `https://trace-api.newrelic.com/trace/v1` on port 80.
    ///  * By default, product information is empty.
    ///  * By default, no more than 100 batches are sent in one go in blocking mode.
    ///
    /// ```
    /// # use newrelic_telemetry::ClientBuilder;
    /// # let api_key = "";
    /// let mut builder = ClientBuilder::new(api_key);
    /// ```
    pub fn new(api_key: &str) -> Self {
        ClientBuilder {
            api_key: api_key.to_string(),
            backoff_factor: Duration::from_secs(5),
            retries_max: 8,
            endpoint_traces: Endpoint {
                host: "trace-api.newrelic.com".to_string(),
                port: None,
                path: TRACE_API_PATH,
            },
            product_info: None,
            blocking_queue_max: 100,
            use_tls: true,
        }
    }

    /// Configures a backoff factor.
    ///
    /// If a request fails, the SDK retries the request at increasing intervals
    /// and eventually drops data if the request cannot be completed.
    ///
    /// The amount of time to wait after a request can be computed using this
    /// logic:
    ///
    ///   `backoff_factor * (2 ^ (number_of_retries - 1))`
    ///
    /// For a backoff factor of 1 second, and a maximum of 6 retries, the retry
    /// delay interval should follow a pattern of [0, 1, 2, 4, 8, 16].
    ///
    /// See the [specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/communication.md#graceful-degradation)
    /// for further details.
    ///
    /// ```
    /// # use newrelic_telemetry::ClientBuilder;
    /// # use std::time::Duration;
    /// # let api_key = "";
    /// let mut builder =
    ///     ClientBuilder::new(api_key).backoff_factor(Duration::from_secs(10));
    /// ```
    pub fn backoff_factor(mut self, factor: Duration) -> Self {
        self.backoff_factor = factor;
        self
    }

    /// Configures the maximum numbers of retries.
    ///
    /// If a request fails, the SDK retries the request at increasing intervals
    /// and eventually drops data if the request cannot be completed.
    ///
    /// If zero is given as a maximum, no retries will be made for failed
    /// requests.
    ///
    /// For a backoff factor of 1 second, and a maximum of 6 retries, the retry
    /// delay interval should follow a pattern of [0, 1, 2, 4, 8, 16].
    ///
    /// See the [specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/communication.md#graceful-degradation)
    /// for further details.
    ///
    /// ```
    /// # use newrelic_telemetry::ClientBuilder;
    /// # let api_key = "";
    /// let mut builder =
    ///     ClientBuilder::new(api_key).retries_max(4);
    /// ```
    pub fn retries_max(mut self, retries: u32) -> Self {
        self.retries_max = retries;
        self
    }

    /// Configure the ingest host for traces.
    ///
    /// Overrides the default ingest host for traces to facilitate communication
    /// with alternative New Relic backends.
    ///
    /// ```
    /// # use newrelic_telemetry::ClientBuilder;
    /// # let api_key = "";
    /// let mut builder =
    ///     ClientBuilder::new(api_key).endpoint_traces("127.0.0.1", None);
    /// ```
    pub fn endpoint_traces(mut self, url: &str, port: Option<u16>) -> Self {
        self.endpoint_traces = Endpoint {
            host: url.to_string(),
            path: TRACE_API_PATH,
            port: port,
        };
        self
    }

    /// Configure a product and version.
    ///
    /// The specified product and version will be appended to the `User-Agent`
    /// header of payloads.
    ///
    /// See the [specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/communication.md#user-agent)
    /// for further details.
    ///
    /// ```
    /// # use newrelic_telemetry::ClientBuilder;
    /// # let api_key = "";
    /// let mut builder =
    ///     ClientBuilder::new(api_key).product_info("NewRelic-Cpp-OpenTelemetry", "0.2.1");
    /// ```
    pub fn product_info(mut self, product: &str, version: &str) -> Self {
        self.product_info = Some((product.to_string(), version.to_string()));
        self
    }

    /// Configure the maximum number of batches sent in one go in blocking mode.
    ///
    /// This configuration has no effect for default non-blocking clients.
    ///
    /// If the number of batches in the blocking client's batch queue exceeds
    /// the maximum given here, the addditional batches will be dropped. This
    /// mechanism avoids accumulating back pressure.
    ///
    /// ```
    /// # use newrelic_telemetry::ClientBuilder;
    /// # let api_key = "";
    /// let mut builder =
    ///     ClientBuilder::new(api_key).blocking_queue_max(10);
    /// ```
    pub fn blocking_queue_max(mut self, queue_max: usize) -> Self {
        self.blocking_queue_max = queue_max;
        self
    }

    // Configure TLS usage.
    //
    // New Relic endpoints exclusively support HTTPS. This is mainly provided
    // for testing purposes.
    pub fn tls(mut self, tls: bool) -> Self {
        self.use_tls = tls;
        self
    }

    /// Build a client.
    ///
    /// ```
    /// # use anyhow::Result;
    /// # use newrelic_telemetry::ClientBuilder;
    /// # fn main() -> Result<()> {
    /// # let api_key = "";
    /// let builder = ClientBuilder::new(api_key);
    ///
    /// let client = builder.build()?;
    /// # Ok(())
    /// # }
    /// ```
    pub fn build(self) -> Result<Client> {
        Client::new(self)
    }

    /// Build a blocking client.
    ///
    /// ```
    /// # use anyhow::Result;
    /// # use newrelic_telemetry::ClientBuilder;
    /// # fn main() -> Result<()> {
    /// # let api_key = "";
    /// let builder = ClientBuilder::new(api_key);
    ///
    /// let client = builder.build_blocking()?;
    /// # Ok(())
    /// # }
    /// ```
    #[cfg(feature = "blocking")]
    pub fn build_blocking(self) -> Result<blocking::Client> {
        blocking::Client::new(self)
    }

    fn get_backoff_sequence(&self) -> Vec<Duration> {
        (0..self.retries_max)
            .map(|num_retry| {
                if num_retry == 0 {
                    Duration::from_secs(0)
                } else {
                    self.backoff_factor * (2_u32.pow(num_retry - 1))
                }
            })
            .collect()
    }

    fn get_user_agent_header(&self) -> String {
        let product_info = match &self.product_info {
            Some(s) => format!(" {}/{}", s.0, s.1),
            _ => "".to_string(),
        };

        format!("NewRelic-Rust-TelemetrySDK/{}{}", VERSION, product_info)
    }
}

// An internal enum representing the state of a payload.
#[derive(Debug, PartialEq)]
enum SendableState {
    // No retry should be made.
    Done,

    // A retry should be made. Either after the given duration, or, if it
    // is `None`, according to the backoff sequence.
    Retry(Option<Duration>),

    // The payload should be split and a retry should be made for both
    // payloads.
    Split,
}

pub struct Client {
    api_key: String,
    user_agent: String,
    backoff_sequence: Vec<Duration>,
    endpoint_traces: Uri,
    client: hyper::client::Client<HttpsConnector<HttpConnector>>,
}

impl Client {
    /// Constructs a `Client` from a `ClientBuilder`.
    pub fn new(builder: ClientBuilder) -> Result<Self> {
        let https = HttpsConnector::new();
        let user_agent = builder.get_user_agent_header();
        let backoff_seq = builder.get_backoff_sequence();

        Ok(Client {
            api_key: builder.api_key,
            endpoint_traces: builder.endpoint_traces.uri(builder.use_tls)?,
            user_agent: user_agent,
            backoff_sequence: backoff_seq,
            client: hyper::client::Client::builder().build::<_, hyper::Body>(https),
        })
    }

    /// Sends a span batch.
    ///
    /// This asynchronously sends a span batch, encapsulating retry and backoff
    /// mechanisms defined in the [specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/communication.md)
    /// and customized via the `ClientBuilder`.
    pub async fn send_spans(&self, batch: SpanBatch) {
        self.send(Box::new(batch), &self.endpoint_traces).await
    }

    // Returns a gzip compressed version of the given string.
    fn to_gzip(text: &String) -> Result<Vec<u8>> {
        let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
        encoder.write_all(text.as_bytes())?;
        Ok(encoder.finish()?)
    }

    // Extract the value of the Retry-After HTTP response header
    fn extract_retry_after(headers: &HeaderMap) -> Result<Duration> {
        if let Some(dur) = headers.get("retry-after") {
            Ok(Duration::from_secs(dur.to_str()?.parse::<u64>()?))
        } else {
            Err(anyhow!("missing retry-after header"))
        }
    }

    // Sends a given `Sendable` asynchronously to a given endpoint.
    fn send<'a>(
        &'a self,
        mut batch: Box<dyn Sendable>,
        endpoint: &'a Uri,
    ) -> Pin<Box<dyn Future<Output = ()> + 'a>> {
        Box::pin(async move {
            for duration in self.backoff_sequence.iter() {
                let request = match self.request(&*batch, endpoint) {
                    Ok(r) => r,
                    Err(e) => {
                        error!("cannot create request for {}, dropping due to {}", batch, e);
                        return;
                    }
                };

                let response = match self.client.request(request).await {
                    Ok(r) => r,
                    Err(e) => {
                        error!("cannot send request for {}, dropping due to {}", batch, e);
                        return;
                    }
                };

                let status = Self::process_response(&*batch, response);

                let duration = match status {
                    SendableState::Done => return,
                    SendableState::Retry(Some(duration)) => duration,
                    SendableState::Split => {
                        let batch2 = batch.split();
                        self.send(batch, endpoint).await;
                        self.send(batch2, endpoint).await;
                        return;
                    }
                    _ => *duration,
                };

                thread::sleep(duration);
            }
        })
    }

    // Create a request from the given batch and endpoint.
    fn request<'a>(&self, batch: &(dyn Sendable + 'a), endpoint: &Uri) -> Result<Request<Body>> {
        let raw = batch.marshall()?;
        let gzipped = Self::to_gzip(&raw)?;

        Ok(Request::builder()
            .method(Method::POST)
            .uri(endpoint)
            .header("Api-Key", &self.api_key)
            .header("Data-Format", "newrelic")
            .header("Data-Format-Version", "1")
            .header("x-request-id", batch.uuid())
            .header(USER_AGENT, &self.user_agent)
            .header(CONTENT_ENCODING, "gzip")
            .header(CONTENT_TYPE, "application/json")
            .body(Body::from(gzipped))?)
    }

    // Based on the response from an ingest endpoint, decide whether to
    // retry or split a payload.
    //
    // See the [specification](https://github.com/newrelic/newrelic-telemetry-sdk-specs/blob/master/communication.md#response-codes)
    // for further details.
    fn process_response<'a, T>(
        batch: &(dyn Sendable + 'a),
        response: Response<T>,
    ) -> SendableState {
        let status = response.status();

        match status.as_u16() {
            200..=299 => {
                debug!("response {}, successfully sent {}", status, batch);
            }
            400 | 401 | 403 | 404 | 405 | 409 | 410 | 411 => {
                error!("response {}, dropping {}", status, batch);
            }
            413 => {
                info!(
                    "response {}, payload too large, splitting {}",
                    status, batch
                );
                return SendableState::Split;
            }
            429 => match Self::extract_retry_after(response.headers()) {
                Ok(duration) => {
                    info!(
                        "response {}: retry interval {:?}, retrying {}",
                        status, duration, batch
                    );

                    return SendableState::Retry(Some(duration));
                }
                Err(e) => {
                    error!("response {}, {}, dropping {}", status, e, batch);
                }
            },
            _ => {
                debug!("response {}, retry {}", status, batch);
                return SendableState::Retry(None);
            }
        }
        return SendableState::Done;
    }
}

#[cfg(feature = "blocking")]
pub mod blocking {
  use std::sync::mpsc;
  use std::sync::Mutex;
  use std::thread;

  use anyhow::Result;
  use futures::future;
  use log::warn;
  use tokio::runtime::Builder;

  use super::{ClientBuilder, SpanBatch};

  enum SendableType {
        Spans(SpanBatch),
    }

    pub struct Client {
        channel: Mutex<mpsc::Sender<Box<SendableType>>>,
        handle: thread::JoinHandle<()>,
    }

    impl Client {
        pub fn new(builder: ClientBuilder) -> Result<Self> {
            let (tx, rx) = mpsc::channel::<Box<SendableType>>();
            let mut runtime = Builder::new().threaded_scheduler().enable_all().build()?;
            let queue_max = builder.blocking_queue_max;
            let client = builder.build()?;

            let handle = thread::spawn(move || loop {
                let mut batches = vec![];

                // Wait until at least one batch is received.
                match rx.recv() {
                    Ok(b) => batches.push(b),
                    Err(_) => break,
                };

                // Empty the channel.
                loop {
                    match rx.try_recv() {
                        Ok(b) => batches.push(b),
                        Err(_) => break,
                    }
                }

                // Drop batches that exceed the maximum defined queue size.
                if batches.len() > queue_max {
                    warn!(
                        "back pressure, dropping {} span batches",
                        batches.len() - queue_max
                    );
                    batches.drain(queue_max..);
                }

                // Block until all batches are sent.
                runtime.block_on(future::join_all(batches.drain(..).map(|b| match *b {
                    SendableType::Spans(batch) => client.send_spans(batch),
                })));
            });

            Ok(Client {
                channel: Mutex::new(tx),
                handle,
            })
        }

        pub fn send_spans(&self, b: SpanBatch) {
            if let Ok(ch) = self.channel.lock() {
                if let Err(_) = ch.send(Box::new(SendableType::Spans(b))) {}
            }
        }

        pub fn shutdown(self) {
            drop(self.channel);

            let _ = self.handle.join();
        }
    }
}

#[cfg(test)]
mod tests {
  use std::fmt;
  use std::io::Read;
  use std::time::Duration;

  use anyhow::Result;
  use flate2::read::GzDecoder;
  use hyper::{Method, Response};
  use hyper::header::{CONTENT_ENCODING, CONTENT_TYPE, HeaderValue, USER_AGENT};

  use super::*;

  pub struct TestBatch;

    impl Sendable for TestBatch {
        fn uuid(&self) -> &str {
            ""
        }

        fn marshall(&self) -> Result<String> {
            Ok("".to_string())
        }

        fn split(&mut self) -> Box<dyn Sendable> {
            Box::new(TestBatch)
        }
    }

    impl fmt::Display for TestBatch {
        fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
            write!(f, "<TestBatch>")
        }
    }

    #[test]
    fn build() -> Result<()> {
        let client = ClientBuilder::new("0000")
            .backoff_factor(Duration::from_secs(2))
            .retries_max(6)
            .endpoint_traces("127.0.0.1", Some(8080))
            .product_info("Test", "1.0")
            .build()?;

        assert_eq!(client.api_key, "0000");
        assert_eq!(client.endpoint_traces.host(), Some("127.0.0.1"));
        assert_eq!(client.endpoint_traces.port_u16(), Some(8080));
        assert_eq!(client.endpoint_traces.scheme().unwrap().as_str(), "https");
        assert_eq!(
            client.user_agent,
            format!("NewRelic-Rust-TelemetrySDK/{} Test/1.0", VERSION)
        );
        assert_eq!(
            client.backoff_sequence,
            vec![0, 2, 4, 8, 16, 32]
                .into_iter()
                .map(|d| Duration::from_secs(d))
                .collect::<Vec<Duration>>()
        );

        Ok(())
    }

    #[test]
    fn build_error() {
        let client = ClientBuilder::new("0000")
            .endpoint_traces(":80", Some(8080))
            .build();

        assert!(client.is_err());
    }

    #[test]
    fn uri_from_endpoint_ok() -> Result<()> {
        let endpoint = Endpoint {
            host: "host".to_string(),
            path: TRACE_API_PATH,
            port: Some(80),
        };

        let uri = endpoint.uri(true)?;
        assert_eq!(uri.host(), Some("host"));
        assert_eq!(uri.port_u16(), Some(80));
        assert_eq!(uri.path(), "/trace/v1");
        assert_eq!(uri.scheme().unwrap().as_str(), "https");

        Ok(())
    }

    #[test]
    fn uri_from_endpoint_no_tls_ok() -> Result<()> {
        let endpoint = Endpoint {
            host: "host".to_string(),
            path: TRACE_API_PATH,
            port: Some(80),
        };

        let uri = endpoint.uri(false)?;
        assert_eq!(uri.host(), Some("host"));
        assert_eq!(uri.port_u16(), Some(80));
        assert_eq!(uri.path(), "/trace/v1");
        assert_eq!(uri.scheme().unwrap().as_str(), "http");

        Ok(())
    }

    #[test]
    fn uri_from_endpoint_error() -> Result<()> {
        for endpoint in vec![
            Endpoint {
                host: "host:80".to_string(),
                path: TRACE_API_PATH,
                port: Some(80),
            },
            Endpoint {
                host: "?".to_string(),
                path: TRACE_API_PATH,
                port: Some(80),
            },
            Endpoint {
                host: "".to_string(),
                path: TRACE_API_PATH,
                port: None,
            },
        ] {
            let uri = endpoint.uri(true);

            assert!(
                uri.is_err(),
                format!("Could create an uri from {:?}: {:?}", endpoint, uri)
            );
        }

        Ok(())
    }

    #[test]
    fn to_gzip() -> Result<()> {
        let text = "Text to be encoded".to_string();
        let encoded = Client::to_gzip(&text)?;

        let mut gz = GzDecoder::new(&encoded[..]);
        let mut decoded = String::new();
        gz.read_to_string(&mut decoded)?;

        assert_eq!(decoded, text);

        Ok(())
    }

    #[test]
    fn extract_retry_after() -> Result<()> {
        let mut headers = hyper::HeaderMap::new();

        let when = Client::extract_retry_after(&headers);
        assert!(when.is_err());

        headers.insert("Retry-after", "7".parse()?);

        let when = Client::extract_retry_after(&headers)?;
        assert_eq!(when, Duration::from_secs(7));

        headers.insert("Retry-after", "seven".parse()?);

        let when = Client::extract_retry_after(&headers);
        assert!(when.is_err());

        Ok(())
    }

    #[test]
    fn process_response_success() -> Result<()> {
        for code in 200..300 {
            let batch = Box::new(TestBatch);
            let response = Response::builder().status(code).body(())?;

            assert_eq!(
                Client::process_response(&*batch, response),
                SendableState::Done
            );
        }

        Ok(())
    }

    #[test]
    fn process_response_error() -> Result<()> {
        for code in vec![400, 401, 403, 404, 405, 409, 410, 411] {
            let batch = Box::new(TestBatch);
            let response = Response::builder().status(code).body(())?;

            assert_eq!(
                Client::process_response(&*batch, response),
                SendableState::Done
            );
        }

        Ok(())
    }

    #[test]
    fn process_response_split() -> Result<()> {
        let batch = Box::new(TestBatch);
        let response = Response::builder().status(413).body(())?;

        assert_eq!(
            Client::process_response(&*batch, response),
            SendableState::Split
        );

        Ok(())
    }

    #[test]
    fn process_response_retry_from_header() -> Result<()> {
        let batch = Box::new(TestBatch);
        let response = Response::builder()
            .status(429)
            .header("retry-after", "7")
            .body(())?;

        assert_eq!(
            Client::process_response(&*batch, response),
            SendableState::Retry(Some(Duration::from_secs(7)))
        );

        Ok(())
    }

    #[test]
    fn process_response_retry() -> Result<()> {
        let mut codes = vec![402, 406, 407, 408];
        codes.append(&mut (100..200).collect());
        codes.append(&mut (300..400).collect());
        codes.append(&mut (430..600).collect());

        for code in codes {
            let batch = Box::new(TestBatch);
            let response = Response::builder().status(code).body(())?;

            assert_eq!(
                Client::process_response(&*batch, response),
                SendableState::Retry(None),
                "expected retry on {}",
                code
            );
        }

        Ok(())
    }

    #[test]
    fn request() -> Result<()> {
        let batch = Box::new(TestBatch);
        let client = ClientBuilder::new("").build()?;
        let endpoint = Endpoint {
            host: "host".to_string(),
            path: TRACE_API_PATH,
            port: None,
        };

        let request = client.request(&*batch, &endpoint.uri(true)?)?;

        assert_eq!(request.uri().port(), None);
        assert_eq!(request.uri().host(), Some("host"));
        assert_eq!(request.uri().path(), "/trace/v1");
        assert_eq!(request.method(), Method::POST);

        let headers = request.headers();

        let expected_headers = vec![
            (CONTENT_ENCODING.as_str(), "gzip"),
            (CONTENT_TYPE.as_str(), "application/json"),
            ("Api-Key", &client.api_key),
            ("Data-Format", "newrelic"),
            ("Data-Format-Version", "1"),
            ("x-request-id", batch.uuid()),
            (USER_AGENT.as_str(), &client.user_agent),
        ];
        let expected_count = expected_headers.len();
        for (header, expected) in expected_headers {
            let value = headers.get(header);
            let expected = HeaderValue::from_str(expected)?;
            assert_eq!(value, Some(&expected));
        }

        assert_eq!(headers.len(), expected_count, "Unexpected header present!");

        Ok(())
    }

    #[test]
    fn request_port() -> Result<()> {
        let batch = Box::new(TestBatch);
        let client = ClientBuilder::new("").build()?;
        let endpoint = Endpoint {
            host: "host".to_string(),
            path: TRACE_API_PATH,
            port: Some(80),
        };

        let request = client.request(&*batch, &endpoint.uri(true)?)?;

        assert_eq!(request.uri().port().unwrap().as_u16(), 80);
        assert_eq!(request.uri().host(), Some("host"));
        assert_eq!(request.uri().path(), "/trace/v1");

        Ok(())
    }

    #[test]
    fn builder_default() {
        let b = ClientBuilder::new("0000");

        assert_eq!(b.api_key, "0000");
        assert_eq!(b.backoff_factor, Duration::from_secs(5));
        assert_eq!(b.retries_max, 8);
        assert_eq!(b.endpoint_traces.host, "trace-api.newrelic.com");
        assert_eq!(b.endpoint_traces.port, None);
        assert_eq!(b.product_info, None);
        assert_eq!(b.use_tls, true);
    }

    #[test]
    fn builder_setters() {
        let b = ClientBuilder::new("0000")
            .backoff_factor(Duration::from_secs(10))
            .retries_max(10)
            .endpoint_traces("127.0.0.1", Some(8080))
            .product_info("Test", "1.0");

        assert_eq!(b.api_key, "0000");
        assert_eq!(b.backoff_factor, Duration::from_secs(10));
        assert_eq!(b.retries_max, 10);
        assert_eq!(b.endpoint_traces.host, "127.0.0.1");
        assert_eq!(b.endpoint_traces.port, Some(8080));
        assert_eq!(
            b.product_info,
            Some(("Test".to_string(), "1.0".to_string()))
        );
    }

    #[test]
    fn backoff_sequence_default() {
        let seq = ClientBuilder::new("").get_backoff_sequence();

        assert_eq!(
            seq,
            vec![0, 5, 10, 20, 40, 80, 160, 320]
                .into_iter()
                .map(|d| Duration::from_secs(d))
                .collect::<Vec<Duration>>()
        );
    }

    #[test]
    fn backoff_sequence_no_retry() {
        let seq = ClientBuilder::new("").retries_max(0).get_backoff_sequence();

        assert_eq!(seq, vec![]);
    }

    #[test]
    fn backoff_sequence_custom() {
        let seq = ClientBuilder::new("")
            .backoff_factor(Duration::from_secs(2))
            .retries_max(6)
            .get_backoff_sequence();

        assert_eq!(
            seq,
            vec![0, 2, 4, 8, 16, 32]
                .into_iter()
                .map(|d| Duration::from_secs(d))
                .collect::<Vec<Duration>>()
        );
    }

    #[test]
    fn user_agent_header_default() {
        let header = ClientBuilder::new("").get_user_agent_header();

        assert_eq!(header, format!("NewRelic-Rust-TelemetrySDK/{}", VERSION));
    }

    #[test]
    fn user_agent_header_custom() {
        let header = ClientBuilder::new("")
            .product_info("Doc", "1.0")
            .get_user_agent_header();

        assert_eq!(
            header,
            format!("NewRelic-Rust-TelemetrySDK/{} Doc/1.0", VERSION)
        );
    }
}
