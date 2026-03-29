use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::generate_character::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Public args ---

pub struct GenerateCharacterArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// The name for this character.
  pub name: String,

  /// A description of the character.
  pub description: String,

  /// URL of the uploaded reference image (from `upload_file`).
  /// NB: The Kinovi API accepts multiple images, but the UI only supports one for now.
  /// We may expand this to Vec<String> in the future.
  pub reference_image_url: String,

  /// Whether the character should be publicly visible.
  pub is_public: bool,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

// --- Public response ---

#[derive(Debug)]
pub struct GenerateCharacterResponse {
  /// Internal numeric ID.
  pub id: u64,

  /// The character identifier (e.g. "char_1774752056469_2wlxoq").
  pub character_id: String,

  /// The name that was assigned.
  pub name: String,

  /// ISO 8601 timestamp of creation.
  pub created_at: String,
}

// --- Implementation ---

pub async fn generate_character(args: GenerateCharacterArgs<'_>) -> Result<GenerateCharacterResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let url = format!("{}/api/trpc/character.createCharacter?batch=1", base_url);

  info!("Creating character '{}'", args.name);

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        name: args.name,
        description: args.description,
        reference_image_urls: vec![args.reference_image_url],
        mode: "upload",
        is_public: args.is_public,
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

  info!("Create character response: status={}, body={}", status, response_body);

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

  Ok(GenerateCharacterResponse {
    id: data.id,
    character_id: data.character_id,
    name: data.name,
    created_at: data.created_at,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  async fn upload_image_from_url(session: &Seedance2ProSession, image_url: &str, extension: &str) -> AnyhowResult<String> {
    let image_bytes = crate::test_utils::http_download::http_download_to_bytes(image_url).await?;

    let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
      session,
      extension: extension.to_string(),
      host_override: None,
    }).await?;

    let upload_result = upload_file(UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes: image_bytes,
      host_override: None,
    }).await?;

    Ok(upload_result.public_url)
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_create_character_juno() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    let public_url = upload_image_from_url(
      &session,
      test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
      "jpg",
    ).await?;

    println!("Uploaded image: {}", public_url);

    let result = generate_character(GenerateCharacterArgs {
      session: &session,
      name: "Juno".to_string(),
      description: "Juno the shiba inu at the lake".to_string(),
      reference_image_url: public_url,
      is_public: false,
      host_override: None,
    }).await?;

    println!("Character ID: {}", result.character_id);
    println!("Name: {}", result.name);
    println!("Created at: {}", result.created_at);
    assert!(!result.character_id.is_empty());
    assert_eq!(result.name, "Juno");
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_create_character_ernest() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;

    let public_url = upload_image_from_url(
      &session,
      test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL,
      "jpg",
    ).await?;

    println!("Uploaded image: {}", public_url);

    let result = generate_character(GenerateCharacterArgs {
      session: &session,
      name: "Ernest".to_string(),
      description: "Ernest".to_string(),
      reference_image_url: public_url,
      is_public: false,
      host_override: None,
    }).await?;

    println!("Character ID: {}", result.character_id);
    println!("Name: {}", result.name);
    println!("Created at: {}", result.created_at);
    assert!(!result.character_id.is_empty());
    assert_eq!(result.name, "Ernest");
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
