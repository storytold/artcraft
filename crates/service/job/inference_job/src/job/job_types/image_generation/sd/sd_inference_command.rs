use std::fs::File;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::info;
use subprocess::{Popen, PopenConfig, Redirection};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::command_exit_status::CommandExitStatus;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::util::get_filtered_env_vars::get_filtered_env_vars;

#[derive(Clone)]
pub struct StableDiffusionInferenceCommand {
  /// Where the code lives
  stable_diffusion_root_code_directory: PathBuf,

  /// A single executable script or a much larger bash command.
  executable_or_command: ExecutableOrCommand,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// Optional default config file to use
  maybe_default_config_path: Option<PathBuf>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,

  /// If the execution should be ended after a certain point.
  maybe_execution_timeout: Option<Duration>,

  /// Inference arg.
  /// --checkpoint_dir: optional location for checkpoints directory
  pub alternate_checkpoint_dir: Option<PathBuf>,
}

#[derive(Clone)]
pub enum ExecutableOrCommand {
  /// Eg. `inference.py`
  Executable(PathBuf),

  /// Eg. `python3 inference.py`
  Command(String),
}

pub struct InferenceArgs<'a> {
  /// --source_image: path to the input image (or video)
  /// --result_dir: path to directory work is performed
  pub work_dir: PathBuf,
  /// --result_file: path to final file output
  pub output_file: PathBuf,
  pub stdout_output_file: &'a PathBuf,
  pub stderr_output_file: &'a PathBuf,
  pub prompt: String,
  pub negative_prompt:String,
  pub number_of_samples:u32,
  pub samplers:String,
  pub width:u32,
  pub height:u32,
  pub cfg_scale:u32, 
  pub seed:i64,
  pub lora_path:PathBuf,
  pub checkpoint_path:PathBuf,
  pub vae:PathBuf,
  pub batch_count:u32,
}

impl StableDiffusionInferenceCommand {
  pub fn new<P: AsRef<Path>>(
    stable_diffusion_root_code_directory: P,
    executable_or_command: ExecutableOrCommand,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_default_config_path: Option<P>,
    maybe_docker_options: Option<DockerOptions>,
    maybe_execution_timeout: Option<Duration>,
    alternate_checkpoint_dir: Option<PathBuf>
  ) -> Self {
    Self {
      stable_diffusion_root_code_directory: stable_diffusion_root_code_directory.as_ref().to_path_buf(),
      executable_or_command,
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
      maybe_docker_options,
      maybe_execution_timeout,
      alternate_checkpoint_dir,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let stable_diffusion_root_code_directory = easyenv::get_env_pathbuf_required(
      "STABLE_DIFFUSION_INFERENCE_ROOT_DIRECTORY")?;

    let maybe_inference_command = easyenv::get_env_string_optional(
      "STABLE_DIFFUSION_INFERENCE_COMMAND");


    let executable_or_command = match maybe_inference_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => {
        return Err(anyhow!("neither command nor executable passed"));
      }
    };

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
      "STABLE_DIFFUSION_INFERENCE_MAYBE_VENV_COMMAND");

