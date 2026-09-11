use serde::Serialize;

/// Statuses for successful commands.
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum CommandSuccessStatus {
  Success, // 200
}

#[derive(Serialize, Debug)]
pub struct CommandSuccessResponseWrapper<T: Serialize> {
  /// Both "success" and "error" types have a `status` field for the frontend.
  /// We constrain the value types for successes and failures.
  pub status: CommandSuccessStatus,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub success_message: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub payload: Option<T>,
}

/// NB: This is a hack because of `()` (a.k.a. the "unit" type) and `Serialize` trait coherence and overlap.
/// We cannot currently implement a trait for `()` and generic `Serialize` because `()` itself implements
/// `Serialize`. Rust's `"specialization"`, which would let us account for this, is an unstable, nightly-only
/// feature. So instead we manually mark all types other than `()` with `SerializeMarker` as a hack to
/// distinguish the two.
pub trait SerializeMarker : Serialize {}

impl CommandSuccessResponseWrapper<()> {
  pub fn empty_success() -> Self {
    Self::empty()
  }
  pub fn empty() -> Self {
    CommandSuccessResponseWrapper {
      status: CommandSuccessStatus::Success,
      success_message: None,
      payload: None,
    }
  }
}

// NB: () is Serialize! So we can't broadly implement just `T: Serialize`.
impl From<()> for CommandSuccessResponseWrapper<()> {
  fn from(_: ()) -> Self {
    CommandSuccessResponseWrapper {
      status: CommandSuccessStatus::Success,
      success_message: None,
      payload: None,
    }
  }
}

/// NB: Note the `"+ SerializeMarker"` bound here. This is a hack to distinguish between `()` and other types
/// for which we will manually mark as `SerializeMarker`.
impl <T> From<T> for CommandSuccessResponseWrapper<T> where T: Serialize + SerializeMarker {
  fn from(val: T) -> Self {
    CommandSuccessResponseWrapper {
      status: CommandSuccessStatus::Success,
      success_message: None,
      payload: Some(val),
    }
  }
}

impl From<&str> for CommandSuccessResponseWrapper<String> {
  fn from(msg: &str) -> Self {
    CommandSuccessResponseWrapper {
      status: CommandSuccessStatus::Success,
      success_message: Some(msg.to_string()),
      payload: None,
    }
  }
}

#[cfg(test)]
mod tests {

  #[test]
  fn test_empty_tuple_serialize() {
    let response = super::CommandSuccessResponseWrapper::<()>::from(());
    let serialized = serde_json::to_string(&response).unwrap();
    // NB: This tests that the blanket "Serialize" impl doesn't produce a "null payload" field.
    assert_eq!(serialized, r#"{"status":"success"}"#);
  }
}
