use std::path::Path;

use crate::command_runner::command_args::CommandArgs;

#[derive(Clone, Debug)]
pub enum FileOrCreate<'a> {
  /// Open the file at the path. Overwrite if it already exists.
  NewFileWithName(&'a Path),

  // Future option(1): new file
  // /// Create a new file (and presumably return the name)
  // NewFile,

  // Future option(2): append-only file
  // Future option(3): already open file handle
}

pub enum StreamRedirection<'a> {
  /// Ignore redirection (inherit defaults)
  None,

  /// If set, write stdout or stderr to this file.
  File(FileOrCreate<'a>),

  /// Redirect to a pipe
  Pipe,
}

pub struct RunAsSubprocessArgs<'a> {
  /// The args for the process we're going to call
  pub args: Box<&'a dyn CommandArgs>,

  /// How to handle stderr redirection.
  pub stderr: StreamRedirection<'a>,

  /// How to handle stdout redirection.
  pub stdout: StreamRedirection<'a>,
}
