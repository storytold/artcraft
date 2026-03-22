use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

pub struct EditW2lResultArgs<'a> {
  pub w2l_result_token: &'a str,
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

pub async fn edit_w2l_result(args: EditW2lResultArgs<'_>) -> AnyhowResult<()> {
  let query_result = match args.role_dependent_fields {
    //
    // Creator
    CreatorOrModFields::CreatorFields { creator_ip_address } => {

      // TODO: Don't update the original IP address. Create a new field.
      // We need to store the IP address details.
      sqlx::query!(
        r#"
UPDATE w2l_results
SET
    creator_set_visibility = ?,
    creator_ip_address = ?
WHERE token = ?
LIMIT 1
        "#,
      args.creator_set_visibility.to_str(),
      creator_ip_address,
      args.w2l_result_token,
    )
          .execute(args.mysql_pool)
          .await
    },
    //
    // Moderator
    CreatorOrModFields::ModFields { mod_user_token } => {

      // We need to store the moderator details.
      sqlx::query!(
        r#"
UPDATE w2l_results
SET
    creator_set_visibility = ?,
    maybe_mod_user_token = ?
WHERE token = ?
LIMIT 1
        "#,
      args.creator_set_visibility.to_str(),
      mod_user_token,
      args.w2l_result_token,
    )
          .execute(args.mysql_pool)
          .await
    },
  };


  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("Update W2L result DB error: {:?}", err)),
  }
}
