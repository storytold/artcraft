use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;
use artcraft_api_defs::jobs::list_session_jobs::{ListSessionJobsSuccessResponse, LIST_SESSION_JOBS_URL_PATH};
use enums::common::job_status_plus::JobStatusPlus;
use std::collections::HashSet;

#[derive(Clone)]
pub enum States {
  All,
  Include(HashSet<JobStatusPlus>),
  Exclude(HashSet<JobStatusPlus>),
}

pub async fn list_session_jobs(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  job_states: States,
) -> Result<ListSessionJobsSuccessResponse, StorytellerError> {
  
  let url = match job_states {
    States::All => 
      LIST_SESSION_JOBS_URL_PATH.to_string(),
    States::Include(states) => 
      format!("{}?include_states={}", LIST_SESSION_JOBS_URL_PATH, states_string(&states)),
    States::Exclude(states) => 
      format!("{}?exclude_states={}", LIST_SESSION_JOBS_URL_PATH, states_string(&states)),
  };
  
  Ok(basic_json_get_request(
    api_host,
    &url,
    maybe_creds,
  ).await?)
}

fn states_string(states: &HashSet<JobStatusPlus>) -> String {
  states.iter()
    .map(|state| state.to_str())
    .collect::<Vec<_>>()
    .join(",")
}