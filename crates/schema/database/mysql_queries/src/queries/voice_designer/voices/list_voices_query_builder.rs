#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::config::shared_constants::DEFAULT_MYSQL_QUERY_RESULT_PAGE_SIZE;

#[derive(Serialize)]
pub struct ZsVoiceListPage {
    pub voices: Vec<ZsVoice>,
    pub sort_ascending: bool,

    pub first_id: Option<i64>,

    pub last_id: Option<i64>,
}

#[derive(Serialize)]
pub struct ZsVoice {
    pub voice_token: ZsVoiceToken,
    pub title: String,

    pub ietf_language_tag: String,
    pub ietf_primary_language_subtag: String,

    pub creator_user_token: UserToken,
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,

    pub creator_set_visibility: Visibility,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct ListVoicesQueryBuilder {
    scope_creator_username: Option<String>,
    include_user_hidden: bool,
    include_mod_deleted_results: bool,
    include_user_deleted_results: bool,
    sort_ascending: bool,
    offset: Option<u64>,
    limit: u16,
    cursor_is_reversed: bool,
}

impl ListVoicesQueryBuilder {
    pub fn new() -> Self {
        Self {
            scope_creator_username: None,
            include_user_hidden: false,
            include_mod_deleted_results: false,
            include_user_deleted_results: false,
            sort_ascending: false,
            offset: None,
            limit: DEFAULT_MYSQL_QUERY_RESULT_PAGE_SIZE,
            cursor_is_reversed: false,
        }
    }

    pub fn scope_creator_username(mut self, scope_creator_username: Option<&str>) -> Self {
        self.scope_creator_username = scope_creator_username.map(|u| u.to_string());
        self
    }

    pub fn include_user_hidden(mut self, include_user_hidden: bool) -> Self {
        self.include_user_hidden = include_user_hidden;
        self
    }

    pub fn include_mod_deleted_results(mut self, include_mod_deleted_results: bool) -> Self {
        self.include_mod_deleted_results = include_mod_deleted_results;
        self
    }

    pub fn include_user_deleted_results(mut self, include_user_deleted_results: bool) -> Self {
        self.include_user_deleted_results = include_user_deleted_results;
        self
    }

    pub fn sort_ascending(mut self, sort_ascending: bool) -> Self {
        self.sort_ascending = sort_ascending;
        self
    }

    pub fn offset(mut self, offset: Option<u64>) -> Self {
        self.offset = offset;
        self
    }

    pub fn limit(mut self, limit: u16) -> Self {
        self.limit = limit;
        self
    }

    pub fn cursor_is_reversed(mut self, cursor_is_reversed: bool) -> Self {
        self.cursor_is_reversed = cursor_is_reversed;
        self
    }

    async fn perform_internal_query(
        &self,
        mysql_pool: &MySqlPool
    ) -> AnyhowResult<Vec<RawInternalVoiceRecordForList>> {
        let query = self.build_query_string();
        let mut query = sqlx::query_as::<_, RawInternalVoiceRecordForList>(sqlx::AssertSqlSafe(&*query));

        // NB: The following bindings must match the order of the query builder !!

        if let Some(offset) = self.offset {
            query = query.bind(offset);
        }

        if let Some(username) = self.scope_creator_username.as_deref() {
            query = query.bind(username);
        }

        query = query.bind(self.limit);

        let mut results = query.fetch_all(mysql_pool)
            .await?;

        if self.cursor_is_reversed {
            results.reverse()
        }

        Ok(results)
    }



    pub async fn perform_query_for_page(
        &self,
        mysql_pool: &MySqlPool
    ) -> AnyhowResult<ZsVoiceListPage> {
        let internal_voices = self.perform_internal_query(mysql_pool).await?;

        let first_id = internal_voices.first()
            .map(|raw_result| raw_result.voice_id);

        let last_id = internal_voices.last()
            .map(|raw_result| raw_result.voice_id);

        let voices = internal_voices.into_iter().map(
            |v| {
                ZsVoice {
                    voice_token: v.token,
                    title: v.title,
                    creator_set_visibility: Visibility::from_str(&v.creator_set_visibility).unwrap_or(Visibility::Public),
                    ietf_language_tag: v.ietf_language_tag,
                    ietf_primary_language_subtag: v.ietf_primary_language_subtag,
                    creator_user_token: v.creator_user_token,
                    creator_username: v.creator_username,
                    creator_display_name: v.creator_display_name,
                    creator_email_gravatar_hash: v.creator_email_gravatar_hash,
                    created_at: v.created_at,
                    updated_at: v.updated_at,
                }
            })
            .collect::<Vec<ZsVoice>>();

        Ok(ZsVoiceListPage {
            voices,
            sort_ascending: self.sort_ascending,
            first_id,
            last_id,
        })
    }

    pub fn build_query_string(&self) -> String {
        let mut query = r#"
        SELECT
            zs_voices.id as voice_id,
            zs_voices.token as `token: tokens::tokens::zs_voices::ZsVoiceToken`,
            zs_voices.title,
            zs_voices.ietf_language_tag,
            zs_voices.ietf_primary_language_subtag,

            users.token as `creator_user_token: tokens::tokens::users::UserToken`,
            users.username as creator_username,
            users.display_name as creator_display_name,
            users.email_gravatar_hash as creator_email_gravatar_hash,

            zs_voices.creator_set_visibility,
            zs_voices.created_at,
            zs_voices.updated_at
        FROM zs_voices
        JOIN users
            ON users.token = zs_voices.maybe_creator_user_token
        "#.to_string();

        query.push_str(&self.build_predicates());
        query
    }

