use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

pub struct EditTtsResultArgs<'a> {
  pub tts_result_token: &'a str,
  pub creator_set_visibility: Visibility,
  pub role_dependent_fields: CreatorOrModFields<'a>,

  pub mysql_pool: &'a MySqlPool,
}

pub enum CreatorOrModFields<'a> {
  CreatorFields {
    creator_ip_address: &'a str,
  },
  ModFields {
    mod_user_token: &'a str,
  }
}

pub async fn edit_tts_result(args: EditTtsResultArgs<'_>) -> AnyhowResult<()> {

  let query_result = match args.role_dependent_fields {
    //
    // For creator users
    CreatorOrModFields::CreatorFields { creator_ip_address } => {
      // TODO: Don't update the original IP address. Create a new field.
      sqlx::query!(
        r#"
UPDATE tts_results
SET
    creator_set_visibility = ?,
    creator_ip_address = ?
WHERE token = ?
LIMIT 1
        "#,
        args.creator_set_visibility.to_str(),
        creator_ip_address,
        args.tts_result_token,
      )
          .execute(args.mysql_pool)
          .await
    },

    //
    // For moderators
    CreatorOrModFields::ModFields { mod_user_token } => {
      sqlx::query!(
        r#"
UPDATE tts_results
SET
    creator_set_visibility = ?,
    maybe_mod_user_token = ?
WHERE token = ?
LIMIT 1
        "#,
        args.creator_set_visibility.to_str(),
        mod_user_token,
        args.tts_result_token,
      )
          .execute(args.mysql_pool)
          .await
    },
  };

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("Update TTS result DB error: {:?}", err)),
  }
}
