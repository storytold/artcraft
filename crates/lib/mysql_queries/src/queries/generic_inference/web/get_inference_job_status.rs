use anyhow::anyhow;
use chrono::{DateTime, NaiveDateTime, TimeZone, Utc};
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, PolymorphicInferenceArgs};
use crate::queries::generic_inference::web::job_status::{GenericInferenceJobStatus, RequestDetails, ResultDetails, UserDetails};

/// Look up job status.
/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_status(job_token: &InferenceJobToken, mysql_pool: &MySqlPool)
  -> AnyhowResult<Option<GenericInferenceJobStatus>>
{
  let mut connection = mysql_pool.acquire().await?;
  get_inference_job_status_from_connection(job_token, &mut connection).await
}


/// Look up job status.
/// Returns Ok(None) when the record cannot be found.
pub async fn get_inference_job_status_from_connection(job_token: &InferenceJobToken, mysql_connection: &mut PoolConnection<MySql>)
  -> AnyhowResult<Option<GenericInferenceJobStatus>>
{
  // NB(bt): jobs.uuid_idempotency_token is the current way to reconstruct the hash of the
  // TTS result since we don't store a bucket hash on the table. This is an ugly hack :(
  // TODO(bt,2023-10-12): ^^^ Is this comment still accurate? I don't see that field referenced below.

  let maybe_status = sqlx::query_as!(
      RawGenericInferenceJobStatus,
        r#"
SELECT
    jobs.token as `job_token: tokens::tokens::generic_inference_jobs::InferenceJobToken`,

    jobs.status as `status: enums::common::job_status_plus::JobStatusPlus`,
    jobs.attempt_count,

    jobs.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    jobs.maybe_creator_anonymous_visitor_token as `maybe_creator_anonymous_visitor_token: tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken`,
    jobs.creator_ip_address,

    jobs.product_category as `product_category: enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory`,
    jobs.inference_category as `inference_category: enums::by_table::generic_inference_jobs::inference_category::InferenceCategory`,
    jobs.maybe_model_type,
    jobs.maybe_model_token,
    jobs.maybe_raw_inference_text,
    jobs.maybe_inference_args,

    jobs.frontend_failure_category as `maybe_frontend_failure_category: enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory`,

    jobs.on_success_result_entity_type as maybe_result_entity_type,
    jobs.on_success_result_entity_token as maybe_result_entity_token,

    model_weights.title as maybe_model_weights_title,
    tts_models.title as maybe_tts_model_title,
    voice_conversion_models.title as maybe_voice_conversion_model_title,

    tts_results.public_bucket_wav_audio_path as maybe_tts_public_bucket_path,
    voice_conversion_results.public_bucket_hash as maybe_voice_conversion_public_bucket_hash,

    media_files.public_bucket_directory_hash as maybe_media_file_public_bucket_directory_hash,
    media_files.maybe_public_bucket_prefix as maybe_media_file_public_bucket_prefix,
    media_files.maybe_public_bucket_extension as maybe_media_file_public_bucket_extension,

    jobs.assigned_worker as maybe_assigned_worker,
    jobs.assigned_cluster as maybe_assigned_cluster,

    jobs.is_keepalive_required,

    jobs.created_at,
    jobs.updated_at,

    jobs.first_started_at as maybe_first_started_at,
    jobs.successfully_completed_at as maybe_successfully_completed_at,

    NOW() as database_clock

FROM generic_inference_jobs as jobs

LEFT OUTER JOIN model_weights ON jobs.maybe_model_token = model_weights.token
LEFT OUTER JOIN tts_models ON jobs.maybe_model_token = tts_models.token
LEFT OUTER JOIN voice_conversion_models ON jobs.maybe_model_token = voice_conversion_models.token

LEFT OUTER JOIN tts_results ON jobs.on_success_result_entity_token = tts_results.token
LEFT OUTER JOIN voice_conversion_results ON jobs.on_success_result_entity_token = voice_conversion_results.token
LEFT OUTER JOIN media_files ON jobs.on_success_result_entity_token = media_files.token

WHERE jobs.token = ?
        "#,
      job_token
    )
      .fetch_one(&mut **mysql_connection)
      .await;

  let record = match maybe_status {
    Ok(record) => record,
    Err(err) => match err {
      sqlx::Error::RowNotFound => return Ok(None),
      _ => {
        warn!("error querying job record: {:?}", err);
        return Err(anyhow!("error querying job record: {:?}", err));
      }
    }
  };

  Ok(Some(raw_record_to_public_result(record)))
}

