//! Starting an image generation at Midjourney or fal (the Tauri app's `handle_midjourney` and
//! `handle_fal`): the ArtCraft prompt record, then the provider's request through the router.

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use artcraft_client::utils::api_host::ApiHost;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::router_image_model::RouterImageModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::client::router_midjourney_client::RouterMidjourneyClient;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use artcraft_router::generate::generate_image::router_image_request_to_artcraft_prompt::router_image_request_to_artcraft_prompt;
use log::warn;
use serde::de::DeserializeOwned;
use serde_json::{Map, Value};
use tokens::tokens::batch_generations::BatchGenerationToken;

use super::accounts::ProviderAccounts;
use super::jobs::ProviderJob;
use super::{Provider, is_midjourney};
use crate::backend::api_message;

/// Direct Midjourney jobs always make this many images.
const MIDJOURNEY_BATCH: u16 = 4;

/// Why a generation couldn't start.
#[derive(Debug, PartialEq)]
pub enum SubmitError {
  /// The provider's account isn't connected (or its login expired).
  NeedsAccount(Provider),
  Message(String),
}

impl From<String> for SubmitError {
  fn from(message: String) -> Self {
    SubmitError::Message(message)
  }
}

impl From<&str> for SubmitError {
  fn from(message: &str) -> Self {
    SubmitError::Message(message.to_owned())
  }
}

/// Starts `fields` (the image page's OmniGen request) at `provider`; `image_urls` are the
/// references' CDN links.
pub async fn submit(host: &ApiHost, creds: Option<&StorytellerCredentialSet>, accounts: &ProviderAccounts, provider: Provider, fields: &Map<String, Value>, image_urls: Vec<String>) -> Result<ProviderJob, SubmitError> {
  match provider {
    Provider::Midjourney => submit_midjourney(host, creds, accounts, fields, image_urls).await,
    Provider::Fal => submit_fal(host, creds, accounts, fields, image_urls).await,
    Provider::Artcraft => Err("ArtCraft generations go through OmniGen".into()),
  }
}

async fn submit_midjourney(host: &ApiHost, creds: Option<&StorytellerCredentialSet>, accounts: &ProviderAccounts, fields: &Map<String, Value>, image_urls: Vec<String>) -> Result<ProviderJob, SubmitError> {
  let model_id = model_id(fields);
  if !is_midjourney(model_id) {
    return Err("This model cannot use a Midjourney account".into());
  }
  if !image_urls.is_empty() {
    return Err("Direct Midjourney does not support image references yet".into());
  }
  if fields.get("image_batch_count").and_then(Value::as_u64).is_some_and(|n| n != u64::from(MIDJOURNEY_BATCH)) {
    return Err("Direct Midjourney generates four images per job".into());
  }
  let mut builder = request_builder(RouterProvider::Midjourney, fields, Vec::new())?;
  builder.resolution = None;
  builder.quality = None;
  builder.image_batch_count = Some(MIDJOURNEY_BATCH);
  let prompt_request = router_image_request_to_artcraft_prompt(&builder);
  let Ok(ImageGenerationDraftOrRequest::Request(generation)) = builder.build2() else {
    return Err("Unexpected Midjourney request draft".into());
  };
  let session = accounts.midjourney.session().await.map_err(|err| err.to_string())?.ok_or(SubmitError::NeedsAccount(Provider::Midjourney))?;
  // The prompt comes first, so the results can be attributed to it after a restart.
  let creds = creds.ok_or("Please sign in to generate.")?;
  let prompt = create_prompt(host, Some(creds), prompt_request).await.map_err(|err| api_message(&err))?;
  let client = RouterClient::Midjourney(RouterMidjourneyClient::new(session.cookie_header, session.user_id, session.browser));
  let GenerateImageResponse::Midjourney(response) = generation.send_request(&client).await.map_err(router_message(Provider::Midjourney))? else {
    return Err("Unexpected Midjourney response".into());
  };
  Ok(new_job(Provider::Midjourney, fields, u32::from(MIDJOURNEY_BATCH), response.job_id, None, None, Some(prompt.prompt_token.to_string())))
}

