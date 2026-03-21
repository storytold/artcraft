use anyhow::anyhow;
use sqlx::error::DatabaseError;
use sqlx::MySqlPool;

use enums_db::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums_db::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums_db::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums_db::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;

pub struct InsertGenericInferenceArgs<'a> {
  pub uuid_idempotency_token: &'a str,

  // NB: This will eventually take the place of "inference category" and "maybe model type", since the latter two are
  // used entirely inconsistently for job dispatching (especially "inference category"). This should always be 1:1 with
  // a concrete job type.
  pub job_type: InferenceJobType,

  pub maybe_product_category: Option<InferenceJobProductCategory>,

  // TODO(bt,2024-09-05): We really need to kill this, but the frontend depends on it.
  pub inference_category: InferenceCategory,

  pub maybe_model_type: Option<InferenceModelType>,
  pub maybe_model_token: Option<&'a str>,

  pub maybe_input_source_token: Option<&'a str>,
  pub maybe_input_source_token_type: Option<InferenceInputSourceTokenType>,

  // For jobs that perform "downloads", this is the URL to download.
  // NB: Some jobs aren't using this field yet and will pack the URL inside
  //   the "GenericInferenceArgs" field. The goal is to migrate them to this
  //   top-level field eventually.
  pub maybe_download_url: Option<&'a str>,

  // For jobs that perform "downloads", this is a possible cover image for the new model.
  pub maybe_cover_image_media_file_token: Option<&'a MediaFileToken>,

  pub maybe_raw_inference_text: Option<&'a str>,

  pub maybe_max_duration_seconds: Option<i32>,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_avt_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub priority_level: u8,
  pub requires_keepalive: bool,

  pub is_debug_request: bool,
  pub maybe_routing_tag: Option<&'a str>,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_generic_inference_job(args: InsertGenericInferenceArgs<'_>)
  -> Result<(InferenceJobToken, u64), DatabaseQueryError>
{
  let job_token = InferenceJobToken::generate();

  let serialized_args_payload = serde_json::ser::to_string(&args.maybe_inference_args)
      .map_err(|_e| anyhow!("could not encode inference args"))?;

  // The routing tag column is VARCHAR(32), so we should truncate.
  let maybe_routing_tag = args.maybe_routing_tag
      .map(|routing_tag| {
        let mut routing_tag = routing_tag.trim().to_string();
        routing_tag.truncate(64);
        routing_tag
      });

  // This only applies to certain types of inference.
  // "0" is the default value, typically 12 seconds for TTS.
  // "-1" means "unlimited"
  let max_duration_seconds = args.maybe_max_duration_seconds.unwrap_or(0);

  let query = sqlx::query!(
        r#"
INSERT INTO generic_inference_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,

  job_type = ?,

  product_category = ?,

  inference_category = ?,
  maybe_model_type = ?,
  maybe_model_token = ?,

  maybe_input_source_token = ?,
  maybe_input_source_token_type = ?,

  maybe_download_url = ?,
  maybe_cover_image_media_file_token = ?,

  maybe_raw_inference_text = ?,

  maybe_inference_args = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,

  creator_set_visibility = ?,

  priority_level = ?,
  is_keepalive_required = ?,
  max_duration_seconds = ?,

  is_debug_request = ?,
  maybe_routing_tag = ?,

  status = "pending"
        "#,
        job_token.as_str(),
        args.uuid_idempotency_token,

        args.job_type.to_str(),

        args.maybe_product_category.map(|c| c.to_str()),

        args.inference_category.to_str(),

        args.maybe_model_type.map(|t| t.to_str()),
        args.maybe_model_token,

        args.maybe_input_source_token,
        args.maybe_input_source_token_type,

        args.maybe_download_url,
        args.maybe_cover_image_media_file_token.map(|t| t.as_str()),

        args.maybe_raw_inference_text,

        serialized_args_payload,

        args.maybe_creator_user_token.map(|t| t.to_string()),
        args.maybe_avt_token.map(|t| t.to_string()),
        args.creator_ip_address,

        args.creator_set_visibility.to_str(),

        args.priority_level,
        args.requires_keepalive,
        max_duration_seconds,

        args.is_debug_request,
        maybe_routing_tag,
    );

  let query_result = query.execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Err(err) => return Err(DatabaseQueryError::from(err)),
    Ok(res) => res.last_insert_id(),
  };

  Ok((job_token, record_id))
}
