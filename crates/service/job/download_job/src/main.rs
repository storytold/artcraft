// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(unreachable_patterns)]
//#![forbid(unused_imports)]
//#![forbid(unused_mut)]
//#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

// Strict AF
//#![forbid(warnings)]

#[macro_use] extern crate serde_derive;

use std::ops::Deref;
use std::path::PathBuf;
use std::time::Duration;

use log::info;
use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;
use tokio::runtime::Runtime;

use bootstrap::bootstrap::{bootstrap, BootstrapArgs};
use cloud_storage::bucket_client::BucketClient;
use cloud_storage::bucket_path_unifier::BucketPathUnifier;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;
use filesys::check_directory_exists::check_directory_exists;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use mysql_queries::common_inputs::container_environment_arg::ContainerEnvironmentArg;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::job_loop::main_loop::main_loop;
use crate::job_state::{JobState, PretrainedModels, SidecarConfigs};
use crate::job_types::tts::tacotron::tacotron_model_check_command::TacotronModelCheckCommand;
use crate::job_types::tts::vits::vits_model_check_command::VitsModelCheckCommand;
use crate::job_types::vocoder::hifigan_softvc::hifigan_softvc_model_check_command::HifiGanSoftVcModelCheckCommand;
use crate::job_types::vocoder::hifigan_tacotron::hifigan_model_check_command::HifiGanModelCheckCommand;
use crate::job_types::voice_conversion::rvc_v2::pretrained_hubert_model::PretrainedHubertModel;
use crate::job_types::voice_conversion::rvc_v2::rvc_v2_model_check_command::RvcV2ModelCheckCommand;
use crate::job_types::voice_conversion::so_vits_svc::so_vits_svc_model_check_command::SoVitsSvcModelCheckCommand;
use crate::job_types::voice_conversion::softvc::softvc_model_check_command::SoftVcModelCheckCommand;
use crate::threads::nvidia_smi_checker::nvidia_smi_health_check_status::NvidiaSmiHealthCheckStatus;
use crate::threads::nvidia_smi_checker::nvidia_smi_health_check_thread::nvidia_smi_health_check_thread;
use crate::util::scoped_downloads::ScopedDownloads;

pub mod job_loop;
pub mod job_state;
pub mod job_types;
pub mod threads;
pub mod util;

// Buckets
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";
const ENV_BUCKET_NAME : &str = "TTS_DOWNLOAD_BUCKET_NAME";
const ENV_BUCKET_ROOT : &str = "TTS_DOWNLOAD_BUCKET_ROOT";

const DEFAULT_TEMP_DIR: &str = "/tmp";

