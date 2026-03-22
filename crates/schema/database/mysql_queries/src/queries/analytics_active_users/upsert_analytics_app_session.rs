use crate::errors::mysql_error::MysqlError;
use crate::errors::subtypes::upsert_error::UpsertError;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx::mysql::MySqlArguments;
use sqlx::pool::PoolConnection;
use sqlx::query::Query;
use sqlx::MySql;
use tokens::tokens::app_session::AppSessionToken;
use tokens::tokens::users::UserToken;

pub struct UpsertAnalyticsAppSession<'a> {
  pub app_session_token: &'a AppSessionToken,
  // TODO: Swap PaymentsNamespace (artcraft,fakeyou,etc.) for an AnalyticsNamespace enum.
  pub namespace: PaymentsNamespace,
  pub user_token: &'a UserToken,
  pub ip_address: &'a str,
  pub app_version: Option<&'a str>,
  pub os_platform: Option<&'a str>,
  pub os_version: Option<&'a str>,
  pub session_duration_seconds: Option<u64>,
  // Generation counts
  pub total_generation_count: u16,
  pub image_generation_count: u16,
  pub video_generation_count: u16,
  pub object_generation_count: u16,
  pub text_to_image_count: u16,
  pub image_to_image_count: u16,
  pub text_to_video_count: u16,
  pub image_to_video_count: u16,
  pub text_to_object_count: u16,
  pub image_to_object_count: u16,
  pub image_page_prompt_count: u16,
  pub video_page_prompt_count: u16,
  pub edit_page_prompt_count: u16,
  pub stage_page_prompt_count: u16,
  pub object_page_prompt_count: u16,
  pub other_page_prompt_count: u16,
}

impl <'a> UpsertAnalyticsAppSession<'a> {
  fn query(&self) -> Query<MySql, MySqlArguments> {
    sqlx::query!(
        r#"
INSERT INTO analytics_app_sessions
SET
  session_token = ?,
  app_namespace = ?,
  user_token = ?,
  app_version = ?,
  os_platform = ?,
  os_version = ?,
  session_duration_seconds = ?,
  ip_address = ?,
  measurement_count = measurement_count + 1,
  total_generation_count = ?,
  image_generation_count = ?,
  video_generation_count = ?,
  object_generation_count = ?,
  text_to_image_count = ?,
  image_to_image_count = ?,
  text_to_video_count = ?,
  image_to_video_count = ?,
  text_to_object_count = ?,
  image_to_object_count = ?,
  image_page_prompt_count = ?,
  video_page_prompt_count = ?,
  edit_page_prompt_count = ?,
  stage_page_prompt_count = ?,
  object_page_prompt_count = ?,
  other_page_prompt_count = ?,
  first_active_at = NOW(),
  last_active_at = NOW()
ON DUPLICATE KEY UPDATE
  app_namespace = ?,
  user_token = ?,
  app_version = ?,
  os_platform = ?,
  os_version = ?,
  session_duration_seconds = ?,
  ip_address = ?,
  measurement_count = measurement_count + 1,
  total_generation_count = ?,
  image_generation_count = ?,
  video_generation_count = ?,
  object_generation_count = ?,
  text_to_image_count = ?,
  image_to_image_count = ?,
  text_to_video_count = ?,
  image_to_video_count = ?,
  text_to_object_count = ?,
  image_to_object_count = ?,
  image_page_prompt_count = ?,
  video_page_prompt_count = ?,
  edit_page_prompt_count = ?,
  stage_page_prompt_count = ?,
  object_page_prompt_count = ?,
  other_page_prompt_count = ?,
  last_active_at = NOW()
        "#,
      // Insert case
      self.app_session_token.as_str(),
      self.namespace.to_str(),
      self.user_token.as_str(),
      self.app_version,
      self.os_platform,
      self.os_version,
      self.session_duration_seconds,
      self.ip_address,
      self.total_generation_count,
      self.image_generation_count,
      self.video_generation_count,
      self.object_generation_count,
      self.text_to_image_count,
      self.image_to_image_count,
      self.text_to_video_count,
      self.image_to_video_count,
      self.text_to_object_count,
      self.image_to_object_count,
      self.image_page_prompt_count,
      self.video_page_prompt_count,
      self.edit_page_prompt_count,
      self.stage_page_prompt_count,
      self.object_page_prompt_count,
      self.other_page_prompt_count,
      // Update case
      self.namespace.to_str(),
      self.user_token.as_str(),
      self.app_version,
      self.os_platform,
      self.os_version,
      self.session_duration_seconds,
      self.ip_address,
      self.total_generation_count,
      self.image_generation_count,
      self.video_generation_count,
      self.object_generation_count,
      self.text_to_image_count,
      self.image_to_image_count,
      self.text_to_video_count,
      self.image_to_video_count,
      self.text_to_object_count,
      self.image_to_object_count,
      self.image_page_prompt_count,
      self.video_page_prompt_count,
      self.edit_page_prompt_count,
      self.stage_page_prompt_count,
      self.object_page_prompt_count,
      self.other_page_prompt_count,
    )
  }

  pub async fn upsert_with_connection(
    &self,
    mysql_connection: &mut PoolConnection<MySql>
  ) -> Result<(), MysqlError<UpsertError>> {
    let _query_result = self.query()
        .execute(&mut **mysql_connection)
        .await?;
    Ok(())
  }
}