/// Map the internal record type (since we query over several result tables)
fn raw_record_to_public_result(record: RawGenericInferenceJobStatus) -> GenericInferenceJobStatus {
  let maybe_args = record.maybe_inference_args
      .as_deref()
      .map(|args| GenericInferenceArgs::from_json(args))
      .transpose()
      .ok() // NB: Fail open in this case.
      .flatten()
      .map(|generic_args| generic_args.args)
      .flatten();

  let mut maybe_style_name = None;

  match maybe_args {
    Some(PolymorphicInferenceArgs::Cu(workflow_args)) => {
      maybe_style_name = workflow_args.style_name;
    }
    _ => {}
  }

  let mut maybe_model_title = None;

  if let Some(title) = record.maybe_model_weights_title.as_deref() {
    maybe_model_title = Some(title);
  }

  if maybe_model_title.is_none() {
    maybe_model_title = match record.inference_category {
      InferenceCategory::LipsyncAnimation => Some("lipsync animation"),
      InferenceCategory::TextToSpeech => record.maybe_tts_model_title.as_deref(),
      InferenceCategory::VoiceConversion => record.maybe_voice_conversion_model_title.as_deref(),
      InferenceCategory::VideoFilter => Some("Video Filter"),
      InferenceCategory::ImageGeneration => Some("Image Generation"),
      InferenceCategory::Mocap => Some("Mocap"),
      InferenceCategory::Workflow => Some("Workflow"),
      InferenceCategory::FormatConversion => Some("format conversion"),
      InferenceCategory::LivePortrait => Some("Live Portrait"),
      InferenceCategory::F5TTS => Some("F5 TTS"),
      InferenceCategory::ConvertBvhToWorkflow => Some("BVH to Workflow"),
      InferenceCategory::DeprecatedField => Some("Job"), // TODO(bt,2024-07-16): Fix
    };
  }

  // NB: A bit of a hack. We store TTS results with a full path.
  // Going forward, all other record types will store a hash.
  let (mut bucket_path_is_hash, mut maybe_public_bucket_hash) = match record.inference_category {
    InferenceCategory::LipsyncAnimation => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::TextToSpeech => (false, record.maybe_tts_public_bucket_path.as_deref()),
    InferenceCategory::F5TTS => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::VoiceConversion => (true, record.maybe_voice_conversion_public_bucket_hash.as_deref()),
    InferenceCategory::VideoFilter => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::ImageGeneration => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::Mocap => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::Workflow => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::FormatConversion => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::LivePortrait => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::ConvertBvhToWorkflow => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
    InferenceCategory::DeprecatedField => (true, None), // TODO(bt,2024-07-16): We'll need to read another field!
  };

  // NB: We've moved voice conversion out of their own table and into media_files
  // This check should allow for graceful migration to the new end-state.
  match record.maybe_result_entity_type.as_deref() {
    Some("media_file") => {
      bucket_path_is_hash = true;
      maybe_public_bucket_hash = record.maybe_media_file_public_bucket_directory_hash.as_deref();
    }
    _ => {}
  }

  let maybe_result_details = record
      .maybe_result_entity_type
      .as_deref()
      .and_then(|entity_type| {
        record.maybe_result_entity_token
            .as_deref()
            .and_then(|entity_token| {
              maybe_public_bucket_hash.map(|public_bucket_hash| {
                ResultDetails {
                  entity_type: entity_type.to_string(),
                  entity_token: entity_token.to_string(),
                  public_bucket_location_or_hash: public_bucket_hash.to_string(),
                  maybe_media_file_public_bucket_prefix: record.maybe_media_file_public_bucket_prefix.clone(),
                  maybe_media_file_public_bucket_extension: record.maybe_media_file_public_bucket_extension.clone(),
                  public_bucket_location_is_hash: bucket_path_is_hash,
                  maybe_successfully_completed_at: record.maybe_successfully_completed_at,
                }
              })
            })
      });

  GenericInferenceJobStatus {
    job_token: record.job_token,
    status: record.status,
    attempt_count: record.attempt_count,
    maybe_assigned_worker: record.maybe_assigned_worker,
    maybe_assigned_cluster: record.maybe_assigned_cluster,
    maybe_first_started_at: record.maybe_first_started_at,
    maybe_frontend_failure_category: record.maybe_frontend_failure_category,
    request_details: RequestDetails {
      maybe_product_category: record.product_category,
      inference_category: record.inference_category,
      maybe_model_type: record.maybe_model_type,
      maybe_model_token: record.maybe_model_token,
      maybe_model_title: maybe_model_title.map(|title| title.to_string()),
      maybe_raw_inference_text: record.maybe_raw_inference_text,
      maybe_inference_args: record.maybe_inference_args,
      maybe_style_name,
    },
    maybe_result_details,
    user_details: UserDetails {
      maybe_creator_user_token: record.maybe_creator_user_token,
      maybe_creator_anonymous_visitor_token: record.maybe_creator_anonymous_visitor_token,
      creator_ip_address: record.creator_ip_address,
    },
    is_keepalive_required: i8_to_bool(record.is_keepalive_required),
    created_at: record.created_at,
    updated_at: record.updated_at,
    database_clock: DateTime::from_naive_utc_and_offset(record.database_clock, Utc),
  }
}

