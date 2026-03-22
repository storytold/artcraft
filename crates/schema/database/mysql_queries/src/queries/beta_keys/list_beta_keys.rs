use chrono::{DateTime, Utc};
use log::info;
use sqlx::{Execute, FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use errors::AnyhowResult;
use tokens::tokens::beta_keys::BetaKeyToken;
use tokens::tokens::users::UserToken;
use crate::helpers::boolean_converters::i8_to_bool;

pub struct BetaKeyListPage {
  pub records: Vec<BetaKeyListItem>,

  pub sort_ascending: bool,

  pub current_page: usize,
  pub total_page_count: usize,
}

pub struct BetaKeyListItem {
  pub token: BetaKeyToken,

  pub product: BetaKeyProduct,
  pub key_value: String,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub maybe_referrer_user_token: Option<UserToken>,
  pub maybe_referrer_username: Option<String>,
  pub maybe_referrer_display_name: Option<String>,
  pub maybe_referrer_gravatar_hash: Option<String>,

  pub maybe_redeemer_user_token: Option<UserToken>,
  pub maybe_redeemer_username: Option<String>,
  pub maybe_redeemer_display_name: Option<String>,
  pub maybe_redeemer_gravatar_hash: Option<String>,

  pub is_distributed: bool,
  pub maybe_notes: Option<String>,

  pub created_at: DateTime<Utc>,
  pub maybe_redeemed_at: Option<DateTime<Utc>>,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum FilterToKeys {
  All,
  Redeemed,
  Unredeemed,
}

pub struct ListBetaKeysArgs<'a> {
  pub filter_to_referrer_user_token: Option<&'a UserToken>,
  pub filter_to_keys: FilterToKeys,

  pub page_size: usize,
  pub page_index: usize,
  pub sort_ascending: bool,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_beta_keys(args: ListBetaKeysArgs<'_>) -> AnyhowResult<BetaKeyListPage> {
  /// Let's figure out how many results we could have returned total
  let count_fields = select_total_count_field();

  let mut count_query_builder = query_builder(
    count_fields,
    args.filter_to_referrer_user_token,
    args.filter_to_keys,
    false,
    args.page_index,
    args.page_size,
    args.sort_ascending,
  );

  info!("count query: {:?}", count_query_builder.sql());

  let row_count_query = count_query_builder.build_query_scalar::<i64>();
  let row_count_result = row_count_query.fetch_one(args.mysql_pool).await?;

  let number_of_pages = (row_count_result / args.page_size as i64) as usize;

  /// Now fetch the actual results with all the fields
  let result_fields = select_result_fields();

  let mut query = query_builder(
    result_fields,
    args.filter_to_referrer_user_token,
    args.filter_to_keys,
    true,
    args.page_index,
    args.page_size,
    args.sort_ascending,
  );

  info!("actual query: {:?}", query.sql());

  let query = query.build_query_as::<BetaKeyListItemInternal>();
  let results = query.fetch_all(args.mysql_pool).await?;

  let results = results.into_iter()
      .map(|record| {
        BetaKeyListItem {
          token: record.token,
          product: record.product,
          key_value: record.key_value,
          creator_user_token: record.creator_user_token,
          creator_username: record.creator_username,
          creator_display_name: record.creator_display_name,
          creator_gravatar_hash: record.creator_gravatar_hash,
          maybe_referrer_user_token: record.maybe_referrer_user_token,
          maybe_referrer_username: record.maybe_referrer_username,
          maybe_referrer_display_name: record.maybe_referrer_display_name,
          maybe_referrer_gravatar_hash: record.maybe_referrer_gravatar_hash,
          maybe_redeemer_user_token: record.maybe_redeemer_user_token,
          maybe_redeemer_username: record.maybe_redeemer_username,
          maybe_redeemer_display_name: record.maybe_redeemer_display_name,
          maybe_redeemer_gravatar_hash: record.maybe_redeemer_gravatar_hash,
          is_distributed: i8_to_bool(record.is_distributed),
          maybe_notes: record.maybe_notes,
          created_at: record.created_at,
          maybe_redeemed_at: record.maybe_redeemed_at,
        }
      })
      .collect::<Vec<_>>();

  Ok(BetaKeyListPage {
    records: results,
    sort_ascending: args.sort_ascending,
    current_page: args.page_index,
    total_page_count: number_of_pages,
  })
}

fn select_result_fields() -> &'static str {
  r#"
  b.id,
  b.token,

  b.product,
  b.key_value,

  b.creator_user_token,
  creator.username as creator_username,
  creator.display_name as creator_display_name,
  creator.email_gravatar_hash as creator_gravatar_hash,

  b.maybe_referrer_user_token,
  referrer.username as maybe_referrer_username,
  referrer.display_name as maybe_referrer_display_name,
  referrer.email_gravatar_hash as maybe_referrer_gravatar_hash,

  b.maybe_redeemer_user_token,
  redeemer.username as maybe_redeemer_username,
  redeemer.display_name as maybe_redeemer_display_name,
  redeemer.email_gravatar_hash as maybe_redeemer_gravatar_hash,

  b.is_distributed,
  b.maybe_notes,

  b.created_at,
  b.maybe_redeemed_at
    "#
}

fn select_total_count_field() -> &'static str {
  r#"
    COUNT(b.id) AS total_count
  "#
}

