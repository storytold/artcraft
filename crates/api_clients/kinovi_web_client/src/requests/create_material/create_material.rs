use serde_derive::{Deserialize, Serialize};

use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_client_error::KinoviWebClientError;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::error::kinovi_web_generic_api_error::KinoviWebGenericApiError;
use crate::requests::create_material::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Request args ---

/// Register an uploaded file as a Kinovi "material" (`material.createMaterial`).
///
/// The site calls this once per uploaded reference file, after the signed-URL
/// PUT (see `prepare_file_upload` / `upload_file`) and before the file's URL
/// is used in `workflow.runTask`. The response includes a `material_id` and a
/// content-moderation `detect_status`, but NONE of that state is carried into
/// the generate request — `workflow.runTask` references materials purely by
/// their CDN URL. Registration appears to exist so Kinovi's backend can run
/// content detection on the file; an unregistered URL is presumed to be why
/// video-reference generations stall or fail.
pub struct CreateMaterialArgs<'a> {
  pub request: CreateMaterialRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// --- Request ---

#[derive(Clone, Debug)]
pub struct CreateMaterialRequest {
  /// The public CDN URL of the uploaded file, as returned by `upload_file`
  /// (e.g. `https://static.seedance2-pro.com/materials/20260801/...mp4`).
  pub url: String,

  pub format: KinoviMaterialFormat,

  /// Pixel width of the video or image.
  pub width: u32,

  /// Pixel height of the video or image.
  pub height: u32,

  /// Duration in whole seconds. Required for videos; must be None for
  /// photos (the site sends `duration: null` annotated as `undefined`).
  pub maybe_duration_seconds: Option<u64>,

  /// File size in bytes.
  pub size_bytes: u64,
}

/// The material type. Only videos and photos have been observed on the wire;
/// audio uploads have not been captured going through `createMaterial`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KinoviMaterialFormat {
  /// `"video"`
  Video,
  /// `"photo"`
  Photo,
}

impl KinoviMaterialFormat {
  pub fn as_api_str(&self) -> &'static str {
    match self {
      Self::Video => "video",
      Self::Photo => "photo",
    }
  }
}

// --- Response ---

pub struct CreateMaterialResponse {
  pub material: KinoviMaterial,
}

/// A material record as returned by `material.createMaterial`.
///
/// Most fields are nullable server-side; everything nonessential is optional
/// and defaulted so new/omitted fields never break parsing.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KinoviMaterial {
  /// Numeric row id (e.g. 83483).
  pub id: u64,

  /// Owning user id (e.g. "cmlrbvj2a000buo91m14ejhw0").
  pub user_id: String,

  /// Material token (e.g. "mat_v1k48s02um7vow9q0rx38jlc").
  pub material_id: String,

  /// The public CDN URL the material was registered under.
  pub url: String,

  /// "video" or "photo".
  pub format: String,

  /// File size in bytes.
  pub size: u64,

  pub width: u32,

  pub height: u32,

  /// Duration in seconds (videos only).
  #[serde(default)]
  pub duration: Option<f64>,

  /// Content-moderation status. Videos start as `Processing`; photos have
  /// been observed returning `Succeeded` immediately.
  pub detect_status: KinoviMaterialDetectStatus,

  #[serde(default)]
  pub name: Option<String>,

  #[serde(default)]
  pub frame_rate: Option<f64>,

  #[serde(default)]
  pub detect_task_id: Option<String>,

  #[serde(default)]
  pub poster: Option<String>,

  #[serde(default)]
  pub detect_url: Option<String>,

  #[serde(default)]
  pub detect_info: Option<serde_json::Value>,

  /// Unix-millis string (superjson bigint), e.g. "1785592620587".
  #[serde(default)]
  pub detect_start_at: Option<String>,

  #[serde(default)]
  pub detect_finish_at: Option<serde_json::Value>,

  #[serde(default)]
  pub detect_finish_from: Option<i64>,

  #[serde(default)]
  pub used_times: Option<u64>,

  #[serde(default)]
  pub user_agent: Option<String>,

  /// Perceptual thumbnail hash — a byte array for photos, null for videos.
  #[serde(default)]
  pub thumb_hash: Option<serde_json::Value>,

  #[serde(default)]
  pub status: Option<i64>,

  #[serde(default)]
  pub preview_image_url: Option<String>,

  #[serde(default)]
  pub expire_del_at: Option<serde_json::Value>,

  #[serde(default)]
  pub created_at: Option<String>,

  #[serde(default)]
  pub updated_at: Option<String>,

  #[serde(default)]
  pub remove_status: Option<i64>,

  #[serde(default)]
  pub remove_at: Option<serde_json::Value>,

  #[serde(default)]
  pub feature_type: Option<i64>,

  #[serde(default)]
  pub mux_playback_id: Option<String>,

  #[serde(default)]
  pub mux_stream_url: Option<String>,

  #[serde(default)]
  pub mux_thumbnail_url: Option<String>,
}

