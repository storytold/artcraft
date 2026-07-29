use artcraft_api_defs::omni_api::job_status::omni_api_job_status_payload::{
  OmniApiJobRequestDetails, OmniApiJobResultDetails, OmniApiJobStatusDetails, OmniApiJobStatusPayload,
};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::legacy::typified_paths::public::voice_conversion_results::bucket_file_path::VoiceConversionResultOriginalFilePath;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use server_environment::ServerEnvironment;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::inference_job::utils::estimates::estimate_job_progress::estimate_job_progress;
use crate::http_server::endpoints::inference_job::utils::extractors::extract_polymorphic_inference_args::extract_polymorphic_inference_args;
use crate::http_server::web_utils::filter_model_name::maybe_filter_model_name;

/// Convert a DB job-status record into the Omni API response payload.
///
/// This is the same mapping the cookie-authenticated `/v1/jobs/*` handlers use;
/// it's shared by both the single and batch Omni API status handlers.
#[allow(deprecated)] // We match deprecated `InferenceCategory` variants in the result-path mapping.
pub fn record_to_payload(
  record: GenericInferenceJobStatus,
  server_environment: ServerEnvironment,
  media_domain: MediaDomain,
) -> OmniApiJobStatusPayload {
  let inference_category = record.request_details.inference_category;

  // NB: Fail open. We don't want to fail the request if we can't extract the args.
  let maybe_polymorphic_args = extract_polymorphic_inference_args(&record)
      .ok()
      .flatten();

  let progress_percentage = estimate_job_progress(&record, maybe_polymorphic_args.as_ref());

  OmniApiJobStatusPayload {
    job_token: record.job_token,
    request: OmniApiJobRequestDetails {
      inference_category: record.request_details.inference_category,
      maybe_prompt_token: record.request_details.maybe_prompt_token,
      maybe_model_type: maybe_filter_model_name(record.request_details.maybe_model_type.as_deref()),
      maybe_model_token: record.request_details.maybe_model_token,
    },
    status: OmniApiJobStatusDetails {
      status: record.status,
      maybe_first_started_at: record.maybe_first_started_at,
      maybe_failure_category: record.maybe_frontend_failure_category,
      progress_percentage,
    },
    maybe_result: record.maybe_result_details.map(|result_details| {
      // NB: Be careful here, because this varies based on the type of inference result.
      let public_bucket_media_path = match inference_category {
        // NB: TTS has to be special cased due to legacy behavior
        InferenceCategory::TextToSpeech
        | InferenceCategory::F5TTS => {
          match result_details.entity_type.as_str() {
            "media_file" => {
              // NB: We're migrating TTS to media_files.
              // Zero shot TTS uses media files.
              // Legacy TT2 uses old pathing.
              MediaFileBucketPath::from_object_hash(
                &result_details.public_bucket_location_or_hash,
                result_details.maybe_media_file_public_bucket_prefix.as_deref(),
                result_details.maybe_media_file_public_bucket_extension.as_deref())
                  .get_full_object_path_str()
                  .to_string()
            }
            _ => {
              // NB: TTS results receive the legacy treatment where their table only reports the full bucket path
              result_details.public_bucket_location_or_hash
            }
          }
        }
        // NB: Voice conversion has to be special cased due to legacy behavior
        InferenceCategory::VoiceConversion | InferenceCategory::SeedVc => {
          match result_details.entity_type.as_str() {
            "media_file" => {
              // NB: We're migrating voice conversion to media_files.
              MediaFileBucketPath::from_object_hash(
                &result_details.public_bucket_location_or_hash,
                result_details.maybe_media_file_public_bucket_prefix.as_deref(),
                result_details.maybe_media_file_public_bucket_extension.as_deref())
                  .get_full_object_path_str()
                  .to_string()
            }
            _ => {
              // NB: This is the old voice conversion result pathing.
              VoiceConversionResultOriginalFilePath::from_object_hash(&result_details.public_bucket_location_or_hash)
                  .get_full_object_path_str()
                  .to_string()
            }
          }
        }
        // Unsupported media files.
        InferenceCategory::FormatConversion |
        InferenceCategory::ConvertBvhToWorkflow => {
          "".to_string()
        }
        // Deprecated
        InferenceCategory::DeprecatedField => {
          "".to_string() // TODO(bt,2024-07-16): Read job type instead
        }
        // The blessed path that modern media files use.
        _ => {
          MediaFileBucketPath::from_object_hash(
            &result_details.public_bucket_location_or_hash,
            result_details.maybe_media_file_public_bucket_prefix.as_deref(),
            result_details.maybe_media_file_public_bucket_extension.as_deref())
              .get_full_object_path_str()
              .to_string()
        }
      };

      OmniApiJobResultDetails {
        entity_type: result_details.entity_type,
        entity_token: result_details.entity_token,
        media_links: MediaLinksBuilder::from_rooted_path_and_env(
          media_domain,
          server_environment,
          &public_bucket_media_path,
        ),
        maybe_successfully_completed_at: result_details.maybe_successfully_completed_at,
      }
    }),
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}
