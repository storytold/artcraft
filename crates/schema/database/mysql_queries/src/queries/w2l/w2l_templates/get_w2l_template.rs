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

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_optional_bool};

// FIXME: This is the old style of query scoping and shouldn't be copied.
//  The moderator-only fields are good practice, though.

#[derive(Serialize)]
pub struct W2lTemplateRecordForResponse {
  pub template_token: String,
  pub template_type: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,
  pub frame_width: u32,
  pub frame_height: u32,
  pub duration_millis: u32,
  pub maybe_image_object_name: Option<String>,
  pub maybe_video_object_name: Option<String>,
  pub creator_set_visibility: Visibility,
  pub is_public_listing_approved: Option<bool>,
  pub is_locked_from_use: bool,
  pub is_locked_from_user_modification: bool,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_moderator_fields: Option<W2lTemplateModeratorFields>,
}

/// "Moderator-only fields" that we wouldn't want to expose to ordinary users.
/// It's the web endpoint controller's responsibility to clear these for non-mods.
#[derive(Serialize)]
pub struct W2lTemplateModeratorFields {
  pub creator_is_banned: bool,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

#[derive(Serialize)]
pub struct W2lTemplateRecordRaw {
  pub template_token: String,
  pub template_type: String,
  pub creator_user_token: String,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,
  pub creator_is_banned: i8,
  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,
  pub frame_width: i32,
  pub frame_height: i32,
  pub duration_millis: i32,
  pub maybe_public_bucket_preview_image_object_name: Option<String>,
  pub maybe_public_bucket_preview_video_object_name: Option<String>,
  pub creator_set_visibility: String,
  pub is_public_listing_approved: Option<i8>,
  pub is_locked_from_use: i8,
  pub is_locked_from_user_modification: i8,
  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn select_w2l_template_by_token(
  w2l_template_token: &str,
  can_see_deleted: bool,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<W2lTemplateRecordForResponse>> {

  let maybe_record = if can_see_deleted {
    select_including_deleted(w2l_template_token, mysql_pool).await
  } else {
    select_without_deleted(w2l_template_token, mysql_pool).await
  };

  let template : W2lTemplateRecordRaw = match maybe_record {
    Ok(template) => template,
    Err(ref err) => {
      match err {
        sqlx::Error::RowNotFound => {
          warn!("w2l template not found: {:?}", &err);
          return Ok(None);
        },
        _ => {
          warn!("w2l template query error: {:?}", &err);
          return Err(anyhow!("database error"));
        }
      }
    }
  };

  let template_for_response = W2lTemplateRecordForResponse {
    template_token: template.template_token,
    template_type: template.template_type,
    creator_user_token: template.creator_user_token,
    creator_username: template.creator_username,
    creator_display_name: template.creator_display_name,
    creator_gravatar_hash: template.creator_gravatar_hash,
    title: template.title,
    description_markdown: template.description_markdown,
    description_rendered_html: template.description_rendered_html,
    frame_width: if template.frame_width > 0 { template.frame_width as u32 } else { 0 },
    frame_height: if template.frame_height  > 0 { template.frame_height as u32 } else { 0 },
    duration_millis: if template.duration_millis > 0 { template.duration_millis as u32 } else { 0 },
    maybe_image_object_name: template.maybe_public_bucket_preview_image_object_name,
    maybe_video_object_name: template.maybe_public_bucket_preview_video_object_name,
    // NB: Fail open/public with creator_set_visibility since we're already looking at it
    creator_set_visibility: Visibility::from_str(&template.creator_set_visibility)
        .unwrap_or(Visibility::Public),
    is_public_listing_approved: nullable_i8_to_optional_bool(template.is_public_listing_approved),
    is_locked_from_use: i8_to_bool(template.is_locked_from_use),
    is_locked_from_user_modification: i8_to_bool(template.is_locked_from_user_modification),
    created_at: template.created_at,
    updated_at: template.updated_at,
    maybe_moderator_fields: Some(W2lTemplateModeratorFields {
      creator_is_banned: i8_to_bool(template.creator_is_banned),
      creator_ip_address_creation: template.creator_ip_address_creation,
      creator_ip_address_last_update: template.creator_ip_address_last_update,
      user_deleted_at: template.user_deleted_at,
      mod_deleted_at: template.mod_deleted_at,
    }),
  };

  Ok(Some(template_for_response))
}

async fn select_including_deleted(
  w2l_template_token: &str,
  mysql_pool: &MySqlPool
) -> Result<W2lTemplateRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      W2lTemplateRecordRaw,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.is_banned as creator_is_banned,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    w2l.title,
    w2l.description_markdown,
    w2l.description_rendered_html,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.creator_set_visibility,
    w2l.is_public_listing_approved,
    w2l.is_locked_from_use,
    w2l.is_locked_from_user_modification,
    w2l.creator_ip_address_creation,
    w2l.creator_ip_address_last_update,
    w2l.created_at,
    w2l.updated_at,
    w2l.user_deleted_at,
    w2l.mod_deleted_at
FROM w2l_templates as w2l
JOIN users
    ON users.token = w2l.creator_user_token
WHERE w2l.token = ?
        "#,
      w2l_template_token
    )
    .fetch_one(mysql_pool)
    .await // TODO: This will return error if it doesn't exist
}

async fn select_without_deleted(
  w2l_template_token: &str,
  mysql_pool: &MySqlPool
) -> Result<W2lTemplateRecordRaw, sqlx::Error> {
  sqlx::query_as!(
      W2lTemplateRecordRaw,
        r#"
SELECT
    w2l.token as template_token,
    w2l.template_type,
    w2l.creator_user_token,
    users.is_banned as creator_is_banned,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    w2l.title,
    w2l.description_markdown,
    w2l.description_rendered_html,
    w2l.frame_width,
    w2l.frame_height,
    w2l.duration_millis,
    w2l.maybe_public_bucket_preview_image_object_name,
    w2l.maybe_public_bucket_preview_video_object_name,
    w2l.creator_set_visibility,
    w2l.is_public_listing_approved,
    w2l.is_locked_from_use,
    w2l.is_locked_from_user_modification,
    w2l.creator_ip_address_creation,
    w2l.creator_ip_address_last_update,
    w2l.created_at,
    w2l.updated_at,
    w2l.user_deleted_at,
    w2l.mod_deleted_at
FROM w2l_templates as w2l
JOIN users
    ON users.token = w2l.creator_user_token
WHERE
    w2l.token = ?
    AND w2l.user_deleted_at IS NULL
    AND w2l.mod_deleted_at IS NULL
        "#,
      w2l_template_token
    )
    .fetch_one(mysql_pool)
    .await // TODO: This will return error if it doesn't exist
}
