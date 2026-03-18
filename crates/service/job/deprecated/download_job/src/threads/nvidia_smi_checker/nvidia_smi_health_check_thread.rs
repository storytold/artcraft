use std::thread;
use std::time::Duration;

use log::{error, warn};
use log::debug;
use subprocess::{ExitStatus, Popen, PopenConfig, Redirection};

use crate::threads::nvidia_smi_checker::nvidia_smi_health_check_status::NvidiaSmiHealthCheckStatus;

pub async fn nvidia_smi_health_check_thread(
  health_check_status: NvidiaSmiHealthCheckStatus,
  check_duration: Duration,
) {
  let mut consecutive_mystery_status_count = 0;

  loop {
    thread::sleep(check_duration);

    debug!("Checking nvidia-smi health...");

    let exit_status = run_nvidia_smi().await;

    let mut unhealthy_exit = match exit_status {
      ExitStatus::Exited(0) => {
        // Healthy exit
        consecutive_mystery_status_count = 0;
        false
      },
      ExitStatus::Signaled(_) | ExitStatus::Other(_) | ExitStatus::Undetermined => {
        // Mysterious exit codes (they might resolve)
        consecutive_mystery_status_count += 1;
        false
      }
      // Unhealthy exits
      ExitStatus::Exited(1) => true,
      ExitStatus::Exited(_other_exit_code) => true,
    };

    if consecutive_mystery_status_count > 5 {
      unhealthy_exit = true;
    }

    if unhealthy_exit {
      health_check_status.notify_gpu_missing();
    }
  }

  error!("Should never happen: Nvidia SMI Health Checker Exits");
}

async fn run_nvidia_smi() ->ExitStatus {
  let command_parts = [
    "bash",
    "-c",
    "nvidia-smi",
  ];

  let mut config = PopenConfig::default();

  // NB: We don't want this going to the rust process' stdout (the default Redirect::None),
  // so we pipe it and ignore it.
  config.stdout = Redirection::Pipe;
  config.stderr = Redirection::Pipe;

  let mut handle = match Popen::create(&command_parts, config) {
    Ok(handle) => handle,
    Err(err) => {
      warn!("Error with running nvidia-smi: {:?}", err);
      return ExitStatus::Undetermined
    },
  };

  debug!("nvidia-smi health check pid: {:?}", handle.pid());

  let exit_status = match handle.wait() {
    Ok(exit_status) => exit_status,
    Err(err) => {
      warn!("Error with waiting for nvidia-smi: {:?}", err);
      ExitStatus::Undetermined
    }
  };

  debug!("nvidia-smi health check exit status: {:?}", exit_status);

  exit_status
}
