// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

use crate::helpers::boolean_converters::nullable_i8_to_bool;

#[derive(Serialize)]
pub struct W2lResultRecordForResponse {
  pub w2l_result_token: String,
  pub maybe_w2l_template_token: Option<String>,
  pub maybe_tts_inference_result_token: Option<String>,

  pub public_bucket_video_path: String,

  pub template_type: Option<String>,
  pub template_title: Option<String>,

  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_template_creator_user_token: Option<String>,
  pub maybe_template_creator_username: Option<String>,
  pub maybe_template_creator_display_name: Option<String>,
  pub maybe_template_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: Visibility,

  pub file_size_bytes: u32,
  pub frame_width: u32,
  pub frame_height: u32,
  pub duration_millis: u32,

  //pub template_is_mod_approved: bool, // converted
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub maybe_moderator_fields: Option<W2lResultModeratorFields>,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize)]
pub struct W2lResultModeratorFields {
  pub template_creator_is_banned: bool,
  pub result_creator_is_banned_if_user: bool,
  pub result_creator_ip_address: String,
  pub result_creator_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Serialize)]
pub struct W2lResultRecordRaw {
  pub w2l_result_token: String, // from field `w2l_results.token`

  pub maybe_w2l_template_token: Option<String>,
  pub maybe_tts_inference_result_token: Option<String>,

  pub public_bucket_video_path: String,

  pub template_type: Option<String>,
  pub template_title: Option<String>, // from field `w2l_templates.title`

  pub maybe_creator_is_banned: Option<i8>,
  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_template_creator_is_banned: Option<i8>,
  pub maybe_template_creator_user_token: Option<String>,
  pub maybe_template_creator_username: Option<String>,
  pub maybe_template_creator_display_name: Option<String>,
  pub maybe_template_creator_gravatar_hash: Option<String>,

  pub creator_set_visibility: String,

  pub file_size_bytes: i32,
  pub frame_width: i32,
  pub frame_height: i32,
  pub duration_millis: i32,

