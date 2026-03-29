use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::requests::poll_characters::request_types::*;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Public args ---

pub struct PollCharactersArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// Maximum number of characters to return.
  pub limit: u32,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

// --- Public response ---

pub struct PollCharactersResponse {
  pub characters: Vec<CharacterStatus>,
}

// --- Public types ---

/// The lifecycle status of a character creation task.
#[derive(Debug, Clone, PartialEq)]
pub enum CharacterTaskStatus {
  Pending,
  Processing,
  Completed,
  Failed,
  Unknown(String),
}

impl CharacterTaskStatus {
  fn from_str(s: &str) -> Self {
    match s {
      "PENDING" => Self::Pending,
      "PROCESSING" => Self::Processing,
      "COMPLETED" => Self::Completed,
      "FAILED" => Self::Failed,
      other => Self::Unknown(other.to_string()),
    }
  }

  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Completed | Self::Failed)
  }
}

/// A single result image attached to a character.
#[derive(Debug, Clone)]
pub struct CharacterResultImage {
  pub url: String,
  pub image_type: Option<String>,
}

/// The status of one character.
#[derive(Debug, Clone)]
pub struct CharacterStatus {
  /// Internal numeric ID.
  pub id: u64,

  /// The character identifier (e.g. "char_1774752056469_2wlxoq").
  pub character_id: String,

  /// The name of the character.
  pub name: String,

  /// The description of the character.
  pub description: Option<String>,

  /// The avatar URL (typically the uploaded reference image).
  pub avatar_url: Option<String>,

  /// Result images generated during character creation.
  pub result_images: Vec<CharacterResultImage>,

  /// The task status.
  pub task_status: CharacterTaskStatus,

  /// If the task failed, the reason.
  pub fail_reason: Option<String>,

  /// The asset ID, present when the character is completed.
  pub asset_id: Option<String>,

  /// The asset status (e.g. "Active"), present when the character is completed.
  pub asset_status: Option<String>,

  /// ISO 8601 timestamp of creation.
  pub created_at: String,
}

// --- Implementation ---

pub async fn poll_characters(args: PollCharactersArgs<'_>) -> Result<PollCharactersResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();

  // The query param is URL-encoded JSON: {"0":{"json":{"limit":50}}}
  let input = format!(
    r#"{{"0":{{"json":{{"limit":{}}}}}}}"#,
    args.limit
  );

  let encoded_input: String = url::form_urlencoded::byte_serialize(input.as_bytes()).collect();

  let url = format!(
    "{}/api/trpc/character.getCharacters?batch=1&input={}",
    base_url,
    encoded_input,
  );

  info!("Polling characters (limit={})...", args.limit);

  let cookie = args.session.cookies.as_str();
  let referer = format!("{}/app/characters", base_url);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.get(&url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Poll characters response: status={}", status);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let data = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  let characters: Vec<CharacterStatus> = data.items.into_iter().map(|item| {
    let result_images = item.result_images
      .unwrap_or_default()
      .into_iter()
      .map(|img| CharacterResultImage {
        url: img.url,
        image_type: img.image_type,
      })
      .collect();

    CharacterStatus {
      id: item.id,
      character_id: item.character_id,
      name: item.name,
      description: item.description,
      avatar_url: item.avatar_url,
      result_images,
      task_status: CharacterTaskStatus::from_str(&item.task_status),
      fail_reason: item.fail_reason,
      asset_id: item.asset_id,
      asset_status: item.asset_status,
      created_at: item.created_at,
    }
  }).collect();

  info!("Polled {} character(s)", characters.len());

  Ok(PollCharactersResponse { characters })
}
