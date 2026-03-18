use anyhow::anyhow;
use sqlx::MySqlPool;

use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;

use crate::builders::RequiredOption;

pub struct TtsInferenceJobInsertBuilder {
  // ========== Required ==========
  // TODO: The builder should generate this
  //  This requires moving token code into the shared db crate.
  job_token: RequiredOption<String>,
  uuid_idempotency_token: RequiredOption<String>,
  model_token: RequiredOption<String>,
  raw_inference_text: RequiredOption<String>,

  // ========== Conditionally optional ==========
  creator_ip_address: RequiredOption<String>,

  // ========== Optional ==========
  maybe_creator_user_token: Option<String>,
  creator_set_visibility: Option<String>,
  is_from_api: bool,
  is_for_twitch: bool,
  is_debug_request: bool, // Route the request to a special host with this flag
  priority_level: u8, // Priority is 0 by default and optionally increases

  /// Premium feature controlling TTS max duration.
  ///  - Negative values imply unlimited duration
  ///  - 0 is "use default" (typically 12 seconds)
  ///  - Positive values are that value in seconds up to some max.
  max_duration_seconds: i32,
}

impl TtsInferenceJobInsertBuilder {

  /// Everything needs to be manually specified
  pub fn new_for_fakeyou_request() -> Self {
    Self {
      job_token: None,
      uuid_idempotency_token: None,
      model_token: None,
      raw_inference_text: None,
      creator_ip_address: None,
      maybe_creator_user_token: None,
      creator_set_visibility: None,
      is_from_api: false,
      is_for_twitch: false,
      is_debug_request: false,
      priority_level: 0,
      max_duration_seconds: 0,
    }
  }

  /// We can default a lot of the fields to "empty"-ish values
  pub fn new_for_internal_tts() -> Self {
    let idempotency_token = generate_random_uuid();
    Self {
      job_token: None,
      model_token: None,
      raw_inference_text: None,
      // Defaults
      uuid_idempotency_token: Some(idempotency_token),
      maybe_creator_user_token: None,
      creator_ip_address: Some("127.0.0.1".to_string()),
      // hidden | public | ...
      creator_set_visibility: Some("hidden".to_string()),
      is_from_api: false,
      is_for_twitch: false,
      is_debug_request: false,
      priority_level: 0,
      max_duration_seconds: 0,
    }
  }

  pub fn set_job_token(mut self, value: &str) -> Self {
    self.job_token = Some(value.to_string());
    self
  }

  pub fn set_model_token(mut self, value: &str) -> Self {
    self.model_token = Some(value.to_string());
    self
  }

  pub fn set_raw_inference_text(mut self, value: &str) -> Self {
    self.raw_inference_text = Some(value.to_string());
    self
  }

  pub fn set_uuid_idempotency_token(mut self, value: &str) -> Self {
    self.uuid_idempotency_token = Some(value.to_string());
    self
  }

  pub fn set_creator_ip_address(mut self, value: &str) -> Self {
    self.creator_ip_address = Some(value.to_string());
    self
  }

  pub fn set_maybe_creator_user_token(mut self, value: Option<&str>) -> Self {
    self.maybe_creator_user_token = value.map(|s| s.to_string());
    self
  }

  pub fn set_creator_set_visibility(mut self, value: &str) -> Self {
    self.creator_set_visibility = Some(value.to_string());
    self
  }

  pub fn set_is_from_api(mut self, value: bool) -> Self {
    self.is_from_api = value;
    self
  }

  pub fn set_is_for_twitch(mut self, value: bool) -> Self {
    self.is_for_twitch = value;
    self
  }

  pub fn set_is_debug_request(mut self, value: bool) -> Self {
    self.is_debug_request = value;
    self
  }

  pub fn set_priority_level(mut self, value: u8) -> Self {
    self.priority_level = value;
    self
  }

  pub fn set_max_duration_seconds(mut self, value: i32) -> Self {
    self.max_duration_seconds = value;
    self
  }

  pub async fn insert(&mut self, mysql_pool: &MySqlPool) -> AnyhowResult<()> {
    // TODO: These should be custom error types with a custom macro to make this easy.
    let job_token = self.job_token
        .clone()
        .ok_or(anyhow!("no job_token"))?;

    let uuid_idempotency_token = self.uuid_idempotency_token
        .clone()
        .ok_or(anyhow!("no uuid_idempotency_token"))?;

    let model_token = self.model_token
        .clone()
        .ok_or(anyhow!("no model_token"))?;

    let raw_inference_text = self.raw_inference_text
        .clone()
        .ok_or(anyhow!("no raw_inference_text"))?;

    let creator_ip_address = self.creator_ip_address
        .clone()
        .ok_or(anyhow!("no creator_ip_address"))?;

    let creator_set_visibility = self.creator_set_visibility
        .clone()
        .ok_or(anyhow!("no creator_set_visibility"))?;

    let query = sqlx::query!(
        r#"
INSERT INTO tts_inference_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,
  model_token = ?,
  raw_inference_text = ?,
  maybe_creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,
  is_from_api = ?,
  is_for_twitch = ?,
  is_debug_request = ?,
  priority_level = ?,
  max_duration_seconds = ?,
  status = "pending"
        "#,
      job_token,
      uuid_idempotency_token,
      model_token,
      raw_inference_text,
      self.maybe_creator_user_token.clone(),
      creator_ip_address,
      creator_set_visibility,
      self.is_from_api,
      self.is_for_twitch,
      self.is_debug_request,
      self.priority_level,
      self.max_duration_seconds,
    );

    let query_result = query.execute(mysql_pool)
        .await;

    let _record_id = match query_result {
      Ok(res) => {
        res.last_insert_id()
      },
      Err(err) => {
        return Err(anyhow!("MySQL tts_inference_job record insert error: {:?}", err));
      }
    };

    Ok(())
  }
}
