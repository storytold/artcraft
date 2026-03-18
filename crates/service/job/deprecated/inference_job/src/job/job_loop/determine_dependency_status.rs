use std::path::PathBuf;

use anyhow::anyhow;
use log::{info, warn};

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::tts_models::tts_model_type::TtsModelType;
use filesys::file_exists::file_exists;
use migration::text_to_speech::get_tts_model_for_run_inference_migration::{get_tts_model_for_run_inference_migration, TtsModelForRunInferenceMigrationWrapper};
use migration::voice_conversion::query_vc_model_for_migration::{query_vc_model_for_migration, VcModel, VcModelError, VcModelType};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::tts::tts_models::get_tts_model_for_inference_improved::TtsModelForInferenceError;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::state::job_dependencies::JobDependencies;

pub struct DependencyStatus {
  /// The DB record for the model being used in this job.
  pub maybe_inference_model: MaybeInferenceModel,

  /// The model token (if there is a model)
  pub maybe_model_token: Option<String>,

  /// Whether the ML model(s) already exist on the filesystem.
  /// If so, we won't need to incur a bucket download, and we should prioritize the job.
  pub models_already_on_filesystem: bool,
}

pub enum MaybeInferenceModel {
  None,
  TtsModel(TtsModelForRunInferenceMigrationWrapper),
  VcModel(VcModel)
}

pub async fn determine_dependency_status(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<DependencyStatus, ProcessSingleJobError> {
  let maybe_model = get_model_record_from_cacheable_query(job_dependencies, job).await?;
  let maybe_token_and_path = get_model_token_and_path(job_dependencies, &maybe_model);

  let models_already_on_filesystem = match maybe_token_and_path.maybe_filesystem_path {
    None => true,
    Some(path) => {
      info!("Checking if dynamic model dependency already on filesystem: {:?}", path);
      let exists = file_exists(&path);
      info!("Checking if dynamic model dependency already on filesystem: {:?} (exists = {})", path, exists);
      exists
    },
  };

  Ok(DependencyStatus {
    maybe_inference_model: maybe_model,
    maybe_model_token: maybe_token_and_path.maybe_model_token,
    models_already_on_filesystem,
  })
}


struct MaybeTokenAndPath {
  maybe_model_token: Option<String>,
  maybe_filesystem_path: Option<PathBuf>,
}

fn get_model_token_and_path(job_dependencies: &JobDependencies, maybe_model: &MaybeInferenceModel) -> MaybeTokenAndPath {
  let mut maybe_model_token = None;

  // TODO(bt,2023-05-01): Also check other paths (user-supplied vocoders, etc.)
  let maybe_filesystem_path = match maybe_model {
    MaybeInferenceModel::TtsModel(ref model) => {
      match model.tts_model_type() {
        TtsModelType::Tacotron2 => {
          maybe_model_token = Some(model.token().to_string());
          Some(job_dependencies
              .fs
              .semi_persistent_cache
              .tts_synthesizer_model_path(model.token()))
        }
        TtsModelType::Vits => {
          None
        }
      }
    }
    MaybeInferenceModel::VcModel(ref model) => {
      match model.get_model_type() {
        VcModelType::RvcV2 => {
          None // TODO(bt, 2023-07-16): Handle RVCv2.
        }
        VcModelType::SoftVc => {
          None
        }
        VcModelType::SoVitsSvc => {
          let token = model.get_model_token();
          maybe_model_token = Some(token.to_string());
          Some(job_dependencies
              .fs
              .semi_persistent_cache
              .voice_conversion_model_path(token))
        }
        VcModelType::Invalid => {
          None
        }
      }
    }
    MaybeInferenceModel::None => {
      None
    }
  };

  MaybeTokenAndPath {
    maybe_model_token,
    maybe_filesystem_path,
  }
}

async fn get_model_record_from_cacheable_query(job_dependencies: &JobDependencies, job: &AvailableInferenceJob) -> Result<MaybeInferenceModel, ProcessSingleJobError> {
  let model = match (job.inference_category, job.maybe_model_token.as_deref()) {
    (InferenceCategory::TextToSpeech, Some(token)) => {
      let maybe_model = job_dependencies
          .job
          .info
          .caches
          .tts_model_record_cache
          .copy_without_bump_if_unexpired(token.to_string())
          .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

      match maybe_model {
        Some(model) => MaybeInferenceModel::TtsModel(model),
        None => {
          let maybe_tts_model = get_tts_model_for_run_inference_migration(
            token, &job_dependencies.db.mysql_pool)
              .await
              .map_err(|err| match err {
                TtsModelForInferenceError::ModelDeleted => ProcessSingleJobError::ModelDeleted,
                _ => ProcessSingleJobError::Other(anyhow!("database error: {:?}", err))
              })?;

          match maybe_tts_model {
            None => MaybeInferenceModel::None,
            Some(model) => {
              let token = token.to_string();
              let _r = job_dependencies
                  .job
                  .info
                  .caches
                  .tts_model_record_cache
                  .store_copy(&token, &model)
                  .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;
              MaybeInferenceModel::TtsModel(model)
            },
          }
        }
      }
    }
    (InferenceCategory::VoiceConversion, Some(token)) => {
      let maybe_model = job_dependencies
          .job
          .info
          .caches
          .vc_model_record_cache
          .copy_without_bump_if_unexpired(token.to_string())
          .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

      match maybe_model {
        Some(model) => MaybeInferenceModel::VcModel(model),
        None => {
          let maybe_vc_model = query_vc_model_for_migration(token,
            &job_dependencies.db.mysql_pool)
              .await
              .map_err(|err|
                  match err {
                    VcModelError::ModelDeleted => ProcessSingleJobError::ModelDeleted,
                    _ => ProcessSingleJobError::Other(anyhow!("database error: {:?}", err))
                  })?;

          match maybe_vc_model {
            None => MaybeInferenceModel::None,
            Some(model) => {
              let token = token.to_string();
              let _r = job_dependencies
                  .job
                  .info
                  .caches
                  .vc_model_record_cache
                  .store_copy(&token, &model)
                  .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

              MaybeInferenceModel::VcModel(model)
            },
          }
        }
      }
    }
    _ => {
      warn!("Only applies to older job workflows. Job does not have a category or a model token: {:?} - category: {:?}, token: {:?}",
        job.id, job.inference_category, job.maybe_model_token);

      MaybeInferenceModel::None
    },
  };

  Ok(model)
}
