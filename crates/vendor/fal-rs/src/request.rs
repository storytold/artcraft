use std::marker::PhantomData;
use percent_encoding_rfc3986::{utf8_percent_encode, NON_ALPHANUMERIC};
use reqwest::IntoUrl;
use serde::{de::DeserializeOwned, Serialize};
use log::info;
use crate::{
    queue::{Queue, QueueResponse},
    FalError,
};
use crate::webhook::WebhookResponse;

/// A request to the FAL API
///
/// You can provide an API key using the [with_client](crate::request::FalRequest::with_client) function.
/// If no API key is provided, the `FAL_API_KEY` environment variable will be used, if present.
///
/// ```rust,no_run
/// #[cfg(feature = "endpoints_fal-ai_flux")]
/// # {
/// use fal::prelude::*;
/// use fal::endpoints::fal_ai::flux;
///
/// #[tokio::main]
/// async fn main() {
///     let api_key = std::env::var("FAL_API_KEY").unwrap();
///
///     let response = flux::dev::dev(flux::dev::DevTextToImageInput {
///         prompt: "a majestic horse in a field".to_string(),
///         ..Default::default()
///     })
///     .with_api_key(api_key)
///     .send()
///     .await
///     .unwrap();
///
///     println!("Generated image URL: {}", response.images[0].url);
/// }
/// # }
/// ```
#[derive(Debug)]
pub struct FalRequest<Params: Serialize, Response: DeserializeOwned> {
    /// The Reqwest Client to use to make requests
    pub client: reqwest::Client,
    /// The endpoint to make the request to
    pub endpoint: String,
    /// The parameters to send to the endpoint
    pub params: Params,
    /// The API key to use to make the request
    /// If not provided, the `FAL_API_KEY` environment variable will be used
    pub api_key: Option<String>,
    phantom: PhantomData<Response>,
}

impl<Params: Serialize, Response: DeserializeOwned> FalRequest<Params, Response> {
    pub fn new(endpoint: impl Into<String>, params: Params) -> Self {
        Self {
            client: reqwest::Client::new(),
            endpoint: endpoint.into(),
            params,
            api_key: std::env::var("FAL_API_KEY").ok(),
            phantom: PhantomData,
        }
    }

    /// Use a specific Reqwest Client to make requests
    pub fn with_client(mut self, client: reqwest::Client) -> Self {
        self.client = client;

        self
    }

    /// Use a specific API key to make requests
    pub fn with_api_key(mut self, api_key: impl Into<String>) -> Self {
        self.api_key = Some(api_key.into());

        self
    }

    /// Send the request and wait for the response
    pub async fn send(self) -> Result<Response, FalError> {
        let response = self
            .client
            .post(format!("https://fal.run/{}", self.endpoint))
            .json(&self.params)
            .header(
                "Authorization",
                format!(
                    "Key {}",
                    self.api_key.expect(
                        "No fal API key provided, and FAL_API_KEY environment variable is not set"
                    )
                ),
            )
            .header("Content-Type", "application/json")
            .send()
            .await?;

        if response.status() != 200 {
            let error = response.text().await?;
            return Err(error.into());
        }

        Ok(response.error_for_status()?.json().await?)
    }

    /// For requests that take longer than several seconds, as it is usually the case with AI applications, we have built a queue system.
    ///
    /// Utilizing our queue system offers you a more granulated control to handle unexpected surges in traffic.
    /// It further provides you with the capability to cancel requests if needed and grants you the observability to monitor your current
    /// position within the queue. Besides that using the queue system spares you from the headache of keeping around long running https requests.
    pub async fn queue(self) -> Result<Queue<Response>, FalError> {
        let key = self
            .api_key
            .expect("No fal API key provided, and FAL_API_KEY environment variable is not set");

        let response = self
            .client
            .post(format!("https://queue.fal.run/{}", self.endpoint))
            .json(&self.params)
            .header("Authorization", format!("Key {}", &key))
            .header("Content-Type", "application/json")
            .send()
            .await?;

        if response.status() != 200 {
            let error = response.text().await?;
            return Err(error.into());
        }

        let payload: QueueResponse = response.error_for_status()?.json().await?;

        Ok(Queue::new(self.client, self.endpoint, key, payload))
    }

    pub async fn queue_webhook<U: IntoUrl>(self, url: U) -> Result<WebhookResponse, FalError> {
        let key = self
            .api_key
            .expect("No fal API key provided, and FAL_API_KEY environment variable is not set");

        let url_encoded = url.into_url()?;
        //let url_encoded = utf8_percent_encode(url_encoded.as_str(), NON_ALPHANUMERIC).to_string();

        let request_url = format!("https://queue.fal.run/{}?fal_webhook={}", self.endpoint, url_encoded);

        info!("Sending request to FAL queue webhook: {}", request_url);

        let builder = self
            .client
            .post(request_url);
        
        let builder = builder
            .json(&self.params)
            .header("Authorization", format!("Key {}", &key))
            .header("Content-Type", "application/json");

        let response = builder
            .send();
        
        let response = response
            .await?;

        if response.status() != 200 {
            let error = response.text().await?;
            return Err(error.into());
        }

        let payload: WebhookResponse = response.error_for_status()?.json().await?;

        Ok(payload)
    }
}
