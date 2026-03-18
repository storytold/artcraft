use std::path::{Path, PathBuf};

use log::info;
use subprocess::{Popen, PopenConfig};

use errors::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

use crate::job::job_types::tts::tacotron2::vocoder_option::VocoderForInferenceOption;

/// This command is used to run tacotron2 (v1 "early fakeyou") inference
#[derive(Clone)]
pub struct Tacotron2InferenceCommand {
  /// Where the TT2 code lives
  tacotron_code_root_directory: PathBuf,

  /// The name of the inference script, eg. `vocodes_inference_updated.py`
  inference_script_name: PathBuf,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// eg. `python3`
  maybe_override_python_interpreter: Option<String>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,
}

pub enum MelMultiplyFactor {
  // NB: Default is typically "1.4"
  DefaultMultiplyFactor,
  // Custom values tend to range from 1.1 to 1.5
  CustomMultiplyFactor(f64),
}

pub struct InferenceArgs <'a, P: AsRef<Path>> {
  // Model parameters

  /// Arg: --synthesizer_checkpoint_path
  pub synthesizer_checkpoint_path: P,

  /// Arg: --text_pipeline_type
  pub text_pipeline_type: &'a str, // TODO: Enum

  /// Arg: --vocoder_type
  pub vocoder: VocoderForInferenceOption<P>,

  /// Optional mel scaling before vocoding
  /// Args: --use_default_mel_multiply_factor and --maybe_custom_mel_multiply_factor
  pub maybe_mel_multiply_factor: Option<MelMultiplyFactor>,

  // Premium features

  /// Arg: --max_decoder_steps, determines inference length
  pub max_decoder_steps: u32,

  // User input

  /// Arg: input_text_filename, path to file containing text to run inference on
  pub input_text_filename: P,

  // Output files

  /// Arg: --output_audio_filename, where to save audio result
  pub output_audio_filename: P,

  /// Arg: --output_spectrogram_filename, where to save spectrogram result
  pub output_spectrogram_filename: P,

  /// Arg: --output_metadata_filename, where to save extra metadata
  pub output_metadata_filename: P,
}

impl Tacotron2InferenceCommand {
  pub fn new<P: AsRef<Path>>(
    tacotron_code_root_directory: P,
    maybe_override_python_interpreter: Option<&str>,
    maybe_virtual_env_activation_command: Option<&str>,
    inference_script_name: P,
    maybe_docker_options: Option<DockerOptions>,
  ) -> Self {
    Self {
      tacotron_code_root_directory: tacotron_code_root_directory.as_ref().to_path_buf(),
      maybe_override_python_interpreter: maybe_override_python_interpreter.map(|s| s.to_string()),
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      inference_script_name: inference_script_name.as_ref().to_path_buf(),
      maybe_docker_options,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let root_code_directory = easyenv::get_env_pathbuf_required(
      "TT2_LEGACY_ROOT_DIRECTORY")?;

    let inference_script_name = easyenv::get_env_pathbuf_or_default(
      "TT2_LEGACY_INFERENCE_SCRIPT",
      "vocodes_inference_updated.py");

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
      "TT2_LEGACY_MAYBE_VENV_ACTIVATION_COMMAND");

    let maybe_override_python_interpreter = easyenv::get_env_string_optional(
      "TT2_LEGACY_MAYBE_PYTHON_INTERPRETER");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "TT2_LEGACY_MAYBE_DOCKER_IMAGE_SHA")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    Ok(Self {
      tacotron_code_root_directory: root_code_directory,
      inference_script_name,
      maybe_virtual_env_activation_command,
      maybe_override_python_interpreter,
      maybe_docker_options,
    })
  }

  pub fn execute_inference<P: AsRef<Path>>(
    &self,
    args: InferenceArgs<'_, P>,
  ) -> AnyhowResult<()> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.tacotron_code_root_directory)));

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

    // ===== Begin Python Inference Args =====

    command.push_str(" --synthesizer_checkpoint_path ");
    command.push_str(&path_to_string(args.synthesizer_checkpoint_path));

    command.push_str(" --text_pipeline_type ");
    command.push_str(args.text_pipeline_type);

    match args.vocoder {
      VocoderForInferenceOption::Waveglow { waveglow_vocoder_checkpoint_path } => {
        command.push_str(" --vocoder_type ");
        command.push_str("waveglow");

        command.push_str(" --waveglow_vocoder_checkpoint_path ");
        command.push_str(&path_to_string(waveglow_vocoder_checkpoint_path));
      }
      VocoderForInferenceOption::HifiganSuperres {
        hifigan_vocoder_checkpoint_path,
        hifigan_superres_vocoder_checkpoint_path
      } => {
        command.push_str(" --vocoder_type ");
        command.push_str("hifigan-superres");

        command.push_str(" --hifigan_vocoder_checkpoint_path ");
        command.push_str(&path_to_string(hifigan_vocoder_checkpoint_path));

        command.push_str(" --hifigan_superres_vocoder_checkpoint_path ");
        command.push_str(&path_to_string(hifigan_superres_vocoder_checkpoint_path));
      }
    }

    match args.maybe_mel_multiply_factor {
      None => {}
      Some(MelMultiplyFactor::DefaultMultiplyFactor) => {
        command.push_str(" --maybe_custom_mel_multiply_factor ");
        //command.push_str("True");
      }
      Some(MelMultiplyFactor::CustomMultiplyFactor(factor)) => {
        command.push_str(" --custom_mel_multiply_factor ");
        command.push_str(&factor.to_string());
      }
    }

    command.push_str(" --input_text_filename ");
    command.push_str(&path_to_string(args.input_text_filename));

    command.push_str(" --output_audio_filename ");
    command.push_str(&path_to_string(args.output_audio_filename));

    command.push_str(" --output_spectrogram_filename ");
    command.push_str(&path_to_string(args.output_spectrogram_filename));

    command.push_str(" --output_metadata_filename ");
    command.push_str(&path_to_string(args.output_metadata_filename));

    // ===== End Python Inference Args =====

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let mut p = Popen::create(&command_parts, PopenConfig {
      ..Default::default()
    })?;

    info!("Subprocess PID: {:?}", p.pid());

    let exit_status = p.wait()?;

    info!("Subprocess exit status: {:?}", exit_status);

    Ok(())
  }
}