  //pub template_is_mod_approved: i8, // needs convert
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub creator_ip_address: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn select_w2l_result_by_token(
  w2l_result_token: &str,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<W2lResultRecordForResponse>> {

  let maybe_record = if can_see_deleted {
    select_including_deleted(w2l_result_token, mysql_pool).await
  } else {
    select_without_deleted(w2l_result_token, mysql_pool).await
  };

  let ir : W2lResultRecordRaw = match maybe_record {
    Ok(inference_result) => inference_result,
    Err(ref err) => {
      match err {
        sqlx::Error::RowNotFound => {
          warn!("w2l result not found: {:?}", &err);
          return Ok(None);
        },
        _ => {
          warn!("w2l result query error: {:?}", &err);
          return Err(anyhow!("database error"));
        }
      }
    }
  };

  let ir_for_response = W2lResultRecordForResponse {
    w2l_result_token: ir.w2l_result_token,
    maybe_w2l_template_token: ir.maybe_w2l_template_token,
    maybe_tts_inference_result_token: ir.maybe_tts_inference_result_token,

    public_bucket_video_path: ir.public_bucket_video_path,

    template_type: ir.template_type,
    template_title: ir.template_title,

    maybe_creator_user_token: ir.maybe_creator_user_token,
    maybe_creator_username: ir.maybe_creator_username,
    maybe_creator_display_name: ir.maybe_creator_display_name,
    maybe_creator_gravatar_hash: ir.maybe_creator_gravatar_hash,

    maybe_template_creator_user_token: ir.maybe_template_creator_user_token,
    maybe_template_creator_username: ir.maybe_template_creator_username,
    maybe_template_creator_display_name: ir.maybe_template_creator_display_name,
    maybe_template_creator_gravatar_hash: ir.maybe_template_creator_gravatar_hash,

    // NB: Fail open/public since we're already looking at it
    creator_set_visibility: Visibility::from_str(&ir.creator_set_visibility)
        .unwrap_or(Visibility::Public),

    //template_is_mod_approved: if ir.template_is_mod_approved == 0 { false } else { true },

    file_size_bytes: if ir.file_size_bytes > 0 { ir.file_size_bytes as u32 } else { 0 },
    frame_width: if ir.frame_width > 0 { ir.frame_width as u32 } else { 0 },
    frame_height: if ir.frame_height  > 0 { ir.frame_height as u32 } else { 0 },
    duration_millis: if ir.duration_millis > 0 { ir.duration_millis as u32 } else { 0 },

    created_at: ir.created_at,
    updated_at: ir.updated_at,

    maybe_moderator_fields: Some(W2lResultModeratorFields {
      template_creator_is_banned:
        nullable_i8_to_bool(ir.maybe_template_creator_is_banned, false),
      result_creator_is_banned_if_user:
        nullable_i8_to_bool(ir.maybe_creator_is_banned, false),
      result_creator_ip_address: ir.creator_ip_address,
      result_creator_deleted_at: ir.user_deleted_at,
      mod_deleted_at: ir.mod_deleted_at,
    }),
  };

  Ok(Some(ir_for_response))
}

async fn select_including_deleted(
  w2l_result_token: &str,
  mysql_pool: &MySqlPool
) -> Result<W2lResultRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      W2lResultRecordRaw,
        r#"
SELECT
    w2l_results.token as w2l_result_token,
    w2l_results.maybe_tts_inference_result_token,

    w2l_results.public_bucket_video_path,

    w2l_templates.token as maybe_w2l_template_token,
    w2l_templates.template_type,
    w2l_templates.title as template_title,

    users.token as maybe_creator_user_token,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,
    users.is_banned as maybe_creator_is_banned,

    template_users.token as maybe_template_creator_user_token,
    template_users.username as maybe_template_creator_username,
    template_users.display_name as maybe_template_creator_display_name,
    template_users.email_gravatar_hash as maybe_template_creator_gravatar_hash,
    template_users.is_banned as maybe_template_creator_is_banned,

    w2l_results.creator_set_visibility,

    w2l_results.file_size_bytes,
    w2l_results.frame_width,
    w2l_results.frame_height,
    w2l_results.duration_millis,
    w2l_results.created_at,
    w2l_results.updated_at,

    w2l_results.creator_ip_address,
    w2l_results.user_deleted_at,
    w2l_results.mod_deleted_at

FROM w2l_results
LEFT OUTER JOIN w2l_templates
    ON w2l_results.maybe_w2l_template_token = w2l_templates.token
LEFT OUTER JOIN users
    ON w2l_results.maybe_creator_user_token = users.token
LEFT OUTER JOIN users as template_users
    ON w2l_templates.creator_user_token = template_users.token
WHERE
    w2l_results.token = ?
        "#,
      w2l_result_token
    )
    .fetch_one(mysql_pool)
    .await // TODO: This will return error if it doesn't exist
}

async fn select_without_deleted(
  w2l_result_token: &str,
  mysql_pool: &MySqlPool
) -> Result<W2lResultRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      W2lResultRecordRaw,
        r#"
SELECT
    w2l_results.token as w2l_result_token,
    w2l_results.maybe_tts_inference_result_token,

    w2l_results.public_bucket_video_path,

    w2l_templates.token as maybe_w2l_template_token,
    w2l_templates.template_type,
    w2l_templates.title as template_title,

    users.token as maybe_creator_user_token,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,
    users.is_banned as maybe_creator_is_banned,

    template_users.token as maybe_template_creator_user_token,
    template_users.username as maybe_template_creator_username,
    template_users.display_name as maybe_template_creator_display_name,
    template_users.email_gravatar_hash as maybe_template_creator_gravatar_hash,
    template_users.is_banned as maybe_template_creator_is_banned,

    w2l_results.creator_set_visibility,

    w2l_results.file_size_bytes,
    w2l_results.frame_width,
    w2l_results.frame_height,
    w2l_results.duration_millis,
    w2l_results.created_at,
    w2l_results.updated_at,

    w2l_results.creator_ip_address,
    w2l_results.user_deleted_at,
    w2l_results.mod_deleted_at

FROM w2l_results
LEFT OUTER JOIN w2l_templates
    ON w2l_results.maybe_w2l_template_token = w2l_templates.token
LEFT OUTER JOIN users
    ON w2l_results.maybe_creator_user_token = users.token
LEFT OUTER JOIN users as template_users
    ON w2l_templates.creator_user_token = template_users.token
WHERE
    w2l_results.token = ?
    AND w2l_results.user_deleted_at IS NULL
    AND w2l_results.mod_deleted_at IS NULL
        "#,
      w2l_result_token
    )
    .fetch_one(mysql_pool)
    .await // TODO: This will return error if it doesn't exist
}