    let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
      "STABLE_DIFFUSION_INFERENCE_MAYBE_DEFAULT_CONFIG_PATH");

    let maybe_execution_timeout: Option<Duration> =
        easyenv::get_env_duration_seconds_optional("STABLE_DIFFUSION_TIMEOUT_SECONDS");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "STABLE_DIFFUSION_INFERENCE_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    // Override for --checkpoint_dir at inference time
    let alternate_checkpoint_dir = easyenv::get_env_pathbuf_optional(
      "STABLE_DIFFUSION_ALTERNATE_CHECKPOINT_PATH");

    Ok(Self {
      stable_diffusion_root_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_default_config_path,
      maybe_docker_options,
      maybe_execution_timeout,
      alternate_checkpoint_dir,
    })
  }

  pub fn execute_inference(
    &self,
    args: InferenceArgs,
  ) -> CommandExitStatus {
    match self.do_execute_inference(args) {
      Ok(exit_status) => exit_status,
      Err(error) => CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
    }
  }

  fn do_execute_inference(
    &self,
    args: InferenceArgs,
  ) -> AnyhowResult<CommandExitStatus> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.stable_diffusion_root_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push_str(" ");
    }

    command.push_str(" && ");

    match self.executable_or_command {
      ExecutableOrCommand::Executable(ref executable) => {
        command.push_str(&path_to_string(executable));
        command.push_str(" ");
      }
      ExecutableOrCommand::Command(ref cmd) => {
        command.push_str(cmd);
        command.push_str(" ");
      }
    }

    // ===== Begin Python Args =====
    command.push_str(format!("--prompt \"{}\"",&path_to_string(args.prompt)).as_ref());

    command.push_str(" --output-dir ");
    command.push_str(&path_to_string(args.work_dir));

    command.push_str(" --output-name ");
    command.push_str(&path_to_string(args.output_file));
    
    // command.push_str(" --stderr-output-file ");
    // command.push_str(&path_to_string(args.stderr_output_file.clone()));

    command.push_str(format!(" --negative-prompt \"{}\"",&path_to_string(args.negative_prompt)).as_ref());
    //command.push_str(&path_to_string(args.negative_prompt));
    
    command.push_str(" --number-of-samples ");
    command.push_str(args.number_of_samples.to_string().as_str());
    
    command.push_str(format!(" --samplers \"{}\"",&path_to_string(args.samplers)).as_ref());
    //command.push_str(&path_to_string(args.samplers));
    
    command.push_str(" --width ");
    command.push_str(args.width.to_string().as_str());
    
    command.push_str(" --height ");
    command.push_str(args.height.to_string().as_str());
    
    command.push_str(" --cfg-scale ");
    command.push_str(args.cfg_scale.to_string().as_str());
    
    command.push_str(" --seed ");
    command.push_str(args.seed.to_string().as_str());
    
    // TODO ensure lora path is not empty ...
    if args.lora_path.as_os_str().is_empty() == false {
      command.push_str(" --loRA-path ");
      command.push_str(&path_to_string(args.lora_path));
    }
    
    command.push_str(" --check-point ");
    command.push_str(&path_to_string(args.checkpoint_path));
    
    command.push_str(" --vae ");
    command.push_str(&path_to_string(args.vae));
    
    command.push_str(" --batch-count ");
    command.push_str(args.batch_count.to_string().as_str());
    
    command.push_str(" --batch-size ");
    command.push_str(1.to_string().as_str());


    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let env_vars = get_filtered_env_vars();

    let mut config = PopenConfig::default();

    info!("stderr will be written to file: {}", path_to_string(args.stderr_output_file.clone()));

    //let stdout_file = File::create(args.stdout_output_file)?;
    //config.stdout = Redirection::File(stdout_file);

    let stderr_file = File::create(args.stderr_output_file)?;
    config.stderr = Redirection::File(stderr_file);

    if !env_vars.is_empty() {
      config.env = Some(env_vars);
    }

    let mut p = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", p.pid());

    match self.maybe_execution_timeout {
      None => {
        let exit_status = p.wait()?;
        info!("Subprocess exit status: {:?}", exit_status);
        Ok(CommandExitStatus::from_exit_status(exit_status))
      }
      Some(timeout) => {
        info!("Executing with timeout: {:?}", &timeout);
        let exit_status = p.wait_timeout(timeout)?;

        match exit_status {
          None => {
            // NB: If the program didn't successfully terminate, kill it.
            info!("Subprocess didn't end after timeout: {:?}; terminating...", &timeout);
            let _r = p.terminate()?;
            Ok(CommandExitStatus::Timeout)
          }
          Some(exit_status) => {
            info!("Subprocess timed wait exit status: {:?}", exit_status);
            Ok(CommandExitStatus::from_exit_status(exit_status))
          }
        }
      }
    }
  }
}
