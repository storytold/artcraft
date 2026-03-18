use tempdir::TempDir;

use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
use errors::AnyhowResult;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;

use crate::job_state::JobState;
use crate::job_types::tts::tacotron::process_tacotron_model::process_tacotron_model;
use crate::job_types::tts::vits::process_vits_model::process_vits_model;
use crate::job_types::vocoder::hifigan_softvc::process_hifigan_softvc_vocoder::process_hifigan_softvc_vocoder;
use crate::job_types::vocoder::hifigan_tacotron::process_hifigan_vocoder::process_hifigan_vocoder;
use crate::job_types::voice_conversion::rvc_v2::process_rvc_v2_model::process_rvc_v2_model;
use crate::job_types::voice_conversion::so_vits_svc::process_so_vits_svc_model::process_so_vits_svc_model;
use crate::job_types::voice_conversion::softvc::process_softvc_model::process_softvc_model;

pub struct DispatchJobToHandlerArgs<'a, 'b: 'a> {
  pub job_runner_state: &'a JobState,
  pub job: &'a AvailableDownloadJob,
  pub temp_dir: &'a TempDir,
  pub download_filename: &'a str,
  pub redis_logger: &'a mut RedisJobStatusLogger<'b>,
}

pub struct CreatedEntityDetails {
  // TODO: Stronger typing.
  pub entity_type: String,
  pub entity_token: String,
}

pub async fn dispatch_job_to_handler<'a, 'b: 'a>(args: DispatchJobToHandlerArgs<'a, 'b>) -> AnyhowResult<Option<CreatedEntityDetails>> {
  let mut entity_type : Option<String> = None;
  let mut entity_token : Option<String> = None;

  match args.job.download_type {
    GenericDownloadType::HifiGan => {
      let results = process_hifigan_vocoder(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
    GenericDownloadType::HifiGanRocketVc => {
      let results = process_hifigan_softvc_vocoder(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
    GenericDownloadType::HifiGanSoVitsSvc => {
      // TODO
    }
    GenericDownloadType::RocketVc => {
      let results = process_softvc_model(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
    GenericDownloadType::RvcV2 => {
      let results = process_rvc_v2_model(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
    GenericDownloadType::SoVitsSvc => {
      let results = process_so_vits_svc_model(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
    GenericDownloadType::Tacotron2 => {
      let results = process_tacotron_model(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
    GenericDownloadType::Vits => {
      let results = process_vits_model(
        args.job_runner_state,
        args.job,
        args.temp_dir,
        args.download_filename,
        args.redis_logger,
      ).await?;
      entity_token = results.entity_token.clone();
      entity_type = results.entity_type.clone();
    }
  }

  if let Some(entity_type) = entity_type {
    if let Some(entity_token) = entity_token {
      return Ok(Some(CreatedEntityDetails {
        entity_token,
        entity_type,
      }));
    }
  }

  Ok(None)
}
