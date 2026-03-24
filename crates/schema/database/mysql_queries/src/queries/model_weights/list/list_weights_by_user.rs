use chrono::{DateTime, Utc};
use sqlx::{FromRow, MySql, MySqlPool, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::model_weights::{
  weights_category::WeightsCategory,
  weights_types::WeightsType,
};
use enums::common::view_as::ViewAs;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

pub struct WeightsForUserListPage {
  pub records: Vec<WeightsJoinUserRecord>,

  pub sort_ascending: bool,

  pub current_page: usize,
  pub total_page_count: usize,
}

#[derive(Serialize)]
pub struct WeightsJoinUserRecord {
    pub token: ModelWeightToken,

    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    
    pub title: String,

    pub maybe_ietf_language_tag: Option<String>,
    pub maybe_ietf_primary_language_subtag: Option<String>,

    // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
    //  Hopefully we don't break the frontend by omitting these.
    //pub maybe_description_markdown: String,
    //pub maybe_description_rendered_html: String,
    
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

    pub maybe_ratings_positive_count: Option<u32>,
    pub maybe_ratings_negative_count: Option<u32>,
    pub maybe_bookmark_count: Option<u32>,
    pub cached_usage_count: u64,

    pub version: i32,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
    
    pub creator_username: String,
    pub creator_display_name: String,
    pub creator_email_gravatar_hash: String,
}

pub struct ListWeightsForUserArgs<'a> {
  pub creator_username: &'a str,
  pub page_size: usize,
  pub page_index: usize,
  pub sort_ascending: bool,
  pub view_as: ViewAs,
  pub maybe_scoped_weight_type: Option<WeightsType>,
  pub maybe_scoped_weight_category: Option<WeightsCategory>,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_weights_by_creator_username(args: ListWeightsForUserArgs<'_>) -> AnyhowResult<WeightsForUserListPage> {
    let count_fields = select_total_count_field();
    let mut count_query_builder = query_builder(
        args.creator_username,
        false,
        0,
        0,
        args.sort_ascending,
        count_fields.as_str(),
        args.view_as,
        args.maybe_scoped_weight_type,
        args.maybe_scoped_weight_category,
    );

    let row_count_query = count_query_builder.build_query_scalar::<i64>();
    let row_count_result = row_count_query.fetch_one(args.mysql_pool).await?;

    /// Now fetch the actual results with all the fields
    let result_fields = select_result_fields();
    let mut query = query_builder(
        args.creator_username,
        true,
        args.page_index,
        args.page_size,
        args.sort_ascending,
        result_fields.as_str(),
        args.view_as,
        args.maybe_scoped_weight_type,
        args.maybe_scoped_weight_category,
    );

    let query = query.build_query_as::<RawWeightJoinUser>();
    let results = query.fetch_all(args.mysql_pool).await?;

    let number_of_pages = (row_count_result / args.page_size as i64) as usize;

    let weights_records: Vec<WeightsJoinUserRecord> = map_to_weights(results).await;

    Ok(WeightsForUserListPage {
        records: weights_records,
        sort_ascending: args.sort_ascending,
        current_page: args.page_index,
        total_page_count: number_of_pages,
    })
}

fn select_total_count_field() -> String {
    r#"
    COUNT(mw.id) AS total_count
  "#
        .to_string()
}

fn select_result_fields() -> String {
    r#"
        mw.token,
        mw.title,
        mw.weights_type,
        mw.weights_category,
        mw.maybe_ietf_language_tag,
        mw.maybe_ietf_primary_language_subtag,
        u.token as creator_user_token,
        u.username as creator_username,
        u.display_name as creator_display_name,
        u.email_gravatar_hash as creator_email_gravatar_hash,
        mw.creator_ip_address,
        mw.creator_set_visibility,
        mw.maybe_last_update_user_token,
        mw.original_download_url,
        mw.original_filename,
        mw.file_size_bytes,
        mw.file_checksum_sha2,

        mw.public_bucket_hash,
        mw.maybe_public_bucket_prefix,
        mw.maybe_public_bucket_extension,

        cover_image.public_bucket_directory_hash as maybe_cover_image_public_bucket_hash,
        cover_image.maybe_public_bucket_prefix as maybe_cover_image_public_bucket_prefix,
        cover_image.maybe_public_bucket_extension as maybe_cover_image_public_bucket_extension,

        entity_stats.ratings_positive_count as maybe_ratings_positive_count,
        entity_stats.ratings_negative_count as maybe_ratings_negative_count,
        entity_stats.bookmark_count as maybe_bookmark_count,

        mw.cached_usage_count,

        mw.version,
        mw.created_at,
        mw.updated_at,
        mw.user_deleted_at,
        mw.mod_deleted_at
    "#.to_string()
}

fn query_builder<'a>(
    username: &'a str,
    enforce_limits: bool,
    page_index: usize,
    page_size: usize,
    sort_ascending: bool,
    select_fields: &'a str,
    view_as: ViewAs,
    maybe_scoped_weight_type: Option<WeightsType>,
    maybe_scoped_weight_category: Option<WeightsCategory>,
) -> QueryBuilder<'a, MySql> {

    // NB: Query cannot be statically checked by sqlx
    let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
        format!(r#"
SELECT
     {select_fields}
FROM model_weights as mw
JOIN users as u
    ON u.token = mw.creator_user_token
LEFT OUTER JOIN media_files as cover_image
    ON cover_image.token = mw.maybe_cover_image_media_file_token
LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = "model_weights"
    AND entity_stats.entity_token = mw.token
    "#
        ));

    query_builder.push(" WHERE u.username = ");
    query_builder.push_bind(username);

    match view_as {
        ViewAs::Author | ViewAs::Moderator => {
            // NB(bt): Actually, mods don't want to see deleted models. We'll improve the moderator UI later.
            query_builder.push(" AND mw.user_deleted_at IS NULL AND mw.mod_deleted_at IS NULL ");
        }
        ViewAs::AnotherUser => {
            query_builder.push(" AND mw.user_deleted_at IS NULL AND mw.mod_deleted_at IS NULL ");
            query_builder.push(" AND mw.creator_set_visibility = ");
            query_builder.push_bind(Visibility::Public.to_str());
        }
    }

    if let Some(weight_type) = maybe_scoped_weight_type {
      query_builder.push(" AND mw.weights_type = ");
      query_builder.push_bind(weight_type.to_str());
    }

    if let Some(weight_category) = maybe_scoped_weight_category {
      query_builder.push(" AND mw.weights_category = ");
      query_builder.push_bind(weight_category.to_str());
    }

    if sort_ascending {
        query_builder.push(" ORDER BY mw.created_at ASC ");
    } else {
        query_builder.push(" ORDER BY mw.created_at DESC ");
    }

    if enforce_limits {
        let offset = page_index * page_size;
        query_builder.push(format!(" LIMIT {page_size} OFFSET {offset} "));
    }

    query_builder
}