#[derive(Debug, Default)]
struct RawGenericInferenceJobStatus {
  pub job_token: InferenceJobToken,

  pub status: JobStatusPlus,
  pub attempt_count: u16,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  pub creator_ip_address: String,

  pub product_category: Option<InferenceJobProductCategory>,
  pub inference_category: InferenceCategory,
  pub maybe_model_type: Option<String>,
  pub maybe_model_token: Option<String>,
  pub maybe_raw_inference_text: Option<String>,
  pub maybe_inference_args: Option<String>,

  pub maybe_result_entity_type: Option<String>,
  pub maybe_result_entity_token: Option<String>,

  pub maybe_model_weights_title: Option<String>,
  pub maybe_tts_model_title: Option<String>,
  pub maybe_voice_conversion_model_title: Option<String>,

  pub maybe_voice_conversion_public_bucket_hash: Option<String>, // NB: This is the bucket hash.
  pub maybe_tts_public_bucket_path: Option<String>, // NB: This isn't the bucket path, but the whole hash.
  pub maybe_media_file_public_bucket_directory_hash: Option<String>, // NB: This is the bucket directory hash
  pub maybe_media_file_public_bucket_prefix: Option<String>,
  pub maybe_media_file_public_bucket_extension: Option<String>,

  pub maybe_assigned_worker: Option<String>,
  pub maybe_assigned_cluster: Option<String>,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,

  pub is_keepalive_required: i8,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_first_started_at: Option<DateTime<Utc>>,
  pub maybe_successfully_completed_at: Option<DateTime<Utc>>,

  // NB: Typed query can't convert to Utc, so we use NaiveDateTime and do the type conversion ourselves.
  // The database server *should* be reporting in UTC.
  pub database_clock: NaiveDateTime,
}

#[cfg(test)]
mod tests {
  use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;

  use crate::queries::generic_inference::web::get_inference_job_status::{raw_record_to_public_result, RawGenericInferenceJobStatus};

  #[test]
  fn text_to_speech_as_media_file() {
    // NB(bt,2023-12-06): After tts migration to media files, these are the results the job system will return
    let record = RawGenericInferenceJobStatus {
      inference_category:  InferenceCategory::TextToSpeech,
      maybe_result_entity_type: Some("media_file".to_string()), // NB: Media file record
      maybe_result_entity_token: Some("m_00af018cy75pxytpb8wbdx9jqgtp0p".to_string()),
      maybe_media_file_public_bucket_directory_hash: Some("3vb91yq71z5zne56saazn4qntt52yter".to_string()), // NB: Media file
      maybe_media_file_public_bucket_prefix: Some("fakeyou_".to_string()),
      maybe_media_file_public_bucket_extension: Some(".wav".to_string()),
      maybe_tts_public_bucket_path: None, // NB: Not a tts_result!
      ..Default::default()
    };

    let record = raw_record_to_public_result(record);

    assert!(record.maybe_result_details.is_some());

    let result_details = record.maybe_result_details.expect("should have result details");

    assert_eq!(&result_details.entity_type, "media_file");
    assert_eq!(&result_details.entity_token, "m_00af018cy75pxytpb8wbdx9jqgtp0p");
    assert_eq!(&result_details.public_bucket_location_or_hash, "3vb91yq71z5zne56saazn4qntt52yter");
    assert_eq!(result_details.public_bucket_location_is_hash, true);
  }

  #[test]
  fn text_to_speech_as_tts_result() {
    // NB(bt,2023-12-06): Prior to tts migration to media files, these are the results the job system will return
    let record = RawGenericInferenceJobStatus {
      inference_category:  InferenceCategory::TextToSpeech,
      maybe_result_entity_type: Some("text_to_speech".to_string()), // NB: TTS record
      maybe_result_entity_token: Some("TR:wefhbk4j3yc8d6zwembedbdw4ad4s".to_string()),
      maybe_tts_public_bucket_path: Some("/tts_inference_output/c/5/8/vocodes_c58aeaef-84df-4478-9e7f-c64280a852e8.wav".to_string()), // NB: tts_result!
      maybe_media_file_public_bucket_directory_hash: None, // NB: Not a media file!
      maybe_media_file_public_bucket_prefix: None,
      maybe_media_file_public_bucket_extension: None,
      ..Default::default()
    };

    let record = raw_record_to_public_result(record);

    assert!(record.maybe_result_details.is_some());

    let result_details = record.maybe_result_details.expect("should have result details");

    assert_eq!(&result_details.entity_type, "text_to_speech");
    assert_eq!(&result_details.entity_token, "TR:wefhbk4j3yc8d6zwembedbdw4ad4s");
    assert_eq!(&result_details.public_bucket_location_or_hash, "/tts_inference_output/c/5/8/vocodes_c58aeaef-84df-4478-9e7f-c64280a852e8.wav");
    assert_eq!(result_details.public_bucket_location_is_hash, false);
  }
}
