use subprocess::ExitStatus;

#[derive(Clone, Eq, PartialEq, Debug)]
pub enum CommandExitStatus {
  /// Process was executed and completed successfully
  Success,

  /// Process was executed and returned a failure (non-zero) exit code
  Failure,

  /// Process executed, but was terminated early for going over the timeout threshold.
  Timeout,

  /// Process was executed, but encountered some unknown other status.
  Unknown,

  /// Process could not be run due to some other condition.
  FailureWithReason { reason: String },
}

impl CommandExitStatus {

  pub fn from_exit_status(exit_status: ExitStatus) -> Self {
    match exit_status {
      ExitStatus::Exited(0) => CommandExitStatus::Success,
      ExitStatus::Exited(1) => CommandExitStatus::Failure,
      ExitStatus::Exited(_other_exit_code) => CommandExitStatus::Failure,
      ExitStatus::Signaled(_) => CommandExitStatus::Unknown,
      ExitStatus::Other(_) => CommandExitStatus::Unknown,
      ExitStatus::Undetermined => CommandExitStatus::Unknown,
    }
  }

  pub fn is_success(&self) -> bool {
    match self {
      CommandExitStatus::Success => true,
      CommandExitStatus::Failure => false,
      CommandExitStatus::Timeout => false,
      CommandExitStatus::Unknown => false,
      CommandExitStatus::FailureWithReason { .. } => false,
    }
  }
}

#[cfg(test)]
mod tests {
  use subprocess::ExitStatus;

  use crate::command_exit_status::CommandExitStatus;

  #[test]
  fn is_success() {
    assert_eq!(CommandExitStatus::Success.is_success(), true);
    assert_eq!(CommandExitStatus::Failure.is_success(), false);
    assert_eq!(CommandExitStatus::Timeout.is_success(), false);
    assert_eq!(CommandExitStatus::Unknown.is_success(), false);
    assert_eq!(CommandExitStatus::FailureWithReason{ reason: "foo".to_string() }.is_success(), false);
  }

  #[test]
  fn from_exit_status() {
    // Success
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Exited(0)), CommandExitStatus::Success);

    // Linux process failure codes
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Exited(1)), CommandExitStatus::Failure);
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Exited(2)), CommandExitStatus::Failure);
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Exited(100)), CommandExitStatus::Failure);
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Exited(255)), CommandExitStatus::Failure);

    // Process signal codes
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Signaled(0)), CommandExitStatus::Unknown);
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Signaled(1)), CommandExitStatus::Unknown);

    // Process signal codes
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Other(0)), CommandExitStatus::Unknown);
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Other(1)), CommandExitStatus::Unknown);

    // Unknown
    assert_eq!(CommandExitStatus::from_exit_status(ExitStatus::Undetermined), CommandExitStatus::Unknown);
  }
}
