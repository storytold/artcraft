use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums_db::by_table::comments::comment_entity_type::CommentEntityType;
use errors::AnyhowResult;
use tokens::tokens::comments::CommentToken;
use tokens::tokens::users::UserToken;

pub struct Comment {
  pub token: CommentToken,

  pub entity_type: CommentEntityType,
  pub entity_token: String,

  pub user_token: UserToken,
  pub username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  pub comment_markdown: String,
  pub comment_rendered_html: String,

  pub mod_fields: CommentForListModFields,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_edited_at: Option<DateTime<Utc>>,
}

pub struct CommentForListModFields {
  pub creator_ip_address: String,
  pub editor_ip_address: String,
  pub maybe_user_deleted_at: Option<DateTime<Utc>>,
  pub maybe_mod_deleted_at: Option<DateTime<Utc>>,
  pub maybe_object_owner_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_comment<'e, 'c, E>(
  comment_token: &'e CommentToken,
  mysql_executor: E
)
  -> AnyhowResult<Option<Comment>>
  where E: 'e + Executor<'c, Database = MySql>
{

  let maybe_results = sqlx::query_as!(
      RawComment,
        r#"
SELECT
    c.token as `token: tokens::tokens::comments::CommentToken`,

    c.entity_type as `entity_type: enums_db::by_table::comments::comment_entity_type::CommentEntityType`,
    c.entity_token,

    c.user_token as `user_token: tokens::tokens::users::UserToken`,
    u.username,
    u.display_name as user_display_name,
    u.email_gravatar_hash as user_gravatar_hash,

    c.comment_markdown,
    c.comment_rendered_html,

    c.creator_ip_address,
    c.editor_ip_address,

    c.created_at,
    c.updated_at,
    c.edited_at,
    c.user_deleted_at,
    c.mod_deleted_at,
    c.object_owner_deleted_at

FROM
    comments AS c
JOIN users AS u
    ON c.user_token = u.token
WHERE
    c.token = ?
        "#,
      comment_token
    )
      .fetch_one(mysql_executor)
      .await;

  match maybe_results {
    Ok(comment) => Ok(Some(Comment {
      token: comment.token,
      entity_type: comment.entity_type,
      entity_token: comment.entity_token,
      user_token: comment.user_token,
      username: comment.username,
      user_display_name: comment.user_display_name,
      user_gravatar_hash: comment.user_gravatar_hash,
      comment_markdown: comment.comment_markdown,
      comment_rendered_html: comment.comment_rendered_html,
      mod_fields: CommentForListModFields {
        creator_ip_address: comment.creator_ip_address,
        editor_ip_address: comment.editor_ip_address,
        maybe_user_deleted_at: comment.user_deleted_at,
        maybe_mod_deleted_at: comment.mod_deleted_at,
        maybe_object_owner_deleted_at: comment.object_owner_deleted_at,
      },
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      maybe_edited_at: None,
    })),
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(None),
      _ => Err(anyhow!("Error querying for IP ban: {:?}", err)),
    }
  }
}

pub struct RawComment {
  pub token: CommentToken,

  pub entity_type: CommentEntityType,
  pub entity_token: String,

  pub user_token: UserToken,
  pub username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  pub comment_markdown: String,
  pub comment_rendered_html: String,

  pub creator_ip_address: String,
  pub editor_ip_address: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub edited_at: Option<DateTime<Utc>>,
  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
  pub object_owner_deleted_at: Option<DateTime<Utc>>,
}
