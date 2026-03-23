use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums_db::by_table::user_ratings::rating_value::UserRatingValue;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;

pub struct Args<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub user_token: &'e UserToken,
  pub user_rating_entity: &'e UserRatingEntity,
  pub user_rating_value: UserRatingValue,
  pub ip_address: &'e str,
  pub mysql_executor: E,

  // TODO: Not sure if this works to tell the compiler we need the lifetime annotation.
  //  See: https://doc.rust-lang.org/std/marker/struct.PhantomData.html#unused-lifetime-parameters
  pub phantom: PhantomData<&'c E>,
}

pub async fn upsert_user_rating<'e, 'c : 'e, E>(
  args: Args<'e, 'c, E>,
) -> AnyhowResult<()>
  where E: 'e + Executor<'c, Database = MySql>
{
  let entity_type = args.user_rating_entity.get_entity_type();
  let entity_token = args.user_rating_entity.get_entity_token_str();

  let query = sqlx::query!(
        r#"
INSERT INTO user_ratings
SET
  user_token = ?,
  entity_type = ?,
  entity_token = ?,
  rating_value = ?,
  vote_ip_address = ?,
  version = 1

ON DUPLICATE KEY UPDATE
  rating_value = ?,
  vote_ip_address = ?,
  version = version + 1
        "#,
      // Insert
      args.user_token.as_str(),
      entity_type,
      entity_token,
      args.user_rating_value.to_str(),
      args.ip_address,
      args.user_rating_value.to_str(),
      args.ip_address
    );

  let _r = query.execute(args.mysql_executor).await?;

  Ok(())
}