#[tokio::main]
async fn main() -> AnyhowResult<()> {

  let container_environment = bootstrap(BootstrapArgs {
    app_name: "download-job",
    default_logging_override: Some(DEFAULT_RUST_LOG),
    config_search_directories: &[".", "./config", "crates/service/job/download_job/config"],
  })?;

  info!("Hostname: {}", &container_environment.hostname);

  // Bucket stuff
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;
  let private_bucket_name = easyenv::get_env_string_required("PRIVATE_BUCKET_NAME")?;
  let public_bucket_name = easyenv::get_env_string_required("PUBLIC_BUCKET_NAME")?;
  let bucket_root = easyenv::get_env_string_required(ENV_BUCKET_ROOT)?;
  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default("S3_COMPATIBLE_ENDPOINT_URL",
    "https://storage.googleapis.com");

  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let temp_directory = easyenv::get_env_string_or_default(
    "DOWNLOAD_TEMP_DIR",
    DEFAULT_TEMP_DIR);

  // =============== Configure Python "Sidecars" ===============

  let google_drive_downloader = {
    let maybe_root_directory = easyenv::get_env_string_optional(
      "WEB_DOWNLOADER_MAYBE_ROOT_DIRECTORY");

    let downloader_command= easyenv::get_env_string_or_default(
      "WEB_DOWNLOADER_COMMAND", // TODO: Was "DOWNLOAD_SCRIPT" in old apps
      "./download_internet_file.py");

    let maybe_downloader_venv_script = easyenv::get_env_string_optional(
      "WEB_DOWNLOADER_MAYBE_VENV_SCRIPT");

    let docker_options = easyenv::get_env_string_optional(
      "WEB_DOWNLOADER_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
            DockerOptions {
              image_name,
              maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
              maybe_environment_variables: None,
              maybe_gpu: None,
            }
          });

    GoogleDriveDownloadCommand::new(
      &downloader_command,
      maybe_root_directory.as_deref(),
      maybe_downloader_venv_script.as_deref(),
      docker_options,
    )
  };

  let softvc_model_check_command = {
    let root_directory = easyenv::get_env_string_required(
      "SOFTVC_MODEL_CHECK_ROOT_DIRECTORY")?;

    let python_command = easyenv::get_env_string_or_default(
      "SOFTVC_MODEL_CHECK_COMMAND",
      "./model_check_softvc_acoustic.py");

    let maybe_venv_command = easyenv::get_env_string_optional(
      "SOFTVC_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "SOFTVC_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    SoftVcModelCheckCommand::new(
      &root_directory,
      maybe_venv_command.as_deref(),
      &python_command,
      maybe_docker_options,
    )
  };

  let tacotron_model_check_command = {
    let root_directory = easyenv::get_env_string_required(
      "TACOTRON_MODEL_CHECK_ROOT_DIRECTORY")?;

    let python_command = easyenv::get_env_string_or_default(
      "TACOTRON_MODEL_CHECK_COMMAND",
      "./vocodes_model_check_tacotron.py");

    let maybe_venv_command = easyenv::get_env_string_optional(
      "TACOTRON_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "TACOTRON_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    TacotronModelCheckCommand::new(
      &root_directory,
      maybe_venv_command.as_deref(),
      &python_command,
      maybe_docker_options,
    )
  };

  let hifigan_model_check_command= {
    let root_directory = easyenv::get_env_string_required(
      "HIFIGAN_MODEL_CHECK_ROOT_DIRECTORY")?;

    let python_command = easyenv::get_env_string_or_default(
      "HIFIGAN_MODEL_CHECK_COMMAND",
      "./vocodes_model_check_tacotron.py");

    let maybe_venv_command = easyenv::get_env_string_optional(
      "HIFIGAN_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "HIFIGAN_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    HifiGanModelCheckCommand::new(
      &root_directory,
      maybe_venv_command.as_deref(),
      &python_command,
      maybe_docker_options,
    )
  };

  let hifigan_softvc_model_check_command= {
    let root_directory = easyenv::get_env_string_required(
      "HIFIGAN_SOFTVC_MODEL_CHECK_ROOT_DIRECTORY")?;

    let python_command = easyenv::get_env_string_or_default(
      "HIFIGAN_SOFTVC_MODEL_CHECK_COMMAND",
      "./model_check_hifigan.py");

    let maybe_venv_command = easyenv::get_env_string_optional(
      "HIFIGAN_SOFTVC_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "HIFIGAN_SOFTVC_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    HifiGanSoftVcModelCheckCommand::new(
      &root_directory,
      maybe_venv_command.as_deref(),
      &python_command,
      maybe_docker_options,
    )
  };

  let vits_model_check_command = {
    let root_directory = easyenv::get_env_string_required(
      "VITS_MODEL_CHECK_ROOT_DIRECTORY")?;

    let check_script = easyenv::get_env_string_or_default(
      "VITS_MODEL_CHECK_COMMAND",
      "export_ts.py");

    let maybe_venv_command = easyenv::get_env_string_optional(
      "VITS_MODEL_CHECK_MAYBE_VENV_COMMAND");

    let maybe_python_interpreter = easyenv::get_env_string_optional(
      "VITS_MODEL_CHECK_MAYBE_PYTHON_INTERPRETER");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "VITS_MODEL_CHECK_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    VitsModelCheckCommand::new(
       root_directory,
      check_script,
      maybe_python_interpreter.as_deref(),
      maybe_venv_command.as_deref(),
      maybe_docker_options,
    )
  };

  // =============== End Configure Python "Sidecars" ===============

  let temp_directory = PathBuf::from(temp_directory);

  check_directory_exists(&temp_directory)?;

  let db_connection_string =
    easyenv::get_env_string_or_default(
      "MYSQL_URL",
      DEFAULT_MYSQL_CONNECTION_STRING);

  info!("Connecting to database...");

  let mysql_pool = MySqlPoolOptions::new()
    .max_connections(5)
    .connect(&db_connection_string)
    .await?;

  let common_env = CommonEnv::read_from_env()?;

  info!("Connecting to redis...");

  let redis_manager =
      RedisConnectionManager::new(common_env.redis_0_connection_string.deref())?;

  let redis_pool = r2d2::Pool::builder()
      .build(redis_manager)?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: mysql_pool.clone(), // NB: Pool is sync/send/clone-safe
  };

  let badge_granter = BadgeGranter {
    mysql_pool: mysql_pool.clone(), // NB: Pool is sync/send/clone-safe
    firehose_publisher: firehose_publisher.clone(), // NB: Also safe
  };

  let tokio_runtime = Runtime::new()?;

  info!("Spawning nvidia-smi health checker.");

  let nvidia_smi_health_check_status = NvidiaSmiHealthCheckStatus::new();
  let nvidia_smi_health_check_status2 = nvidia_smi_health_check_status.clone();

  tokio_runtime.spawn(async move {
    nvidia_smi_health_check_thread(
      nvidia_smi_health_check_status2,
      easyenv::get_env_duration_seconds_or_default("NVIDIA_HEALTH_CHECK_TIMEOUT_SECONDS", Duration::from_secs(30)),
    ).await;
  });

  let job_state = JobState {
    scoped_downloads: ScopedDownloads::new_from_env()?,
    download_temp_directory: temp_directory,
    mysql_pool,
    redis_pool,
    private_bucket_client,
    public_bucket_client,
    bucket_path_unifier: BucketPathUnifier::default_paths(),
    bucket_root_tts_model_uploads: bucket_root.to_string(),
    nvidia_smi_health_check_status,
    firehose_publisher,
    badge_granter,
    sidecar_configs: SidecarConfigs {
      google_drive_downloader,
      rvc_v2_model_check_command: RvcV2ModelCheckCommand::from_env()?,
      softvc_model_check_command,
      so_vits_svc_model_check_command: SoVitsSvcModelCheckCommand::from_env()?,
      tacotron_model_check_command,
      hifigan_model_check_command,
      hifigan_softvc_model_check_command,
      vits_model_check_command,
    },
    pretrained_models: PretrainedModels {
      rvc_v2_hubert: PretrainedHubertModel::from_env(),
    },
    job_batch_wait_millis: common_env.job_batch_wait_millis,
    job_max_attempts: common_env.job_max_attempts as i32,
    no_op_logger_millis: common_env.no_op_logger_millis,
    container: container_environment.clone(),
    container_db: ContainerEnvironmentArg {
      hostname: container_environment.hostname,
      cluster_name: container_environment.cluster_name,
    },
  };

  main_loop(job_state).await;

  Ok(())
}
