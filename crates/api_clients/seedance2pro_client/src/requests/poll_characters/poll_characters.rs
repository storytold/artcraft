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

  /// Cursor from a previous `PollCharactersResponse::next_cursor`.
  /// When `None`, the most recent characters are returned.
  pub cursor: Option<u64>,

  /// Maximum number of characters to return per page. Defaults to 50.
  pub limit: Option<u32>,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

// --- Public response ---

pub struct PollCharactersResponse {
  pub characters: Vec<CharacterStatus>,

  /// Present when there are more characters to fetch.
  /// Pass this value as `PollCharactersArgs::cursor` in the next call.
  pub next_cursor: Option<u64>,
}

// --- Public types ---

/// Our resolved status for a character creation job.
///
/// This is NOT 1:1 with Kinovi's API. A character can have `taskStatus: "COMPLETED"`
/// but `assetStatus: "Failed"`, which we treat as `Failed` on our end.
#[derive(Debug, Clone, PartialEq)]
pub enum CharacterCreationStatus {
  /// The character was successfully created and the asset is active.
  Success,
  /// The character creation failed (either the task failed or the asset failed).
  Failed,
  /// The character is still being created (pending or processing).
  Pending,
}

impl CharacterCreationStatus {
  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Success | Self::Failed)
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

  /// Our resolved status (Success, Failed, or Pending).
  pub status: CharacterCreationStatus,

  /// If the task failed, the reason from the API.
  pub fail_reason: Option<String>,

  /// The asset ID, present when the character completed successfully.
  pub asset_id: Option<String>,

  /// Raw task status from the Kinovi API (for debugging).
  pub raw_task_status: String,

  /// Raw asset status from the Kinovi API (for debugging).
  pub raw_asset_status: Option<String>,

  /// ISO 8601 timestamp of creation.
  pub created_at: String,
}

// --- Implementation ---

pub async fn poll_characters(args: PollCharactersArgs<'_>) -> Result<PollCharactersResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();

  let limit = args.limit.unwrap_or(50);

  // The query param is URL-encoded JSON: {"0":{"json":{"limit":N}}} or {"0":{"json":{"limit":N,"cursor":C}}}
  let input = match args.cursor {
    Some(cursor) => format!(
      r#"{{"0":{{"json":{{"limit":{},"cursor":{}}}}}}}"#,
      limit, cursor
    ),
    None => format!(
      r#"{{"0":{{"json":{{"limit":{}}}}}}}"#,
      limit
    ),
  };

  let encoded_input: String = url::form_urlencoded::byte_serialize(input.as_bytes()).collect();

  let url = format!(
    "{}/api/trpc/character.getCharacters?batch=1&input={}",
    base_url,
    encoded_input,
  );

  info!("Polling characters (limit={}, cursor={:?})...", limit, args.cursor);

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

    // Derive our status from the raw Kinovi API fields.
    // Kinovi reports "COMPLETED" even when the character actually failed:
    //   - assetStatus "Failed" => the asset generation failed
    //   - assetStatus null (no assetId) => the task completed but produced no asset
    // Only taskStatus "COMPLETED" + assetStatus "Active" is a true success.
    let status = match item.task_status.as_str() {
      "FAILED" => CharacterCreationStatus::Failed,
      "COMPLETED" => match item.asset_status.as_deref() {
        Some("Active") => CharacterCreationStatus::Success,
        _ => CharacterCreationStatus::Failed, // "Failed", null, or any other value
      },
      _ => CharacterCreationStatus::Pending,
    };

    CharacterStatus {
      id: item.id,
      character_id: item.character_id,
      name: item.name,
      description: item.description,
      avatar_url: item.avatar_url,
      result_images,
      status,
      fail_reason: item.fail_reason,
      asset_id: item.asset_id,
      raw_task_status: item.task_status,
      raw_asset_status: item.asset_status,
      created_at: item.created_at,
    }
  }).collect();

  // Parse next_cursor: it's either a JSON number or null.
  let next_cursor = data.next_cursor
    .and_then(|v| v.as_u64());

  info!("Polled {} character(s), next_cursor={:?}", characters.len(), next_cursor);

  Ok(PollCharactersResponse { characters, next_cursor })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_characters() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let result = poll_characters(PollCharactersArgs {
      session: &session,
      limit: None,
      cursor: None,
      host_override: None,
    }).await?;

    println!("Characters returned: {}", result.characters.len());
    println!("Next cursor: {:?}", result.next_cursor);
    for ch in &result.characters {
      println!(
        "  {} | {} | {:?} | asset_id={:?} | avatar={:?}",
        ch.character_id, ch.name, ch.status, ch.asset_id, ch.avatar_url,
      );
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_characters_small_limit() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let result = poll_characters(PollCharactersArgs {
      session: &session,
      limit: Some(2),
      cursor: None,
      host_override: None,
    }).await?;

    println!("Characters returned (limit=2): {}", result.characters.len());
    println!("Next cursor: {:?}", result.next_cursor);
    for ch in &result.characters {
      println!(
        "  {} | {} | {:?} | asset_id={:?}",
        ch.character_id, ch.name, ch.status, ch.asset_id,
      );
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; exhausts all pages
  async fn test_poll_all_pages() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    let mut cursor: Option<u64> = None;
    let mut page = 0usize;
    let mut total_characters = 0usize;

    loop {
      page += 1;
      let result = poll_characters(PollCharactersArgs {
        session: &session,
        limit: Some(2),
        cursor,
        host_override: None,
      }).await?;

      let page_count = result.characters.len();
      total_characters += page_count;

      println!("Page {}: {} characters, next_cursor: {:?}", page, page_count, result.next_cursor);
      for ch in &result.characters {
        println!("  {} | {} | {:?} | asset_id={:?}", ch.character_id, ch.name, ch.status, ch.asset_id);
      }

      cursor = result.next_cursor;
      if cursor.is_none() {
        break;
      }
    }

    println!("Total characters across {} pages: {}", page, total_characters);
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies; logs all character details
  async fn test_poll_all_characters_verbose() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let result = poll_characters(PollCharactersArgs {
      session: &session,
      limit: None,
      cursor: None,
      host_override: None,
    }).await?;

    println!("=== All Characters ({} total) ===", result.characters.len());
    for ch in &result.characters {
      println!("Character: {} ({})", ch.name, ch.character_id);
      println!("  Description: {:?}", ch.description);
      println!("  Status: {:?}", ch.status);
      println!("  Avatar URL: {:?}", ch.avatar_url);
      println!("  Asset ID: {:?}", ch.asset_id);
      println!("  Raw Task Status: {}", ch.raw_task_status);
      println!("  Raw Asset Status: {:?}", ch.raw_asset_status);
      println!("  Fail Reason: {:?}", ch.fail_reason);
      println!("  Created At: {}", ch.created_at);
      println!("  Result Images:");
      for img in &ch.result_images {
        println!("    {} (type={:?})", img.url, img.image_type);
      }
      println!();
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
