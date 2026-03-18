use std::ffi::OsString;
use std::path::{Path, PathBuf};

use log::info;
use subprocess::{Popen, PopenConfig};

use filesys::path_to_string::path_to_string;
use subprocess_common::docker_options::{DockerEnvVar, DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::AnyhowResult;

/// This command is used to run tacotron2 (v1 "early fakeyou") inference
#[derive(Clone)]
pub struct VitsInferenceCommand {
  /// Where the VITS code lives
  vits_root_code_directory: PathBuf,

  /// The name of the check/process script, eg. `infer_ts.py`
  inference_script_name: PathBuf,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// eg. `python3`
  maybe_override_python_interpreter: Option<String>,

  /// The directory huggingface should cache models
  maybe_huggingface_cache_dir: Option<String>,

  /// The directory nltk should cache models
  maybe_nltk_cache_dir: Option<String>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,
}

pub enum Device {
  Cuda,
  Cpu,
}

pub struct VitsInferenceArgs<P: AsRef<Path>> {
  /// --checkpoint: input path of the model checkpoint
  pub model_checkpoint_path: P,

  /// --config: path of the hparams json file
  pub config_path: P,

  /// --device: cpu or cuda
  pub device: Device,

  /// --input-text-filename: input file containing the inference text
  pub input_text_filename: P,

  /// --output-audio-filename: resulting inference output audio file
  pub output_audio_filename: P,

  /// --output-metadata-filename: resulting inference output metadata file
  pub output_metadata_filename: P,
}

impl VitsInferenceCommand {

  pub fn from_env() -> AnyhowResult<Self> {
    let root_directory = easyenv::get_env_string_required(
      "VITS_INFERENCE_ROOT_DIRECTORY")?;

    let inference_script = easyenv::get_env_string_or_default(
      "VITS_INFERENCE_SCRIPT",
      "infer_ts_job.py");

    let maybe_venv_command = easyenv::get_env_string_optional(
      "VITS_INFERENCE_MAYBE_VENV_COMMAND");

    let maybe_python_interpreter = easyenv::get_env_string_optional(
      "VITS_INFERENCE_MAYBE_PYTHON_INTERPRETER");

    let maybe_huggingface_dataset_cache = easyenv::get_env_string_optional(
      "HF_DATASETS_CACHE");

    let maybe_nltk_data_cache = easyenv::get_env_string_optional(
      "NLTK_DATA");

    let mut docker_env_vars = Vec::new();

    if let Some(cache_dir) = maybe_huggingface_dataset_cache.as_deref() {
      docker_env_vars.push(DockerEnvVar::new("HF_DATASETS_CACHE", cache_dir));
      docker_env_vars.push(DockerEnvVar::new("HF_HOME", cache_dir));
    }

    if let Some(cache_dir) = maybe_nltk_data_cache.as_deref() {
      docker_env_vars.push(DockerEnvVar::new("NLTK_DATA", cache_dir));
      docker_env_vars.push(DockerEnvVar::new("NLTK_DATA_PATH", cache_dir));
    }

    let maybe_docker_env_vars =
        if docker_env_vars.is_empty() { None } else { Some(docker_env_vars) };

    let maybe_docker_options = easyenv::get_env_string_optional(
      "VITS_INFERENCE_MAYBE_DOCKER_IMAGE_SHA")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: maybe_docker_env_vars,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    Ok(Self::new(
      root_directory,
      inference_script,
      maybe_python_interpreter.as_deref(),
      maybe_venv_command.as_deref(),
      maybe_huggingface_dataset_cache.as_deref(),
      maybe_nltk_data_cache.as_deref(),
      maybe_docker_options,
    ))
  }

  pub fn new<P: AsRef<Path>>(
    vits_root_code_directory: P,
    inference_script_name: P,
    maybe_override_python_interpreter: Option<&str>,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_huggingface_cache_directory: Option<&str>,
    maybe_nltk_cache_directory: Option<&str>,
    maybe_docker_options: Option<DockerOptions>,
  ) -> Self {
    Self {
      vits_root_code_directory: vits_root_code_directory.as_ref().to_path_buf(),
      inference_script_name: inference_script_name.as_ref().to_path_buf(),
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_huggingface_cache_dir: maybe_huggingface_cache_directory.map(|s| s.to_string()),
      maybe_nltk_cache_dir: maybe_nltk_cache_directory.map(|s| s.to_string()),
      maybe_override_python_interpreter: maybe_override_python_interpreter.map(|s| s.to_string()),
      maybe_docker_options,
    }
  }

  pub fn execute_inference<P: AsRef<Path>>(
    &self,
    args: VitsInferenceArgs<P>,
  ) -> AnyhowResult<()> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.vits_root_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    let python_binary = self.maybe_override_python_interpreter
        .as_deref()
        .unwrap_or("python");

    command.push_str(" && ");
    command.push_str(python_binary);
    command.push_str(" ");
    command.push_str(&path_to_string(&self.inference_script_name));

    // ===== Begin Python Args =====

    command.push_str(" --checkpoint ");
    command.push_str(&path_to_string(args.model_checkpoint_path));

    command.push_str(" --config ");
    command.push_str(&path_to_string(args.config_path));

    let device = match args.device {
      Device::Cuda => "cuda",
      Device::Cpu => "cpu",
    };

    command.push_str(" --device ");
    command.push_str(&path_to_string(device));

    command.push_str(" --input-text-filename ");
    command.push_str(&path_to_string(args.input_text_filename));

    command.push_str(" --output-audio-filename ");
    command.push_str(&path_to_string(args.output_audio_filename));

    command.push_str(" --output-metadata-filename ");
    command.push_str(&path_to_string(args.output_metadata_filename));

    // ===== End Python Args =====

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let mut env_vars = Vec::new();

    if let Some(cache_dir) = self.maybe_huggingface_cache_dir.as_deref() {
      // NB: Docs point to `HF_DATASETS_CACHE`, but the lib code references `HF_HOME`.
      env_vars.push((OsString::from("HF_DATASETS_CACHE"), OsString::from(cache_dir)));
      env_vars.push((OsString::from("HF_HOME"), OsString::from(cache_dir)));
    }

    if let Some(cache_dir) = self.maybe_nltk_cache_dir.as_deref() {
      env_vars.push((OsString::from("NLTK_DATA"), OsString::from(cache_dir)));
      env_vars.push((OsString::from("NLTK_DATA_PATH"), OsString::from(cache_dir)));
    }

    let mut config = PopenConfig::default();

    if !env_vars.is_empty() {
      config.env = Some(env_vars);
    }

    let mut p = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Subprocess exit status: {:?}", exit_status);

    Ok(())
  }
}
