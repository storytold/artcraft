
/// Trait for arguments that can be turned into a command line string.
pub trait CommandArgs {
  /// Convert to the call signature.
  /// NB: We're not returning a HashMap since positions may need to be respected, or some args may have no values.
  fn to_command_string(&self) -> String;
}
