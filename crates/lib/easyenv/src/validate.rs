use crate::error::{EnvError, InvalidNameReason};

pub(crate) fn validate_env_name(name: &str) -> Result<(), EnvError> {
  if name.is_empty() {
    return Err(EnvError::InvalidVariableName {
      name: name.to_string(),
      reason: InvalidNameReason::Empty,
    });
  }
  if name.contains('=') {
    return Err(EnvError::InvalidVariableName {
      name: name.to_string(),
      reason: InvalidNameReason::ContainsEquals,
    });
  }
  if name.contains('\0') {
    return Err(EnvError::InvalidVariableName {
      name: name.to_string(),
      reason: InvalidNameReason::ContainsNul,
    });
  }
  Ok(())
}
