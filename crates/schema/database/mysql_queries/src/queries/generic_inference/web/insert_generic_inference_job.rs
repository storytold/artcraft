use std::marker::PhantomData;

use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::common::insert_full_generic_inference_job_record::{
  insert_full_generic_inference_job_record,
  InsertFullGenericInferenceJobRecordArgs,
};

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

  // This only applies to certain types of inference.
  // "0" is the default value, typically 12 seconds for TTS.
  // "-1" means "unlimited"
  let max_duration_seconds = args.maybe_max_duration_seconds.unwrap_or(0);

  let inner_args = InsertFullGenericInferenceJobRecordArgs {
    token: &job_token,
    uuid_idempotency_token: args.uuid_idempotency_token,

    job_type: args.job_type,

    // Web-driven jobs are not bound to a specific upstream provider here.
    maybe_external_third_party: None,
    maybe_external_third_party_id: None,

    maybe_product_category: args.maybe_product_category,
    inference_category: args.inference_category,

    maybe_model_type: args.maybe_model_type,
    maybe_model_token: args.maybe_model_token,

    maybe_input_source_token: args.maybe_input_source_token,
    maybe_input_source_token_type: args.maybe_input_source_token_type,

    maybe_download_url: args.maybe_download_url,
    maybe_cover_image_media_file_token: args.maybe_cover_image_media_file_token,

    // Web variant didn't set these — pass None to keep DB NULL.
    maybe_prompt_token: None,
    maybe_wallet_ledger_entry_token: None,

    maybe_raw_inference_text: args.maybe_raw_inference_text,

    maybe_inference_args: args.maybe_inference_args,

    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,

    priority_level: args.priority_level,
    requires_keepalive: args.requires_keepalive,
    max_duration_seconds,
    is_debug_request: args.is_debug_request,

    maybe_routing_tag: args.maybe_routing_tag,

    maybe_platform_type: None,

    maybe_debug_log_event_token: None,
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,

    status: JobStatusPlus::Pending,

    mysql_executor: args.mysql_pool,
    phantom: PhantomData,
  };

  let record_id = insert_full_generic_inference_job_record(inner_args).await?;
  Ok((job_token, record_id))
}