/// Content-moderation status of a material.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum KinoviMaterialDetectStatus {
  Processing,
  Succeeded,
  Failed,
  /// Forward-compatibility catch-all for statuses we haven't observed.
  #[serde(other)]
  Unknown,
}

// --- Implementation ---

pub async fn create_material(args: CreateMaterialArgs<'_>) -> Result<CreateMaterialResponse, KinoviWebError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let create_material_url = format!("{}/api/trpc/material.createMaterial?batch=1", base_url);

  info!("Creating material: {:?}", args.request);

  let request_body = build_batch_request(args.request);

  let cookie = args.session.cookies.as_str();
  let referer = format!("{}/", base_url);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| KinoviWebClientError::WreqClientError(err))?;

  let response = client.post(&create_material_url)
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
    .json(&request_body)
    .send()
    .await
    .map_err(|err| KinoviWebGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| KinoviWebGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(KinoviWebGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| KinoviWebGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let material = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| KinoviWebGenericApiError::UnexpectedResponseShape {
      explanation: "Empty batch response array".to_string(),
      raw_body: response_body.clone(),
    })?
    .result
    .data
    .json;

  Ok(CreateMaterialResponse { material })
}

/// Build the tRPC request body. Videos send an integer `duration` and no
/// `meta` block; photos send `duration: null` with a superjson `meta` block
/// marking the field as `undefined` (mirroring the site's requests exactly).
fn build_batch_request(req: CreateMaterialRequest) -> BatchRequest {
  let meta = match req.format {
    KinoviMaterialFormat::Photo => Some(MaterialMeta {
      values: MaterialMetaValues { duration: ["undefined"] },
      v: 1,
    }),
    KinoviMaterialFormat::Video => None,
  };

  BatchRequest {
    zero: BatchRequestInner {
      json: MaterialJson {
        url: req.url,
        format: req.format.as_api_str(),
        width: req.width,
        height: req.height,
        duration: req.maybe_duration_seconds,
        size: req.size_bytes,
      },
      meta,
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::kinovi_web_session::KinoviWebSession;
  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  // ── Request serialization ──
  //
  // Mirrors the captured requests in
  // external/requests/sites/kinovi.ai/2026-08-01-seedance2p5-fixes/
  // (4_upload_material.txt and 11_create_image_material.txt).

  mod request_serialization_tests {
    use super::*;

    #[test]
    fn video_request_matches_observed_wire_format() {
      let body = build_batch_request(CreateMaterialRequest {
        url: "https://static.seedance2-pro.com/materials/20260801/1785592619812-7add4749.mp4".to_string(),
        format: KinoviMaterialFormat::Video,
        width: 1280,
        height: 720,
        maybe_duration_seconds: Some(8),
        size_bytes: 4773897,
      });
      let json = serde_json::to_string(&body).unwrap();
      assert_eq!(
        json,
        r#"{"0":{"json":{"url":"https://static.seedance2-pro.com/materials/20260801/1785592619812-7add4749.mp4","format":"video","width":1280,"height":720,"duration":8,"size":4773897}}}"#,
      );
    }

    #[test]
    fn photo_request_matches_observed_wire_format() {
      let body = build_batch_request(CreateMaterialRequest {
        url: "https://static.seedance2-pro.com/materials/20260801/1785593115274-52bcb691.png".to_string(),
        format: KinoviMaterialFormat::Photo,
        width: 1024,
        height: 1024,
        maybe_duration_seconds: None,
        size_bytes: 2158735,
      });
      let json = serde_json::to_string(&body).unwrap();
      assert_eq!(
        json,
        r#"{"0":{"json":{"url":"https://static.seedance2-pro.com/materials/20260801/1785593115274-52bcb691.png","format":"photo","width":1024,"height":1024,"duration":null,"size":2158735},"meta":{"values":{"duration":["undefined"]},"v":1}}}"#,
      );
    }

    #[test]
    fn format_api_strings() {
      assert_eq!(KinoviMaterialFormat::Video.as_api_str(), "video");
      assert_eq!(KinoviMaterialFormat::Photo.as_api_str(), "photo");
    }
  }

  // ── Response parsing ──

  mod response_parsing_tests {
    use super::*;

    #[test]
    fn parses_real_video_material_response() {
      let body = read_response_body("create_material_video.json");
      let batch: Vec<BatchResponseItem> = serde_json::from_str(&body).unwrap();
      let material = batch.into_iter().next().unwrap().result.data.json;

      assert_eq!(material.id, 83483);
      assert_eq!(material.material_id, "mat_v1k48s02um7vow9q0rx38jlc");
      assert_eq!(material.user_id, "cmlrbvj2a000buo91m14ejhw0");
      assert_eq!(material.url, "https://static.seedance2-pro.com/materials/20260801/1785592619812-7add4749.mp4");
      assert_eq!(material.format, "video");
      assert_eq!(material.size, 4773897);
      assert_eq!(material.width, 1280);
      assert_eq!(material.height, 720);
      assert_eq!(material.duration, Some(8.0));
      assert_eq!(material.detect_status, KinoviMaterialDetectStatus::Processing);
      assert_eq!(material.detect_start_at.as_deref(), Some("1785592620587"));
      assert!(material.thumb_hash.is_none());
    }

    #[test]
    fn parses_real_photo_material_response() {
      let body = read_response_body("create_material_photo.json");
      let batch: Vec<BatchResponseItem> = serde_json::from_str(&body).unwrap();
      let material = batch.into_iter().next().unwrap().result.data.json;

      assert_eq!(material.id, 83519);
      assert_eq!(material.material_id, "mat_iqs01mlyw5f2ph8g2dk55k1s");
      assert_eq!(material.format, "photo");
      assert_eq!(material.width, 1024);
      assert_eq!(material.height, 1024);
      assert_eq!(material.duration, None);
      assert_eq!(material.detect_status, KinoviMaterialDetectStatus::Succeeded);
      // Photos carry a thumb hash byte array.
      assert!(material.thumb_hash.as_ref().is_some_and(|v| v.is_array()));
    }
  }

  // ── Detect-status deserialization ──

  mod detect_status_tests {
    use super::*;

    #[test]
    fn known_statuses_deserialize() {
      assert_eq!(
        serde_json::from_str::<KinoviMaterialDetectStatus>(r#""PROCESSING""#).unwrap(),
        KinoviMaterialDetectStatus::Processing,
      );
      assert_eq!(
        serde_json::from_str::<KinoviMaterialDetectStatus>(r#""SUCCEEDED""#).unwrap(),
        KinoviMaterialDetectStatus::Succeeded,
      );
      assert_eq!(
        serde_json::from_str::<KinoviMaterialDetectStatus>(r#""FAILED""#).unwrap(),
        KinoviMaterialDetectStatus::Failed,
      );
    }

    #[test]
    fn unknown_status_falls_back_to_unknown() {
      assert_eq!(
        serde_json::from_str::<KinoviMaterialDetectStatus>(r#""SOME_NEW_STATUS""#).unwrap(),
        KinoviMaterialDetectStatus::Unknown,
      );
    }
  }

  // ── Live tests ──

  mod real_requests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_upload_and_create_image_material() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
        test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
      ).await?;
      let size_bytes = image_bytes.len() as u64;

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session: &session,
        extension: "jpg".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: image_bytes,
        host_override: None,
      }).await?;
      println!("Uploaded: {}", upload_result.public_url);

      let result = create_material(CreateMaterialArgs {
        session: &session,
        host_override: None,
        request: CreateMaterialRequest {
          url: upload_result.public_url,
          format: KinoviMaterialFormat::Photo,
          width: 1365,
          height: 2048,
          maybe_duration_seconds: None,
          size_bytes,
        },
      }).await?;

      println!("Material: {:#?}", result.material);
      assert!(result.material.material_id.starts_with("mat_"));
      assert_eq!(result.material.format, "photo");
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }
  }

  // ── Helpers ──

  fn read_response_body(filename: &str) -> String {
    std::fs::read_to_string(format!("test_data/responses/{}", filename))
      .expect("Failed to read test data file")
  }
}
