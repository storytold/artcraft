use std::path::PathBuf;

/// A single executable script or a string to run as a shell command.
#[derive(Clone)]
pub enum ExecutableOrShellCommand {
  /// A system path to an executable.
  /// Eg. `inference.py`
  Executable(PathBuf),

  /// A string to run as `sh` shell command.
  /// Eg. `python3 inference.py`
  ShShellCommand(String),

  /// A string to run as a `bash` shell command.
  /// Eg. `python3 inference.py`
  BashShellCommand(String),
}
