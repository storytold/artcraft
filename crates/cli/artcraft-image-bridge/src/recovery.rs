use crate::ImportRecord;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct RecoveryReport {
  pub request_id: Uuid,
  pub assessment: &'static str,
  pub explanation: &'static str,
  pub next_step: &'static str,
  pub maybe_record: Option<ImportRecord>,
  pub remote_checked: bool,
  pub warning: &'static str,
}

impl RecoveryReport {
  pub fn from_record(request_id: Uuid, maybe_record: Option<ImportRecord>) -> Self {
    let (assessment, explanation, next_step) = match maybe_record.as_ref() {
      None => (
        "no_local_record",
        "No record exists for this ID in the configured state directory. This does not prove no remote upload occurred.",
        "Confirm the original request ID and intact original state directory. If a local credential error occurred before claiming this request, repair that error and reuse the same ID. Do not infer permission to upload from absence alone.",
      ),
      Some(record) => match (
        record.backend.as_str(),
        record.status.as_str(),
        record.maybe_media_file_token.as_deref(),
      ) {
        ("artcraft_live", "upload_outcome_unknown", None) => (
          "needs_manual_reconciliation",
          "A claim was saved before the upload call. No accepted asset token was saved. The upload may not have started, may still be in progress, or may have reached ArtCraft without a recorded response.",
          "Preserve the request and state. Check ArtCraft for the intended asset and reconcile with the service. Do not delete the claim, switch state directories, or invent a new ID to retry. A missing library entry is not proof of failure.",
        ),
        ("artcraft_live", "uploaded_metadata_pending", Some(token)) if valid_token(token) => (
          "accepted_metadata_pending",
          "An asset token was returned and saved, but metadata verification has not completed in the retained record.",
          "Inspect the saved token in ArtCraft. If the original image and valid credentials remain available, repeating the exact import request with the same ID, hash, and state can check metadata without another upload.",
        ),
        ("artcraft_live", "uploaded_metadata_verified_link_access_not_private", Some(token)) if valid_token(token) => (
          "metadata_previously_verified",
          "The saved record reports matching token, image class, and visibility metadata. This report has not refreshed ArtCraft or compared remote image bytes.",
          "Check the asset visually in ArtCraft if needed. No repeat upload is needed. Treat known direct links as potentially accessible without sign-in.",
        ),
        ("local_mock_only", "mock_verified", None) => (
          "mock_bytes_verified",
          "The saved mock copy matches its recorded hash. This is local evidence only; no ArtCraft upload is represented.",
          "No recovery is needed for this mock copy. A live import is a separate, explicitly authorized operation.",
        ),
        ("local_mock_only", "pending", None) => (
          "mock_incomplete",
          "The offline mock operation did not record completion. This record does not describe a remote upload.",
          "In mock mode, repeat the same request with the original image and hash to finish the local copy.",
        ),
        _ => (
          "unrecognized_record",
          "The record's backend, status, or token combination is not recognized by this version. No success or safe retry can be inferred.",
          "Preserve the record and investigate its producer/version before taking any upload action. Do not reset it.",
        ),
      },
    };
    Self {
      request_id,
      assessment,
      explanation,
      next_step,
      maybe_record,
      remote_checked: false,
      warning: "Read-only snapshot of local evidence, not authorization to retry. Other clients may change state after this read. Duplicate-upload protection depends on retaining the original state. No timestamp, account ownership, or remote byte verification is established by this report.",
    }
  }
}

fn valid_token(token: &str) -> bool {
  token.starts_with("m_")
    && token.len() > 2
    && token
      .bytes()
      .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_')
}