    pub fn build_predicates(&self) -> String {
        // NB: Reverse cursors require us to invert the sort direction.
        let mut sort_ascending = self.sort_ascending;

        let mut first_predicate_added = false;

        let mut query = "".to_string();

        if let Some(_offset) = self.offset {
            if !first_predicate_added {
                query.push_str(" WHERE");
                first_predicate_added = true;
            } else {
                query.push_str(" AND");
            }

            if sort_ascending {
                if self.cursor_is_reversed {
                    // NB: We're searching backwards.
                    query.push_str(" zs_voices.id < ?");
                    sort_ascending = !sort_ascending;
                } else {
                    query.push_str(" zs_voices.id > ?");
                }
            } else {
                if self.cursor_is_reversed {
                    // NB: We're searching backwards.
                    query.push_str(" zs_voices.id > ?");
                    sort_ascending = !sort_ascending;
                } else {
                    query.push_str(" zs_voices.id < ?");
                }
            }
        }

        if let Some(_username) = self.scope_creator_username.as_deref() {
            if !first_predicate_added {
                query.push_str(" WHERE users.username = ?");
                first_predicate_added = true;
            } else {
                query.push_str(" AND users.username = ?");
            }
        }

        if !self.include_user_hidden {
            if !first_predicate_added {
                query.push_str(" WHERE zs_voices.creator_set_visibility = 'public'");
                first_predicate_added = true;
            } else {
                query.push_str(" AND zs_voices.creator_set_visibility = 'public'");
            }
        }

        if !self.include_mod_deleted_results {
            if !first_predicate_added {
                query.push_str(" WHERE zs_voices.mod_deleted_at IS NULL");
                first_predicate_added = true;
            } else {
                query.push_str(" AND zs_voices.mod_deleted_at IS NULL");
            }
        }

        if !self.include_user_deleted_results {
            if !first_predicate_added {
                query.push_str(" WHERE zs_voices.user_deleted_at IS NULL");
                first_predicate_added = true;
            } else {
                query.push_str(" AND zs_voices.user_deleted_at IS NULL");
            }
        }

        if sort_ascending {
            query.push_str(" ORDER BY zs_voices.id ASC");
        } else {
            query.push_str(" ORDER BY zs_voices.id DESC");
        }

        query.push_str(" LIMIT ?");

        query
    }
}

#[derive(sqlx::FromRow)]
struct RawInternalVoiceRecordForList {
    voice_id: i64,
    token: ZsVoiceToken,
    title: String,
    ietf_language_tag: String,
    ietf_primary_language_subtag: String,
    creator_user_token: UserToken,
    creator_username: String,
    creator_display_name: String,
    creator_email_gravatar_hash: String,
    creator_set_visibility: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use crate::queries::voice_designer::voices::list_voices_query_builder::ListVoicesQueryBuilder;

    #[test]
    fn predicates_without_scoping() {
        let query_builder = ListVoicesQueryBuilder::new();

        assert_eq!(&query_builder.build_predicates(),
                   " WHERE zs_voices.creator_set_visibility = 'public' \
      AND zs_voices.mod_deleted_at IS NULL \
      AND zs_voices.user_deleted_at IS NULL \
      ORDER BY zs_voices.id DESC \
      LIMIT ?");
    }

    #[test]
    fn predicates_scoped_to_user() {
        let query_builder = ListVoicesQueryBuilder::new()
            .scope_creator_username(Some("echelon"));

        assert_eq!(&query_builder.build_predicates(),
                   " WHERE users.username = ? \
      AND zs_voices.creator_set_visibility = 'public' \
      AND zs_voices.mod_deleted_at IS NULL \
      AND zs_voices.user_deleted_at IS NULL \
      ORDER BY zs_voices.id DESC \
      LIMIT ?");
    }

    #[test]
    fn predicates_including_user_hidden() {
        let query_builder = ListVoicesQueryBuilder::new()
            .include_user_hidden(true);

        assert_eq!(&query_builder.build_predicates(),
                   " WHERE zs_voices.mod_deleted_at IS NULL \
      AND zs_voices.user_deleted_at IS NULL \
      ORDER BY zs_voices.id DESC \
      LIMIT ?");
    }

    #[test]
    fn predicates_including_mod_deleted() {
        let query_builder = ListVoicesQueryBuilder::new()
            .include_mod_deleted_results(true);

        assert_eq!(&query_builder.build_predicates(),
                   " WHERE zs_voices.creator_set_visibility = 'public' \
      AND zs_voices.user_deleted_at IS NULL \
      ORDER BY zs_voices.id DESC \
      LIMIT ?");
    }

    #[test]
    fn predicates_including_user_deleted() {
        let query_builder = ListVoicesQueryBuilder::new()
            .include_user_deleted_results(true);

        assert_eq!(&query_builder.build_predicates(),
                   " WHERE zs_voices.creator_set_visibility = 'public' \
      AND zs_voices.mod_deleted_at IS NULL \
      ORDER BY zs_voices.id DESC \
      LIMIT ?");
    }

    #[test]
    fn predicates_including_mod_deleted_and_user_deleted() {
        let query_builder = ListVoicesQueryBuilder::new()
            .include_mod_deleted_results(true)
            .include_user_deleted_results(true);

        assert_eq!(&query_builder.build_predicates(),
                   " WHERE zs_voices.creator_set_visibility = 'public' \
      ORDER BY zs_voices.id DESC \
      LIMIT ?");
    }
}