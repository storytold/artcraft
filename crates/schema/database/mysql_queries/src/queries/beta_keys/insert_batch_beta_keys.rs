use anyhow::anyhow;
use log::error;
use sqlx::{MySqlPool, QueryBuilder};

use composite_identifiers::by_table::batch_generations::batch_generation_entity::BatchGenerationEntity;
use enums_db::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use errors::AnyhowResult;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::beta_keys::BetaKeyToken;
use tokens::tokens::users::UserToken;

pub struct BatchEntry {
  pub batch_token: BatchGenerationToken,
  pub entity: BatchGenerationEntity,
}

pub struct InsertBatchArgs<'a> {
  pub product: BetaKeyProduct,
  pub creator_user_token: &'a UserToken,
  pub maybe_referrer_user_token: Option<&'a UserToken>,
  pub maybe_note: Option<&'a str>,
  pub beta_keys: &'a Vec<String>,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_batch_beta_keys<'a, 'b>(args: InsertBatchArgs<'a>) -> AnyhowResult<()> {

  let mut query_builder = QueryBuilder::new(r#"
    INSERT INTO beta_keys (
      token,
      product,
      key_value,
      creator_user_token,
      maybe_referrer_user_token,
      maybe_notes
    ) VALUES
  "#);

  for (i, beta_key) in args.beta_keys.iter().enumerate() {
    let token = BetaKeyToken::generate();

    query_builder.push("(");

    query_builder.push_bind(token.to_string());
    query_builder.push(",");

    query_builder.push_bind(args.product.to_str());
    query_builder.push(",");

    query_builder.push_bind(beta_key);
    query_builder.push(",");

    query_builder.push_bind(args.creator_user_token.as_str());
    query_builder.push(",");

    query_builder.push_bind(args.maybe_referrer_user_token.map(|t| t.as_str()));
    query_builder.push(",");

    query_builder.push_bind(args.maybe_note);

    query_builder.push(")");

    if i < args.beta_keys.len() - 1 {
      query_builder.push(",");
    }
  }

  let query = query_builder.build();

  let query_result  = query.execute(args.mysql_pool).await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => {
      error!("Error with batch generation query: {:?}", &err);
      Err(anyhow!("model category creation error: {:?}", &err))
    },
  }
}

// #[ignore]
// #[cfg(test)]
// mod tests {
//   use sqlx::mysql::MySqlPoolOptions;
//
//   use composite_identifiers::by_table::batch_generations::batch_generation_entity::BatchGenerationEntity;
//   use crate::config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
//   use tokens::tokens::media_files::MediaFileToken;
//
//   use crate::queries::batch_generations::insert_batch_generation_records::{insert_batch_generation_records, InsertBatchArgs};
//
//   async fn setup() -> sqlx::Pool<sqlx::MySql> {
//     MySqlPoolOptions::new()
//         .max_connections(3)
//         .connect(&DEFAULT_MYSQL_CONNECTION_STRING).await
//         .unwrap()
//   }
//
//   #[ignore]
//   #[tokio::test]
//   async fn test() {
//     let pool = setup().await;
//
//     let mut transaction = pool.begin().await.unwrap();
//
//     let entries = vec![
//       BatchGenerationEntity::MediaFile(MediaFileToken::new_from_str("media_foo")),
//       BatchGenerationEntity::MediaFile(MediaFileToken::new_from_str("media_bar")),
//       BatchGenerationEntity::MediaFile(MediaFileToken::new_from_str("media_baz")),
//     ];
//
//     let r = insert_batch_generation_records(InsertBatchArgs {
//       entries,
//       maybe_existing_batch_token: None,
//       transaction: &mut transaction,
//     }).await;
//
//     transaction.commit().await.unwrap();
//   }
// }