async fn map_to_weights(dataset:Vec<RawWeightJoinUser>) -> Vec<WeightsJoinUserRecord> {
    let weights: Vec<WeightsJoinUserRecord> = dataset
        .into_iter()
        .map(|weight: RawWeightJoinUser| {
            WeightsJoinUserRecord {
                token: weight.token,
                title: weight.title,
                weights_type: weight.weights_type,
                weights_category: weight.weights_category,

                maybe_ietf_language_tag: weight.maybe_ietf_language_tag,
                maybe_ietf_primary_language_subtag: weight.maybe_ietf_primary_language_subtag,

                //maybe_description_markdown: weight.maybe_description_markdown,
                //maybe_description_rendered_html: weight.maybe_description_rendered_html,

                creator_user_token: weight.creator_user_token,
                creator_ip_address: weight.creator_ip_address,
                creator_set_visibility: weight.creator_set_visibility,

                maybe_last_update_user_token: weight.maybe_last_update_user_token,
                original_download_url: weight.original_download_url,
                original_filename: weight.original_filename,
                file_size_bytes: weight.file_size_bytes,
                file_checksum_sha2: weight.file_checksum_sha2,
                public_bucket_hash: weight.public_bucket_hash,
                maybe_public_bucket_prefix: weight.maybe_public_bucket_prefix,
                maybe_public_bucket_extension: weight.maybe_public_bucket_extension,

                maybe_cover_image_public_bucket_hash: weight.maybe_cover_image_public_bucket_hash,
                maybe_cover_image_public_bucket_prefix: weight.maybe_cover_image_public_bucket_prefix,
                maybe_cover_image_public_bucket_extension: weight.maybe_cover_image_public_bucket_extension,

                maybe_ratings_positive_count: weight.maybe_ratings_positive_count,
                maybe_ratings_negative_count: weight.maybe_ratings_negative_count,
                maybe_bookmark_count: weight.maybe_bookmark_count,
                cached_usage_count: weight.cached_usage_count,

                version: weight.version,
                created_at: weight.created_at,
                updated_at: weight.updated_at,
                user_deleted_at: weight.user_deleted_at,
                mod_deleted_at: weight.mod_deleted_at,

                creator_username: weight.creator_username,
                creator_display_name: weight.creator_display_name,
                creator_email_gravatar_hash: weight.creator_email_gravatar_hash,
            }
        }).collect();

        weights
}

