use std::collections::HashSet;

use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use crate::omni_api::job_status::omni_api_job_status_payload::OmniApiJobStatusPayload;

/// Query params for `GET /v1/omni_api/job_status/batch`.
#[derive(Deserialize, ToSchema, IntoParams)]
pub struct OmniApiBatchGetJobStatusQueryParams {
  /// A grab bag of job tokens. Each token family generally has its own prefix,
  /// so a flat set is sufficient.
  ///
  /// NB: handlers parse this with `actix_web_lab`'s `Query<T>` because the
  /// default actix-web `Query<T>` doesn't decode repeated/sequence params yet.
  /// See https://github.com/actix/actix-web/issues/1301
  pub tokens: HashSet<String>,
}

/// Success body for `GET /v1/omni_api/job_status/batch`.
#[derive(Serialize, Deserialize, ToSchema)]
pub struct OmniApiBatchGetJobStatusSuccessResponse {
  pub success: bool,
  pub job_states: Vec<OmniApiJobStatusPayload>,
}
