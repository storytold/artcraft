#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use enums::by_table::model_weights::{
    weights_category::WeightsCategory,
    weights_types::WeightsType,
};
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::config::shared_constants::DEFAULT_MYSQL_QUERY_RESULT_PAGE_SIZE;

#[derive(Serialize)]
pub struct WeightsPage {
    pub weights: Vec<WeightJoinUser>,
    pub sort_ascending: bool,

    pub first_id: Option<i64>,

    pub last_id: Option<i64>,
}

// TODO: figure out what you want to expose ? since we don't have specs really
#[derive(Serialize)]
pub struct WeightJoinUser {
    pub weight_id: i64,
    pub token: ModelWeightToken,

    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,

    pub title: String,

    pub maybe_ietf_language_tag: Option<String>,
    pub maybe_ietf_primary_language_subtag: Option<String>,

    pub maybe_description_markdown: Option<String>,
    pub maybe_description_rendered_html: Option<String>,

    pub creator_user_token: UserToken,
    pub creator_ip_address: String,
    pub creator_set_visibility: Visibility,

    pub maybe_last_update_user_token: Option<UserToken>,

    pub original_download_url: Option<String>,
    pub original_filename: Option<String>,

    pub file_size_bytes: i32,
    pub file_checksum_sha2: String,

    pub public_bucket_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,

    pub maybe_cover_image_public_bucket_hash: Option<String>,
    pub maybe_cover_image_public_bucket_prefix: Option<String>,
    pub maybe_cover_image_public_bucket_extension: Option<String>,

    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,

    pub maybe_ratings_positive_count: Option<u32>,
    pub maybe_ratings_negative_count: Option<u32>,
    pub maybe_bookmark_count: Option<u32>,
    pub cached_usage_count: u64,

