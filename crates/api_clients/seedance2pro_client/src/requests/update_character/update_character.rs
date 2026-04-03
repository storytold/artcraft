use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::update_character::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Public args ---

pub struct UpdateCharacterArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// The Kinovi character ID (e.g. "char_1775184656440_vsy3eu").
  pub character_id: String,

  /// The new name for the character.
  pub name: String,

  /// The new description (empty string clears it).
  pub description: String,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

// --- Public response ---

#[derive(Debug)]
pub struct UpdateCharacterResponse {
  pub success: bool,
}

// --- Implementation ---

pub async fn update_character(args: UpdateCharacterArgs<'_>) -> Result<UpdateCharacterResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let url = format!("{}/api/trpc/character.updateCharacter?batch=1", base_url);

  info!("Updating character '{}' (name='{}', description='{}')", args.character_id, args.name, args.description);

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        character_id: args.character_id.clone(),
        name: args.name,
        description: args.description,
      },
    },
  };

  let cookie = args.session.cookies.as_str();
  let referer = format!("{}/app/characters", base_url);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.post(&url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", base_url)
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Update character response: status={}, body={}", status, response_body);

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

  Ok(UpdateCharacterResponse {
    success: data.success,
  })
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

  // Steampunk Clown character
  const TEST_CHARACTER_ID: &str = "char_1775176566518_sik0te";

  #[tokio::test]
  #[ignore] // manually test — requires real cookies, modifies real data
  async fn test_rename_character() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    let result = update_character(UpdateCharacterArgs {
      session: &session,
      character_id: TEST_CHARACTER_ID.to_string(),
      name: "Steampunk Clown (renamed)".to_string(),
      description: "A steampunk clown character for testing".to_string(),
      host_override: None,
    }).await?;

    println!("Success: {}", result.success);
    assert!(result.success);
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies, modifies real data
  async fn test_rename_character_clear_description() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    let result = update_character(UpdateCharacterArgs {
      session: &session,
      character_id: TEST_CHARACTER_ID.to_string(),
      name: "Steampunk Clown".to_string(),
      description: "".to_string(),
      host_override: None,
    }).await?;

    println!("Success: {}", result.success);
    assert!(result.success);
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies, modifies real data
  async fn test_rename_and_restore() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    // Rename
    let result = update_character(UpdateCharacterArgs {
      session: &session,
      character_id: TEST_CHARACTER_ID.to_string(),
      name: "Temporary Name".to_string(),
      description: "Temporary description".to_string(),
      host_override: None,
    }).await?;
    assert!(result.success);

    // Restore
    let result = update_character(UpdateCharacterArgs {
      session: &session,
      character_id: TEST_CHARACTER_ID.to_string(),
      name: "Steampunk Clown".to_string(),
      description: "A steampunk clown".to_string(),
      host_override: None,
    }).await?;
    assert!(result.success);

    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
