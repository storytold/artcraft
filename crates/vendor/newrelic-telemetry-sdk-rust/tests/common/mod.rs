use std::collections::HashMap;
use std::io::Read;
use std::net::{SocketAddr, TcpListener};
use std::str;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::SystemTime;

///
/// Copyright 2020 New Relic Corporation. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///
use flate2::read::GzDecoder;
use hyper::{Body, Request, Server};
use hyper::service::{make_service_fn, service_fn};
use rand::seq::SliceRandom;
use rand::thread_rng;
use tokio::runtime::Builder;

macro_rules! assert_json_eq {
    ($x: expr, $y: expr) => {
        let (left, right) = ($x, $y);
        assert!(
            serde_json::from_str::<serde_json::Value>(left)?
                == serde_json::from_str::<serde_json::Value>(right)?,
            "expected {}, got {}",
            left,
            right
        );
    };
}

#[derive(Debug)]
pub struct Error {
    message: String,
}

impl Error {
    fn new(message: &str) -> Error {
        Error {
            message: message.to_string(),
        }
    }
}

impl std::error::Error for Error {}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl From<std::str::Utf8Error> for Error {
    fn from(error: std::str::Utf8Error) -> Self {
        Error::new(&error.to_string())
    }
}

impl From<hyper::Error> for Error {
    fn from(error: hyper::Error) -> Self {
        Error::new(&error.to_string())
    }
}

pub struct Payload {
    pub headers: HashMap<String, String>,
    pub body: String,
}

pub struct Response {
    pub code: u16,
    pub headers: Vec<(String, String)>,
    pub body: String,
}

pub struct Endpoint {
    pub license: String,
    pub host: String,
    pub port: u16,
    pub timeout_ms: u128,
    server: Option<thread::JoinHandle<()>>,
    chan_payloads: Arc<Mutex<Vec<Payload>>>,
    chan_responses: Arc<Mutex<Vec<Response>>>,
    chan_stop: Option<futures::channel::oneshot::Sender<()>>,
}

impl Endpoint {
    pub fn new() -> Self {
        let payloads = Arc::new(Mutex::new(Vec::<Payload>::new()));
        let responses = Arc::new(Mutex::new(Vec::<Response>::new()));

        // Three rounds of clones are required to get the Arcs through all the
        // closure bounds.
        let (p, r) = (payloads.clone(), responses.clone());
        let new_service = make_service_fn(move |_conn| {
            let (p, r) = (p.clone(), r.clone());
            async {
                Ok::<_, hyper::Error>(service_fn(move |req| {
                    let (p, r) = (p.clone(), r.clone());
                    Endpoint::accept_payload(req, p, r)
                }))
            }
        });

        let mut runtime = Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap();

        let (sender, receiver) = futures::channel::oneshot::channel::<()>();

        let wrapped_receiver = async {
            let _ = receiver.await;
        };

        let port = Endpoint::get_available_port().expect("Cannot aquire port");

        let handle = thread::spawn(move || {
            let addr: SocketAddr = ([127, 0, 0, 1], port).into();

            let scope = async {
                Server::bind(&addr)
                    .http1_half_close(true)
                    .serve(new_service)
                    .with_graceful_shutdown(wrapped_receiver)
                    .await
                    .unwrap();
            };

            runtime.block_on(scope);
        });

        Endpoint {
            license: "license".to_string(),
            host: "127.0.0.1".to_string(),
            port: port,
            timeout_ms: 5000,
            server: Some(handle),
            chan_payloads: payloads,
            chan_responses: responses,
            chan_stop: Some(sender),
        }
    }

    pub fn reply(&self, code: u16) -> Result<(), Error> {
        self.reply_details(code, vec![], "{}")
    }

    pub fn reply_details(
        &self,
        code: u16,
        headers: Vec<(String, String)>,
        body: &str,
    ) -> Result<(), Error> {
        let mut lock = self.chan_responses.lock().unwrap();
        lock.push(Response {
            code: code,
            headers: headers,
            body: body.to_string(),
        });
        let len = lock.len();
        drop(lock);

        // Block until the response was consumed.
        let start = SystemTime::now();
        loop {
            let lock = self.chan_responses.lock().unwrap();
            if lock.len() < len {
                return Ok(());
            }

            let duration = SystemTime::now().duration_since(start).unwrap();
            if duration.as_millis() > self.timeout_ms {
                return Err(Error::new("Timeout: no request received"));
            }
        }
    }

    pub fn next_payload(&mut self) -> Result<Payload, Error> {
        let mut lock = self.chan_payloads.lock().unwrap();

        match lock.pop() {
            Some(p) => Ok(p),
            None => Err(Error::new("No payload received")),
        }
    }

    async fn accept_payload(
        req: Request<Body>,
        payloads: Arc<Mutex<Vec<Payload>>>,
        responses: Arc<Mutex<Vec<Response>>>,
    ) -> Result<hyper::Response<Body>, Error> {
        let headers: HashMap<String, String> = req
            .headers()
            .iter()
            .map(|(key, value)| (key.to_string(), value.to_str().unwrap_or("").to_string()))
            .collect();

        let body = hyper::body::to_bytes(req.into_body()).await?;
        let body_bytes: Result<Vec<u8>, _> = body.bytes().collect();
        let body_bytes = body_bytes.unwrap();

        let mut decoder = GzDecoder::new(&body_bytes[..]);
        let mut body_decoded = String::new();
        let _ = decoder.read_to_string(&mut body_decoded);

        let mut lock = payloads.lock().unwrap();
        lock.push(Payload {
            headers: headers,
            body: body_decoded,
        });

        let mut lock = responses.lock().unwrap();
        match lock.pop() {
            Some(r) => {
                let mut resp = hyper::Response::builder();

                for (k, v) in &r.headers {
                    resp = resp.header(k, v);
                }

                Ok(resp.status(r.code).body(Body::from(r.body)).unwrap())
            }
            _ => Err(Error::new("No response given")),
        }
    }

    fn get_available_port() -> Option<u16> {
        fn port_is_available(p: u16) -> bool {
            match TcpListener::bind(("127.0.0.1", p)) {
                Ok(_) => true,
                _ => false,
            }
        }

        let mut ports: Vec<u16> = (3000..5000).collect();
        ports.shuffle(&mut thread_rng());

        ports.into_iter().find(|p| port_is_available(*p))
    }
}

impl Drop for Endpoint {
    fn drop(&mut self) {
        if let Ok(_) = self.chan_stop.take().unwrap().send(()) {
            let _ = self.server.take().unwrap().join();
        }
    }
}