    pub version: i32,

    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub struct ListWeightsQueryBuilder {
    scope_creator_username: Option<String>,
    include_mod_deleted_results: bool,
    include_user_deleted_results: bool,
    include_user_hidden: bool,
    sort_ascending: bool,
    weights_type: Option<WeightsType>,
    weights_category: Option<WeightsCategory>,
    offset: Option<u64>,
    limit: u16,
    cursor_is_reversed: bool,
}

impl ListWeightsQueryBuilder {
    pub fn new() -> Self {
        Self {
            scope_creator_username: None,
            include_user_hidden: false,
            include_mod_deleted_results: false,
            include_user_deleted_results: false,
            sort_ascending: false,
            weights_type: None,
            weights_category: None,
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

    pub fn weights_type(mut self, weights_type: Option<WeightsType>) -> Self {
        self.weights_type = weights_type;
        self
    }

    pub fn weights_category(mut self, weights_category: Option<WeightsCategory>) -> Self {
        self.weights_category = weights_category;
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
    ) -> AnyhowResult<Vec<RawWeightJoinUser>> {
        let query = self.build_query_string();

        let mut query = sqlx::query_as::<_, RawWeightJoinUser>(sqlx::AssertSqlSafe(&*query));

        // NB: The following bindings must match the order of the query builder !!

        if let Some(offset) = self.offset {
            query = query.bind(offset);
        }

        if let Some(username) = self.scope_creator_username.as_deref() {
            query = query.bind(username);
        }

        if let Some(weights_type) = self.weights_type {
            query = query.bind(weights_type);
        }

        if let Some(weights_category) = self.weights_category {
            query = query.bind(weights_category);
        }

        query = query.bind(self.limit);


        let mut results = query.fetch_all(mysql_pool).await?;

        if self.cursor_is_reversed {
            results.reverse();
        }

        Ok(results)
    }

    pub async fn perform_query_for_page(
        &self,
        mysql_pool: &MySqlPool
    ) -> AnyhowResult<WeightsPage> {
        let weights = self.perform_internal_query(mysql_pool).await?;

        let first_id = weights.first().map(|raw_result| raw_result.weight_id);

        let last_id = weights.last().map(|raw_result| raw_result.weight_id);

        let weights = weights
            .into_iter()
            .map(|record| {
                // map the raw result into a WeightJoinUser
                WeightJoinUser {
                    weight_id: record.weight_id,
                    token: record.token,
                    weights_type: WeightsType::from_str(record.weights_type.as_str()).unwrap(),
                    weights_category: WeightsCategory::from_str(
                        record.weights_category.as_str()
                    ).unwrap(),
                    title: record.title,
                    maybe_ietf_language_tag: record.maybe_ietf_language_tag,
                    maybe_ietf_primary_language_subtag: record.maybe_ietf_primary_language_subtag,
                    maybe_description_markdown: record.maybe_description_markdown,
                    maybe_description_rendered_html: record.maybe_description_rendered_html,
                    creator_user_token: UserToken::new_from_str(&record.creator_user_token),
                    creator_ip_address: record.creator_ip_address,
                    creator_set_visibility: Visibility::from_str(
                        &record.creator_set_visibility
                    ).unwrap(),
                    maybe_last_update_user_token: record.maybe_last_update_user_token.map(|token|
                        UserToken::new_from_str(&token)
                    ),
                    original_download_url: record.original_download_url,
                    original_filename: record.original_filename,
                    file_size_bytes: record.file_size_bytes,
                    file_checksum_sha2: record.file_checksum_sha2,
                    public_bucket_hash: record.public_bucket_hash,
                    maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
                    maybe_public_bucket_extension: record.maybe_public_bucket_extension,
                    maybe_cover_image_public_bucket_hash: record.maybe_cover_image_public_bucket_hash,
                    maybe_cover_image_public_bucket_prefix: record.maybe_cover_image_public_bucket_prefix,
                    maybe_cover_image_public_bucket_extension: record.maybe_cover_image_public_bucket_extension,
                    creator_username: record.creator_username,
                    creator_display_name: record.creator_display_name,
                    creator_email_gravatar_hash: record.creator_email_gravatar_hash,
                    maybe_ratings_positive_count: record.maybe_ratings_positive_count,
                    maybe_ratings_negative_count: record.maybe_ratings_negative_count,
                    maybe_bookmark_count: record.maybe_bookmark_count,
                    cached_usage_count: record.cached_usage_count,
                    version: record.version,
                    created_at: record.created_at,
                    updated_at: record.updated_at,
                    user_deleted_at: record.user_deleted_at,
                    mod_deleted_at: record.mod_deleted_at,
                }
            })
            .collect::<Vec<WeightJoinUser>>();

        Ok(WeightsPage {
            weights,
            sort_ascending: self.sort_ascending,
            first_id,
            last_id,
        })
    }

    pub fn build_query_string(&self) -> String {
        let mut query =
            r#"
        SELECT
            model_weights.id AS weight_id,
            model_weights.token,
            model_weights.weights_type,
            model_weights.weights_category,
            model_weights.title,
            model_weights.maybe_description_markdown,
            model_weights.maybe_description_rendered_html,
            model_weights.maybe_ietf_language_tag,
            model_weights.maybe_ietf_primary_language_subtag,
            model_weights.creator_user_token,
            model_weights.creator_ip_address,
            model_weights.creator_set_visibility,
            model_weights.maybe_last_update_user_token,
            model_weights.original_download_url,
            model_weights.original_filename,
            model_weights.file_size_bytes,
            model_weights.file_checksum_sha2,
            model_weights.public_bucket_hash,
            model_weights.maybe_public_bucket_prefix,
            model_weights.maybe_public_bucket_extension,
            cover_image.public_bucket_directory_hash as maybe_cover_image_public_bucket_hash,
            cover_image.maybe_public_bucket_prefix as maybe_cover_image_public_bucket_prefix,
            cover_image.maybe_public_bucket_extension as maybe_cover_image_public_bucket_extension,
            model_weights.version,
            model_weights.created_at,
            model_weights.updated_at,
            model_weights.user_deleted_at,
            model_weights.mod_deleted_at,
            users.username AS creator_username,
            users.display_name AS creator_display_name,
            users.email_gravatar_hash AS creator_email_gravatar_hash,
            entity_stats.ratings_positive_count as maybe_ratings_positive_count,
            entity_stats.ratings_negative_count as maybe_ratings_negative_count,
            entity_stats.bookmark_count as maybe_bookmark_count,
            model_weights.cached_usage_count
        FROM model_weights
        JOIN users
            ON users.token = model_weights.creator_user_token
        LEFT OUTER JOIN media_files as cover_image
            ON cover_image.token = model_weights.maybe_cover_image_media_file_token
        LEFT OUTER JOIN entity_stats
            ON entity_stats.entity_type = "model_weight"
            AND entity_stats.entity_token = model_weights.token
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
                    query.push_str(" model_weights.id < ? ");
                    sort_ascending = !sort_ascending;
                } else {
                    query.push_str(" model_weights.id > ? ");
                }
            } else {
                if self.cursor_is_reversed {
                    // NB: We're searching backwards.
                    query.push_str(" model_weights.id > ? ");
                    sort_ascending = !sort_ascending;
                } else {
                    query.push_str(" model_weights.id < ? ");
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

        if let Some(_weights_type) = self.weights_type {
            if !first_predicate_added {
                query.push_str(" WHERE model_weights.weights_type = ?");
                first_predicate_added = true;
            } else {
                query.push_str(" AND model_weights.weights_type = ?");
            }
        }

        if let Some(_weights_category) = self.weights_category {
            if !first_predicate_added {
                query.push_str(" WHERE model_weights.weights_category = ?");
                first_predicate_added = true;
            } else {
                query.push_str(" AND model_weights.weights_category = ?");
            }
        }

        if !self.include_user_hidden {
            if !first_predicate_added {
                query.push_str(" WHERE model_weights.creator_set_visibility = 'public'");
                first_predicate_added = true;
            } else {
                query.push_str(" AND model_weights.creator_set_visibility = 'public'");
            }
        }

        if !self.include_mod_deleted_results {
            if !first_predicate_added {
                query.push_str(" WHERE model_weights.mod_deleted_at IS NULL");
                first_predicate_added = true;
            } else {
                query.push_str(" AND model_weights.mod_deleted_at IS NULL");
            }
        }

        if !self.include_user_deleted_results {
            if !first_predicate_added {
                query.push_str(" WHERE model_weights.user_deleted_at IS NULL");
                first_predicate_added = true;
            } else {
                query.push_str(" AND model_weights.user_deleted_at IS NULL");
            }
        }

        if sort_ascending {
            query.push_str(" ORDER BY model_weights.id ASC");
        } else {
            query.push_str(" ORDER BY model_weights.id DESC");
        }

        if self.limit > 0 {
            query.push_str(" LIMIT ?");
        }

        query
    }
}

#[derive(Serialize)]
#[derive(sqlx::FromRow)]
struct RawWeightJoinUser {
    weight_id: i64,
    token: ModelWeightToken,

    weights_type: String,
    weights_category: String,

    title: String,

    maybe_description_markdown: Option<String>,
    maybe_description_rendered_html: Option<String>,

    maybe_ietf_language_tag: Option<String>,
    maybe_ietf_primary_language_subtag: Option<String>,

    creator_user_token: String,
    creator_ip_address: String,
    creator_set_visibility: String,

    maybe_last_update_user_token: Option<String>,

    original_download_url: Option<String>,
    original_filename: Option<String>,

    file_size_bytes: i32,
    file_checksum_sha2: String,

    public_bucket_hash: String,
    maybe_public_bucket_prefix: Option<String>,
    maybe_public_bucket_extension: Option<String>,

    maybe_cover_image_public_bucket_hash: Option<String>,
    maybe_cover_image_public_bucket_prefix: Option<String>,
    maybe_cover_image_public_bucket_extension: Option<String>,

    creator_username: String,
    creator_display_name: String,
    creator_email_gravatar_hash: String,

    maybe_ratings_positive_count: Option<u32>,
    maybe_ratings_negative_count: Option<u32>,
    maybe_bookmark_count: Option<u32>,
    cached_usage_count: u64,

    version: i32,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,

    user_deleted_at: Option<DateTime<Utc>>,
    mod_deleted_at: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
    use enums::by_table::model_weights::{
        weights_category::WeightsCategory,
        weights_types::WeightsType,
    };

    use crate::queries::model_weights::list::list_weights_query_builder::ListWeightsQueryBuilder;

    #[test]
    fn predicates_without_scoping() {
        let query_builder = ListWeightsQueryBuilder::new();

        println!("Query HERE! {}", &query_builder.build_predicates());
        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.creator_set_visibility = 'public' \
      AND model_weights.mod_deleted_at IS NULL \
      AND model_weights.user_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_scoped_to_user() {
        let query_builder = ListWeightsQueryBuilder::new().scope_creator_username(Some("echelon"));
        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE users.username = ? \
      AND model_weights.creator_set_visibility = 'public' \
      AND model_weights.mod_deleted_at IS NULL \
      AND model_weights.user_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_scoped_to_weights_type() {
        let query_builder = ListWeightsQueryBuilder::new().weights_type(Some(WeightsType::RvcV2));
        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.weights_type = ? \
      AND model_weights.creator_set_visibility = 'public' \
      AND model_weights.mod_deleted_at IS NULL \
      AND model_weights.user_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_scoped_to_weights_category() {
        let query_builder = ListWeightsQueryBuilder::new().weights_category(
            Some(WeightsCategory::VoiceConversion)
        );
        println!("Query HERE! {}", &query_builder.build_predicates());
        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.weights_category = ? \
      AND model_weights.creator_set_visibility = 'public' \
      AND model_weights.mod_deleted_at IS NULL \
      AND model_weights.user_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_including_user_hidden() {
        let query_builder = ListWeightsQueryBuilder::new().include_user_hidden(true);

        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.mod_deleted_at IS NULL \
      AND model_weights.user_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_including_mod_deleted() {
        let query_builder = ListWeightsQueryBuilder::new().include_mod_deleted_results(true);

        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.creator_set_visibility = 'public' \
      AND model_weights.user_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_including_user_deleted() {
        let query_builder = ListWeightsQueryBuilder::new().include_user_deleted_results(true);

        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.creator_set_visibility = 'public' \
      AND model_weights.mod_deleted_at IS NULL \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }

    #[test]
    fn predicates_including_mod_deleted_and_user_deleted() {
        let query_builder = ListWeightsQueryBuilder::new()
            .include_mod_deleted_results(true)
            .include_user_deleted_results(true);

        assert_eq!(
            &query_builder.build_predicates(),
            " WHERE model_weights.creator_set_visibility = 'public' \
      ORDER BY model_weights.id DESC \
      LIMIT ?"
        );
    }
}
