use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

pub struct EditW2lTemplateArgs<'a> {
  pub w2l_template_token: &'a str,

  pub title: Option<&'a str>,
  pub description_markdown: Option<&'a str>,
  pub description_rendered_html: Option<&'a str>,
  pub creator_set_visibility: Visibility,

  pub role_dependent_fields: CreatorOrModFields<'a>,

  pub mysql_pool: &'a MySqlPool,
}

pub enum CreatorOrModFields<'a> {
  CreatorFields {
    creator_ip_address: &'a str,
  },
  ModFields(ModFields<'a>)
}

pub struct ModFields<'a> {
  pub mod_user_token: &'a str,
  pub is_public_listing_approved: bool,
  pub is_locked_from_user_modification: bool,
  pub is_locked_from_use: bool,
  pub maybe_mod_comments: Option<&'a str>,
}

pub async fn edit_w2l_template(args: EditW2lTemplateArgs<'_>) -> AnyhowResult<()> {

  let query_results = match args.role_dependent_fields {
    CreatorOrModFields::CreatorFields { creator_ip_address } => {
      // We need to store the IP address details.
      sqlx::query!(
        r#"
UPDATE w2l_templates
SET
    title = ?,
    description_markdown = ?,
    description_rendered_html = ?,
    creator_set_visibility = ?,
    creator_ip_address_last_update = ?,
    version = version + 1
WHERE token = ?
LIMIT 1
        "#,
        args.title,
        args.description_markdown,
        args.description_rendered_html,
        args.creator_set_visibility.to_str(),
        creator_ip_address,
        args.w2l_template_token,
      )
        .execute(args.mysql_pool)
        .await
    },
    CreatorOrModFields::ModFields(ref mod_fields) => {
      sqlx::query!(
        r#"
UPDATE w2l_templates
SET
    title = ?,
    description_markdown = ?,
    description_rendered_html = ?,
    creator_set_visibility = ?,
    maybe_mod_user_token = ?,
    version = version + 1
WHERE token = ?
LIMIT 1
        "#,
        args.title,
        args.description_markdown,
        args.description_rendered_html,
        args.creator_set_visibility.to_str(),
        mod_fields.mod_user_token,
        args.w2l_template_token,
      )
        .execute(args.mysql_pool)
        .await
        .map_err(|err| {
          anyhow!("update W2L template mod details (first query) error: {:?}", err)
        })?;

      // TODO: This is lazy and suboptimal af to UPDATE again.
      //  The reason we're doing this is because `sqlx` only does static type checking of queries
      //  with string literals. It does not support dynamic query building, thus the PREDICATES
      //  MUST BE HELD CONSTANT (at least in type signature). :(
      sqlx::query!(
        r#"
UPDATE w2l_templates
SET
    is_public_listing_approved = ?,
    is_locked_from_user_modification = ?,
    is_locked_from_use = ?,
    maybe_mod_comments = ?,
    maybe_mod_user_token = ?,
    version = version + 1
WHERE token = ?
LIMIT 1
        "#,
        mod_fields.is_public_listing_approved,
        mod_fields.is_locked_from_user_modification,
        mod_fields.is_locked_from_use,
        mod_fields.maybe_mod_comments,
        mod_fields.mod_user_token,
        args.w2l_template_token
      )
        .execute(args.mysql_pool)
        .await
    },
  };

  match query_results {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("Update W2L template DB error: {:?}", err))
  }
}
