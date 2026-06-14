use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use errors::AnyhowResult;

use crate::helpers::boolean_converters::i8_to_bool;

/// NB: This is not to be shared externally.
/// Only for trusted mods and staff.
#[derive(Serialize)]
pub struct ListUsersPage {
  pub users: Vec<UserForList>,
  pub sorted_ascending: bool,
  pub sorted_by_key: String,

  /// ID of the first record in `users`
  pub first_id: Option<i64>,

  /// ID of the last record in `users`
  pub last_id: Option<i64>,
}

#[derive(Serialize)]
pub struct UserForList {
  pub user_id: i64,
  pub user_token: String,

  pub username: String,
  pub display_name: String,
  pub gravatar_hash: String,

  pub is_banned: bool,
  pub user_role_slug: String,

  pub ip_address_creation: String,
  pub ip_address_last_login: String,
  pub ip_address_last_update: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListUsersQueryBuilder {
  sort_ascending: bool,
  per_page: i64,
}

impl ListUsersQueryBuilder {
  pub fn new() -> Self {
    Self {
      sort_ascending: false,
      per_page: 50,
    }
  }

  pub fn sort_ascending(mut self, sort_ascending: bool) -> Self {
    self.sort_ascending = sort_ascending;
    self
  }

  pub async fn query_for_page(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<ListUsersPage> {

    let internal_results = self.internal_query(mysql_pool).await?;

    let first_id = internal_results.first()
        .map(|raw_result| raw_result.user_id);

    let last_id = internal_results.last()
        .map(|raw_result| raw_result.user_id);

    let users = internal_results
        .into_iter()
        .map(|r| {
          UserForList {
            user_id: r.user_id,
            user_token: r.user_token,
            username: r.username,
            display_name: r.display_name,
            gravatar_hash: r.gravatar_hash,
            is_banned: i8_to_bool(r.is_banned),
            user_role_slug: r.user_role_slug,
            ip_address_creation: r.ip_address_creation,
            ip_address_last_login: r.ip_address_last_login,
            ip_address_last_update: r.ip_address_last_update,
            created_at: r.created_at,
            updated_at: r.updated_at,
          }
        })
        .collect::<Vec<UserForList>>();

    Ok(ListUsersPage {
      users,
      sorted_ascending: false,
      sorted_by_key: "".to_string(),
      first_id,
      last_id,
    })
  }

  async fn internal_query(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<Vec<UserForListRaw>> {

    let query = self.build_query_string();
    let query = sqlx::query_as::<_, UserForListRaw>(sqlx::AssertSqlSafe(&*query));


    let results = query.fetch_all(mysql_pool)
        .await?;

    Ok(results)
  }

  pub fn build_query_string(&self) -> String {
    let query_string = r#"
SELECT
  id as user_id,
  token as user_token,
  username,
  display_name,
  display_name,
  email_gravatar_hash as gravatar_hash,
  is_banned,
  user_role_slug,
  ip_address_creation,
  ip_address_last_login,
  ip_address_last_update,
  created_at,
  updated_at
FROM users
"#;

    query_string.to_string()
  }
}

#[derive(sqlx::FromRow)]
struct UserForListRaw {
  pub user_id: i64,
  pub user_token: String,

  pub username: String,
  pub display_name: String,
  pub gravatar_hash: String,

  pub is_banned: i8,
  pub user_role_slug: String,

  pub ip_address_creation: String,
  pub ip_address_last_login: String,
  pub ip_address_last_update: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

