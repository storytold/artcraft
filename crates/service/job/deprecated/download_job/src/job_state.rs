use std::path::PathBuf;

use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::MySqlPool;

use bootstrap::bootstrap::ContainerEnvironment;
use cloud_storage::bucket_client::BucketClient;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;

use crate::job_types::tts::tacotron::tacotron_model_check_command::TacotronModelCheckCommand;
use crate::job_types::tts::vits::vits_model_check_command::VitsModelCheckCommand;
use crate::job_types::vocoder::hifigan_softvc::hifigan_softvc_model_check_command::HifiGanSoftVcModelCheckCommand;
use crate::job_types::vocoder::hifigan_tacotron::hifigan_model_check_command::HifiGanModelCheckCommand;
use crate::job_types::voice_conversion::rvc_v2::pretrained_hubert_model::PretrainedHubertModel;
use crate::job_types::voice_conversion::rvc_v2::rvc_v2_model_check_command::RvcV2ModelCheckCommand;
use crate::job_types::voice_conversion::so_vits_svc::so_vits_svc_model_check_command::SoVitsSvcModelCheckCommand;
use crate::job_types::voice_conversion::softvc::softvc_model_check_command::SoftVcModelCheckCommand;
use crate::threads::nvidia_smi_checker::nvidia_smi_health_check_status::NvidiaSmiHealthCheckStatus;
use crate::util::scoped_downloads::ScopedDownloads;

pub struct JobState {
  /// The job should only download these types of models.
  /// This is provided at job start from env vars.
  pub scoped_downloads: ScopedDownloads,

  pub download_temp_directory: PathBuf,
  pub mysql_pool: MySqlPool,

  pub redis_pool: r2d2::Pool<RedisConnectionManager>,

  pub public_bucket_client: BucketClient,
  pub private_bucket_client: BucketClient,

  pub firehose_publisher: FirehosePublisher,
  pub badge_granter: BadgeGranter,

  pub bucket_path_unifier: BucketPathUnifier,

  pub nvidia_smi_health_check_status: NvidiaSmiHealthCheckStatus,

  pub sidecar_configs: SidecarConfigs,

  pub pretrained_models: PretrainedModels,

  // Root to store TTS results
  pub bucket_root_tts_model_uploads: String,

  // Sleep between batches
  pub job_batch_wait_millis: u64,

  // How long to wait between log lines
  pub no_op_logger_millis: u64,

  // Max job attempts before failure.
  // NB: This is an i32 so we don't need to convert to db column type.
  pub job_max_attempts: i32,

  pub container: ContainerEnvironment,
  pub container_db: ContainerEnvironmentArg, // Same info, but for database.
}

pub struct PretrainedModels {
  pub rvc_v2_hubert: PretrainedHubertModel,
}

/// Configurations and interfaces to code deployed as sidecars or container mounts.
pub struct SidecarConfigs {
  pub(crate) google_drive_downloader: GoogleDriveDownloadCommand,
  pub rvc_v2_model_check_command: RvcV2ModelCheckCommand,
  pub softvc_model_check_command: SoftVcModelCheckCommand,
  pub so_vits_svc_model_check_command: SoVitsSvcModelCheckCommand,
  pub tacotron_model_check_command: TacotronModelCheckCommand,
  pub hifigan_model_check_command: HifiGanModelCheckCommand,
  pub hifigan_softvc_model_check_command: HifiGanSoftVcModelCheckCommand,
  pub vits_model_check_command: VitsModelCheckCommand,
}