fn query_builder<'a>(
  select_fields: &'a str,

  filter_to_referrer_user_token: Option<&'a UserToken>,
  filter_to_keys: FilterToKeys,

  enforce_limits: bool,
  page_index: usize,
  page_size: usize,
  sort_ascending: bool,
) -> QueryBuilder<'a, MySql> {

  let mut sort_ascending = sort_ascending;

  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    format!(r#"
SELECT
  {select_fields}

FROM beta_keys AS b

JOIN users AS creator
    ON b.creator_user_token = creator.token

LEFT OUTER JOIN users AS referrer
    ON b.maybe_referrer_user_token = referrer.token

LEFT OUTER JOIN users AS redeemer
    ON b.maybe_redeemer_user_token = redeemer.token
    "#
  ));

  let mut first_predicate_added = false;

  if let Some(user_token) = filter_to_referrer_user_token {
    if !first_predicate_added {
      query_builder.push(" WHERE ");
      first_predicate_added = true;
    } else {
      query_builder.push(" AND ");
    }

    query_builder.push(" b.maybe_referrer_user_token = ");
    query_builder.push_bind(user_token.as_str());
  }

  match filter_to_keys {
    FilterToKeys::All => {} // No-op
    FilterToKeys::Redeemed | FilterToKeys::Unredeemed => {
      if !first_predicate_added {
        query_builder.push(" WHERE ");
        first_predicate_added = true;
      } else {
        query_builder.push(" AND ");
      }

      if filter_to_keys == FilterToKeys::Redeemed {
        query_builder.push(" b.maybe_redeemed_at IS NOT NULL ");
      } else {
        query_builder.push(" b.maybe_redeemed_at IS NULL ");
      }
    }
  }

//  if let Some(offset) = maybe_offset {
//    if !first_predicate_added {
//      query_builder.push(" WHERE ");
//      first_predicate_added = true;
//    } else {
//      query_builder.push(" AND ");
//    }
//
//    if sort_ascending {
//      if cursor_is_reversed {
//        // NB: We're searching backwards.
//        query_builder.push(" b.id < ");
//        sort_ascending = !sort_ascending;
//      } else {
//        query_builder.push(" b.id > ");
//      }
//    } else {
//      if cursor_is_reversed {
//        // NB: We're searching backwards.
//        query_builder.push(" b.id > ");
//        sort_ascending = !sort_ascending;
//      } else {
//        query_builder.push(" b.id < ");
//      }
//    }
//    query_builder.push_bind(offset as i64);
//  }

  if sort_ascending {
    query_builder.push(" ORDER BY b.id ASC ");
  } else {
    query_builder.push(" ORDER BY b.id DESC ");
  }

//  query_builder.push(format!(" LIMIT {limit} "));

  if enforce_limits {
    let offset = page_index * page_size;
    query_builder.push(format!(" LIMIT {page_size} OFFSET {offset} "));
  }

  query_builder
}

struct BetaKeyListItemInternal {
  id: i64,
  token: BetaKeyToken,

  product: BetaKeyProduct,
  key_value: String,

  creator_user_token: UserToken,
  creator_username: String,
  creator_display_name: String,
  creator_gravatar_hash: String,

  maybe_referrer_user_token: Option<UserToken>,
  maybe_referrer_username: Option<String>,
  maybe_referrer_display_name: Option<String>,
  maybe_referrer_gravatar_hash: Option<String>,

  maybe_redeemer_user_token: Option<UserToken>,
  maybe_redeemer_username: Option<String>,
  maybe_redeemer_display_name: Option<String>,
  maybe_redeemer_gravatar_hash: Option<String>,

  is_distributed: i8,
  maybe_notes: Option<String>,

  created_at: DateTime<Utc>,
  maybe_redeemed_at: Option<DateTime<Utc>>,
}

impl FromRow<'_, MySqlRow> for BetaKeyListItemInternal {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    let creator_user_token : String = row.try_get("creator_user_token")?;
    let creator_user_token = UserToken::new(creator_user_token);

    let maybe_referrer_user_token : Option<String> = row.try_get("maybe_referrer_user_token")?;
    let maybe_referrer_user_token = maybe_referrer_user_token.map(|user_token| UserToken::new(user_token));

    let maybe_redeemer_user_token : Option<String> = row.try_get("maybe_redeemer_user_token")?;
    let maybe_redeemer_user_token = maybe_redeemer_user_token.map(|user_token| UserToken::new(user_token));

    Ok(Self {
      id: row.try_get("id")?,
      token: BetaKeyToken::new(row.try_get("token")?),
      product: BetaKeyProduct::try_from_mysql_row(row, "product")?,
      key_value: row.try_get("key_value")?,
      creator_user_token,
      creator_username: row.try_get("creator_username")?,
      creator_display_name: row.try_get("creator_display_name")?,
      creator_gravatar_hash: row.try_get("creator_gravatar_hash")?,
      maybe_referrer_user_token,
      maybe_referrer_username: row.try_get("maybe_referrer_username")?,
      maybe_referrer_display_name: row.try_get("maybe_referrer_display_name")?,
      maybe_referrer_gravatar_hash: row.try_get("maybe_referrer_gravatar_hash")?,
      maybe_redeemer_user_token,
      maybe_redeemer_username: row.try_get("maybe_redeemer_username")?,
      maybe_redeemer_display_name: row.try_get("maybe_redeemer_display_name")?,
      maybe_redeemer_gravatar_hash: row.try_get("maybe_redeemer_gravatar_hash")?,
      is_distributed: row.try_get("is_distributed")?,
      maybe_notes: row.try_get("maybe_notes")?,
      created_at: row.try_get("created_at")?,
      maybe_redeemed_at: row.try_get("maybe_redeemed_at")?,
    })
  }
}