async fn submit_fal(host: &ApiHost, creds: Option<&StorytellerCredentialSet>, accounts: &ProviderAccounts, fields: &Map<String, Value>, image_urls: Vec<String>) -> Result<ProviderJob, SubmitError> {
  let key = accounts.fal_key().ok_or(SubmitError::NeedsAccount(Provider::Fal))?;
  let builder = request_builder(RouterProvider::Fal, fields, image_urls)?;
  // The prompt record is a nicety here: the generation goes ahead without it.
  let maybe_prompt_token = match creds {
    Some(creds) => create_prompt(host, Some(creds), router_image_request_to_artcraft_prompt(&builder)).await.map(|p| p.prompt_token.to_string()).map_err(|err| warn!("Couldn't create the prompt record: {}", api_message(&err))).ok(),
    None => None,
  };
  let generation = match builder.build2() {
    Ok(ImageGenerationDraftOrRequest::Request(generation)) => generation,
    Ok(ImageGenerationDraftOrRequest::Draft(_)) => return Err("Fal should not be sending draft requests".into()),
    Err(err) => return Err(err.to_string().into()),
  };
  let client = RouterClient::Fal(RouterFalClient::new_polling_only_from_raw_key(&key));
  let GenerateImageResponse::Fal(response) = generation.send_request(&client).await.map_err(router_message(Provider::Fal))? else {
    return Err("Unexpected FAL response".into());
  };
  let request_id = response.request_id.or(response.gateway_request_id).ok_or("FAL didn't return a request id")?;
  let count = fields.get("image_batch_count").and_then(Value::as_u64).map_or(1, |n| n.max(1) as u32);
  Ok(new_job(Provider::Fal, fields, count, request_id, response.maybe_status_url, response.maybe_response_url, maybe_prompt_token))
}

/// The router's request for the page's fields. The setting values are the router's own names
/// (`wide_sixteen_by_nine`, `one_k`, `high`).
fn request_builder(provider: RouterProvider, fields: &Map<String, Value>, image_urls: Vec<String>) -> Result<GenerateImageRequestBuilder, String> {
  let model = match (parse::<RouterImageModel>(fields.get("model")), model_id(fields)) {
    (Some(model), _) => model,
    // The generic Midjourney model is the newest version.
    (None, "midjourney") => RouterImageModel::Midjourney8,
    (None, id) => return Err(format!("{id} isn't available on this provider")),
  };
  let mismatch = if matches!(provider, RouterProvider::Midjourney) { GenerationModeMismatchStrategy::AbortGeneration } else { GenerationModeMismatchStrategy::GenerateAnyway };
  Ok(GenerateImageRequestBuilder { model, provider, prompt: fields.get("prompt").and_then(Value::as_str).map(str::to_owned), image_inputs: (!image_urls.is_empty()).then_some(ImageListRef::Urls(image_urls)), resolution: parse(fields.get("resolution")), aspect_ratio: parse(fields.get("aspect_ratio")), quality: parse(fields.get("quality")), image_batch_count: fields.get("image_batch_count").and_then(Value::as_u64).map(|n| n as u16), horizontal_angle: None, vertical_angle: None, zoom: None, request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade, generation_mode_mismatch_strategy: Some(mismatch), idempotency_token: None })
}

fn new_job(provider: Provider, fields: &Map<String, Value>, batch_count: u32, provider_job_id: String, maybe_status_url: Option<String>, maybe_response_url: Option<String>, maybe_prompt_token: Option<String>) -> ProviderJob {
  ProviderJob { id: format!("local_{}", uuid::Uuid::new_v4()), provider, model_id: model_id(fields).to_owned(), prompt: fields.get("prompt").and_then(Value::as_str).unwrap_or_default().to_owned(), created_at: chrono::Utc::now().timestamp(), batch_count, provider_job_id, maybe_status_url, maybe_response_url, maybe_prompt_token, batch_token: BatchGenerationToken::generate().to_string(), upload_tokens: Vec::new(), uploaded: Vec::new() }
}