struct RawWeightJoinUser {
  token: ModelWeightToken,

  weights_type: WeightsType,
  weights_category: WeightsCategory,

  title: String,

  maybe_ietf_language_tag: Option<String>,
  maybe_ietf_primary_language_subtag: Option<String>,

  // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
  //  Hopefully we don't break the frontend by omitting these.
  //pub description_markdown: String,
  //pub description_rendered_html: String,

  creator_user_token: UserToken,
  creator_ip_address: String,
  creator_set_visibility: Visibility,

  maybe_last_update_user_token: Option<UserToken>,

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

  maybe_ratings_positive_count: Option<u32>,
  maybe_ratings_negative_count: Option<u32>,
  maybe_bookmark_count: Option<u32>,
  cached_usage_count: u64,

  version: i32,

  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,

  user_deleted_at: Option<DateTime<Utc>>,
  mod_deleted_at: Option<DateTime<Utc>>,

  creator_username: String,
  creator_display_name: String,
  creator_email_gravatar_hash: String,
}

impl FromRow<'_, MySqlRow> for RawWeightJoinUser {
    fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            token: row.try_get("token")?,
            weights_type: row.try_get("weights_type")?,
            weights_category: row.try_get("weights_category")?,
            title: row.try_get("title")?,
            maybe_ietf_language_tag: row.try_get("maybe_ietf_language_tag")?,
            maybe_ietf_primary_language_subtag: row.try_get("maybe_ietf_primary_language_subtag")?,
            // TODO(bt,2023-12-24): These aren't really appropriate for a list endpoint.
            //  Hopefully we don't break the frontend by omitting these.
            //maybe_description_markdown: row.try_get("maybe_description_markdown")?,
            //maybe_description_rendered_html: row.try_get("maybe_description_rendered_html")?,
            creator_user_token: row.try_get("creator_user_token")?,
            creator_ip_address: row.try_get("creator_ip_address")?,
            creator_set_visibility: Visibility::try_from_mysql_row(row, "creator_set_visibility")?,
            maybe_last_update_user_token: row.try_get("maybe_last_update_user_token")?,
            original_download_url: row.try_get("original_download_url")?,
            original_filename: row.try_get("original_filename")?,
            file_size_bytes: row.try_get("file_size_bytes")?,
            file_checksum_sha2: row.try_get("file_checksum_sha2")?,
            public_bucket_hash: row.try_get("public_bucket_hash")?,
            maybe_public_bucket_prefix: row.try_get("maybe_public_bucket_prefix")?,
            maybe_public_bucket_extension: row.try_get("maybe_public_bucket_extension")?,
            maybe_cover_image_public_bucket_hash: row.try_get("maybe_cover_image_public_bucket_hash")?,
            maybe_cover_image_public_bucket_prefix: row.try_get("maybe_cover_image_public_bucket_prefix")?,
            maybe_cover_image_public_bucket_extension: row.try_get("maybe_cover_image_public_bucket_extension")?,
            maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
            maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
            maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
            cached_usage_count: row.try_get("cached_usage_count")?,
            version: row.try_get("version")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
            user_deleted_at: row.try_get("user_deleted_at")?,
            mod_deleted_at: row.try_get("mod_deleted_at")?,
            creator_username: row.try_get("creator_username")?,
            creator_display_name: row.try_get("creator_display_name")?,
            creator_email_gravatar_hash: row.try_get("creator_email_gravatar_hash")?,
        })
    }
}