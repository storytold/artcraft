use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::traits::mysql_from_row::MySqlFromRow;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::users::UserToken;
use tokens::traits::mysql_token_from_row::MySqlTokenFromRow;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::generic_inference_args::generic_inference_args::{GenericInferenceArgs, PolymorphicInferenceArgs};
use crate::queries::generic_inference::web::job_status::{GenericInferenceJobStatus, RequestDetails, ResultDetails, UserDetails};

/// Look up job status.
/// Returns Ok(Vec::new()) when the records cannot be found.
pub async fn batch_get_inference_job_status(job_tokens: &[InferenceJobToken], mysql_pool: &MySqlPool)
  -> AnyhowResult<Vec<GenericInferenceJobStatus>>
{
  if job_tokens.is_empty() {
    // NB: We should always eagerly return, but if we don't, the query builder will build an
    // invalid query.
    return Ok(Vec::new());
  }

  let mut connection = mysql_pool.acquire().await?;
  batch_get_inference_job_status_from_connection(job_tokens, &mut connection).await
}


/// Look up job status.
/// Returns Ok(Vec::new()) when the records cannot be found.
pub async fn batch_get_inference_job_status_from_connection(
  job_tokens: &[InferenceJobToken],
  mysql_connection: &mut PoolConnection<MySql>
)
  -> AnyhowResult<Vec<GenericInferenceJobStatus>>
{
  if job_tokens.is_empty() {
    // NB: We should always eagerly return, but if we don't, the query builder will build an
    // invalid query.
    return Ok(Vec::new());
  }

  let mut query_builder: QueryBuilder<MySql> = make_query_builder();

  query_builder.push(" WHERE jobs.token IN ( ");

  let mut separated = query_builder.separated(", ");

  for job_token in job_tokens {
    separated.push_bind(job_token.to_string());
  }

  separated.push_unseparated(") ");

  let query = query_builder.build_query_as::<RawGenericInferenceJobStatus>();

  let query_results = query.fetch_all(&mut **mysql_connection).await;

  let records = match query_results {
    Ok(records) => records,
    Err(ref err) => return match err {
      sqlx::Error::RowNotFound => Ok(Vec::new()),
      _ => Err(anyhow!("database error: {:?}", err)),
    }
  };

  Ok(raw_records_to_public_result(records))
}

fn make_query_builder() -> QueryBuilder<'static, MySql> {
  // NB(bt): jobs.uuid_idempotency_token is the current way to reconstruct the hash of the
  // TTS result since we don't store a bucket hash on the table. This is an ugly hack :(
  // TODO(bt,2023-10-12): ^^^ Is this comment still accurate? I don't see that field referenced below.
  QueryBuilder::new(r#"
SELECT
    jobs.token as job_token,

    jobs.status as status,
    jobs.attempt_count,

    jobs.maybe_creator_user_token as maybe_creator_user_token,
    jobs.maybe_creator_anonymous_visitor_token as maybe_creator_anonymous_visitor_token,
    jobs.creator_ip_address,

    jobs.product_category,
    jobs.inference_category as inference_category,
    jobs.maybe_model_type,
    jobs.maybe_model_token,
    jobs.maybe_raw_inference_text,
    jobs.maybe_inference_args,

    jobs.frontend_failure_category as maybe_frontend_failure_category,

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
        "#)
}

/// Map the internal record type (since we query over several result tables)
fn raw_records_to_public_result(records: Vec<RawGenericInferenceJobStatus>) -> Vec<GenericInferenceJobStatus> {
  records.into_iter()
      .map(|record| {
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
            InferenceCategory::SeedVc => Some("Seed VC"),
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
          InferenceCategory::SeedVc => (true, record.maybe_media_file_public_bucket_directory_hash.as_deref()),
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
          database_clock: record.database_clock,
        }
      })
      .collect::<Vec<_>>()
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

  pub database_clock: DateTime<Utc>,
}

// NB(bt,2023-12-05): There's an issue with type hinting in the `as` clauses with QueryBuilder (or
// raw query strings) and sqlx::FromRow, regardless of whether it is derived of manually
// implemented. Perhaps this will improve in the future, but for now manually constructed queries
// cannot have type hints, eg. the following:
//
//    m.token as `token: tokens::tokens::media_files::MediaFileToken`,
//    m.origin_category as `origin_category: enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory`,
//    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
//
// This results in the automatic mapping not being able to be found by name (for macro derive), and
// in the manual case `row.try_get()` etc. won't have the correct column name (since the name is the
// full "as" clause).
impl FromRow<'_, MySqlRow> for RawGenericInferenceJobStatus {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      job_token: InferenceJobToken::try_from_mysql_row(row, "job_token")?,
      status: JobStatusPlus::try_from_mysql_row(row, "status")?,
      attempt_count: row.try_get("attempt_count")?,
      maybe_creator_user_token: UserToken::try_from_mysql_row_nullable(row, "maybe_creator_user_token")?,
      maybe_creator_anonymous_visitor_token: AnonymousVisitorTrackingToken::try_from_mysql_row_nullable(row, "maybe_creator_anonymous_visitor_token")?,
      creator_ip_address: row.try_get("creator_ip_address")?,
      product_category: row.try_get("product_category")?,
      inference_category: InferenceCategory::try_from_mysql_row(row, "inference_category")?,
      maybe_model_type: row.try_get("maybe_model_type")?,
      maybe_model_token: row.try_get("maybe_model_token")?,
      maybe_raw_inference_text: row.try_get("maybe_raw_inference_text")?,
      maybe_inference_args: row.try_get("maybe_inference_args")?,
      maybe_result_entity_type: row.try_get("maybe_result_entity_type")?,
      maybe_result_entity_token: row.try_get("maybe_result_entity_token")?,
      maybe_model_weights_title: row.try_get("maybe_model_weights_title")?,
      maybe_tts_model_title: row.try_get("maybe_tts_model_title")?,
      maybe_voice_conversion_model_title: row.try_get("maybe_voice_conversion_model_title")?,
      maybe_voice_conversion_public_bucket_hash: row.try_get("maybe_voice_conversion_public_bucket_hash")?,
      maybe_tts_public_bucket_path: row.try_get("maybe_tts_public_bucket_path")?,
      maybe_media_file_public_bucket_directory_hash: row.try_get("maybe_media_file_public_bucket_directory_hash")?,
      maybe_media_file_public_bucket_prefix: row.try_get("maybe_media_file_public_bucket_prefix")?,
      maybe_media_file_public_bucket_extension: row.try_get("maybe_media_file_public_bucket_extension")?,
      maybe_assigned_worker: row.try_get("maybe_assigned_worker")?,
      maybe_assigned_cluster: row.try_get("maybe_assigned_cluster")?,
      maybe_frontend_failure_category: row.try_get("maybe_frontend_failure_category")?,
      is_keepalive_required: row.try_get("is_keepalive_required")?,
      maybe_first_started_at: row.try_get("maybe_first_started_at")?,
      maybe_successfully_completed_at: row.try_get("maybe_successfully_completed_at")?,
      created_at: row.try_get("created_at")?,
      updated_at: row.try_get("updated_at")?,
      database_clock: row.try_get("database_clock")?,
    })
  }
}