/// What the user sees for a router error: billing problems point at the provider's website
/// (`GenericProviderBillingBlock`).
fn router_message(provider: Provider) -> impl Fn(ArtcraftRouterError) -> SubmitError {
  move |err| match err {
    ArtcraftRouterError::ProviderBillingError(_) => SubmitError::Message(format!("Please set up {} on their website to use it with ArtCraft.", provider.label())),
    other => SubmitError::Message(other.to_string()),
  }
}

fn model_id(fields: &Map<String, Value>) -> &str {
  fields.get("model").and_then(Value::as_str).unwrap_or_default()
}

fn parse<T: DeserializeOwned>(value: Option<&Value>) -> Option<T> {
  value.cloned().and_then(|v| serde_json::from_value(v).ok())
}

#[cfg(test)]
mod tests {
  use serde_json::json;

  use super::*;

  #[test]
  fn page_fields_become_the_routers_request() {
    let fields = json!({ "model": "nano_banana_pro", "prompt": "a fox", "aspect_ratio": "wide_sixteen_by_nine", "resolution": "two_k", "quality": "high", "image_batch_count": 2 });
    let b = request_builder(RouterProvider::Fal, fields.as_object().unwrap(), vec!["https://cdn/x.png".into()]).unwrap();
    assert_eq!(b.model, RouterImageModel::NanoBananaPro);
    assert_eq!((b.prompt.as_deref(), b.image_batch_count), (Some("a fox"), Some(2)));
    assert!(b.aspect_ratio.is_some() && b.resolution.is_some() && b.quality.is_some() && b.image_inputs.is_some());
    let generic = request_builder(RouterProvider::Midjourney, json!({ "model": "midjourney" }).as_object().unwrap(), Vec::new()).unwrap();
    assert_eq!(generic.model, RouterImageModel::Midjourney8);
    assert!(request_builder(RouterProvider::Fal, json!({ "model": "seedance_2p0" }).as_object().unwrap(), Vec::new()).is_err());
  }

  #[tokio::test]
  async fn direct_midjourney_checks_its_limits_before_anything_else() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-submit-{}", uuid::Uuid::new_v4()));
    let accounts = ProviderAccounts::load(&dir);
    let host = ApiHost::Storyteller;
    let run = |fields: Value, urls: Vec<String>| {
      let (host, accounts) = (&host, &accounts);
      async move { submit(host, None, accounts, Provider::Midjourney, fields.as_object().unwrap(), urls).await }
    };
    assert_eq!(run(json!({ "model": "flux_1_dev" }), Vec::new()).await.unwrap_err(), SubmitError::Message("This model cannot use a Midjourney account".into()));
    assert_eq!(run(json!({ "model": "midjourney_7" }), vec!["u".into()]).await.unwrap_err(), SubmitError::Message("Direct Midjourney does not support image references yet".into()));
    assert_eq!(run(json!({ "model": "midjourney_7", "image_batch_count": 2 }), Vec::new()).await.unwrap_err(), SubmitError::Message("Direct Midjourney generates four images per job".into()));
    assert_eq!(run(json!({ "model": "midjourney_7", "prompt": "a fox", "image_batch_count": 4 }), Vec::new()).await.unwrap_err(), SubmitError::NeedsAccount(Provider::Midjourney), "no login yet");
    let fal = submit(&host, None, &accounts, Provider::Fal, json!({ "model": "flux_1_dev" }).as_object().unwrap(), Vec::new()).await;
    assert_eq!(fal.unwrap_err(), SubmitError::NeedsAccount(Provider::Fal));
    let _ = std::fs::remove_dir_all(dir);
  }
}
