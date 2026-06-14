use sqlx::{MySql, MySqlPool, QueryBuilder};

use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use errors::AnyhowResult;

use crate::queries::users::user_bookmarks::list_user_bookmarks_result::RawUserBookmarkRecord;
use crate::queries::users::user_bookmarks::list_user_bookmarks_result::UserBookmark;

pub struct UserBookmarkListPage {
  pub results: Vec<UserBookmark>,

  pub sort_ascending: bool,

  pub current_page: usize,
  pub total_page_count: usize,
}

pub struct ListUserBookmarksForUserArgs<'a> {
    pub username: &'a str,
    pub maybe_filter_entity_type: Option<UserBookmarkEntityType>,
    pub maybe_filter_weight_type: Option<WeightsType>,
    pub maybe_filter_weight_category: Option<WeightsCategory>,
    pub maybe_filter_media_file_type: Option<MediaFileType>,
    pub page_size: usize,
    pub page_index: usize,
    pub sort_ascending: bool,
    pub mysql_pool: &'a MySqlPool,
}

fn select_total_count_field() -> String {
    r#"
    COUNT(f.id) AS total_count
  "#
        .to_string()
}

fn select_result_fields() -> &'static str {
    r#"
    f.token,
    f.entity_type,
    f.entity_token,
    f.user_token,
    u.username,
    u.display_name as user_display_name,
    u.email_gravatar_hash as user_gravatar_hash,
    f.created_at,
    f.updated_at,
    f.deleted_at,

    entity_stats.ratings_positive_count as maybe_ratings_positive_count,
    entity_stats.ratings_negative_count as maybe_ratings_negative_count,
    entity_stats.bookmark_count as maybe_bookmark_count,

    media_files.media_type as maybe_media_file_type,
    media_files.origin_category as maybe_media_file_origin_category,
    media_files.origin_product_category as maybe_media_file_origin_product,
    media_files.public_bucket_directory_hash as maybe_media_file_public_bucket_hash,
    media_files.maybe_public_bucket_prefix as maybe_media_file_public_bucket_prefix,
    media_files.maybe_public_bucket_extension as maybe_media_file_public_bucket_extension,
    media_file_creator.token as maybe_media_file_creator_user_token,
    media_file_creator.username as maybe_media_file_creator_username,
    media_file_creator.display_name as maybe_media_file_creator_display_name,
    media_file_creator.email_gravatar_hash as maybe_media_file_creator_gravatar_hash,
    media_file_cover_images.public_bucket_directory_hash as maybe_media_file_cover_image_public_bucket_hash,
    media_file_cover_images.maybe_public_bucket_prefix as maybe_media_file_cover_image_public_bucket_prefix,
    media_file_cover_images.maybe_public_bucket_extension as maybe_media_file_cover_image_public_bucket_extension,

    model_weights.weights_type as maybe_model_weight_type,
    model_weights.weights_category as maybe_model_weight_category,
    model_weight_creator.token as maybe_model_weight_creator_user_token,
    model_weight_creator.username as maybe_model_weight_creator_username,
    model_weight_creator.display_name as maybe_model_weight_creator_display_name,
    model_weight_creator.email_gravatar_hash as maybe_model_weight_creator_gravatar_hash,
    model_weight_cover_images.public_bucket_directory_hash as maybe_model_weight_cover_image_public_bucket_hash,
    model_weight_cover_images.maybe_public_bucket_prefix as maybe_model_weight_cover_image_public_bucket_prefix,
    model_weight_cover_images.maybe_public_bucket_extension as maybe_model_weight_cover_image_public_bucket_extension,

    model_weights.title as maybe_descriptive_text_model_weight_title,
    tts_models.title as maybe_descriptive_text_tts_model_title,
    tts_results.raw_inference_text as maybe_descriptive_text_tts_result_inference_text,
    users.display_name as maybe_descriptive_text_user_display_name,
    voice_conversion_models.title as maybe_descriptive_text_voice_conversion_model_title,
    zs_voices.title as maybe_descriptive_text_zs_voice_title
    "#
}

fn query_builder<'a>(
    maybe_filter_entity_type: Option<UserBookmarkEntityType>,
    maybe_filter_weight_type: Option<WeightsType>,
    maybe_filter_weight_category: Option<WeightsCategory>,
    maybe_filter_media_file_type: Option<MediaFileType>,
    maybe_username: Option<&'a str>,
    enforce_limits: bool,
    page_index: usize,
    page_size: usize,
    sort_ascending: bool,
    select_fields: &'a str,
) -> QueryBuilder<MySql> {

    let mut first_predicate_added = false;
    // NB: Query cannot be statically checked by sqlx
    let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
        format!(r#"
SELECT
     {select_fields}
FROM
    user_bookmarks AS f
JOIN users AS u
    ON f.user_token = u.token

LEFT OUTER JOIN entity_stats
    ON entity_stats.entity_type = f.entity_type
    AND entity_stats.entity_token = f.entity_token

LEFT OUTER JOIN model_weights ON model_weights.token = f.entity_token
LEFT OUTER JOIN media_files AS model_weight_cover_images
    ON model_weights.maybe_cover_image_media_file_token = model_weight_cover_images.token
LEFT OUTER JOIN users as model_weight_creator
    ON model_weights.creator_user_token = model_weight_creator.token

LEFT OUTER JOIN media_files ON media_files.token = f.entity_token
LEFT OUTER JOIN media_files AS media_file_cover_images
    ON media_files.maybe_cover_image_media_file_token = media_file_cover_images.token
LEFT OUTER JOIN users as media_file_creator
    ON media_files.maybe_creator_user_token = media_file_creator.token

LEFT OUTER JOIN tts_models ON tts_models.token = f.entity_token
LEFT OUTER JOIN tts_results ON tts_results.token = f.entity_token
LEFT OUTER JOIN users ON users.token = f.entity_token
LEFT OUTER JOIN voice_conversion_models ON voice_conversion_models.token = f.entity_token
LEFT OUTER JOIN zs_voices ON zs_voices.token = f.entity_token

    "#
        ));

    if let Some(username) = maybe_username {
        if !first_predicate_added {
            query_builder.push(" WHERE ");
            first_predicate_added = true;
        } else {
            query_builder.push(" AND ");
        }
        query_builder.push(" u.username = ");
        query_builder.push_bind(username);
    }

    if let Some(entity_type) = maybe_filter_entity_type {
        if !first_predicate_added {
            query_builder.push(" WHERE ");
            first_predicate_added = true;
        } else {
            query_builder.push(" AND ");
        }
        query_builder.push(" f.entity_type = ");
        query_builder.push_bind(entity_type.to_str());
    }

    if let Some(weights_type) = maybe_filter_weight_type {
        if !first_predicate_added {
            query_builder.push(" WHERE ");
            first_predicate_added = true;
        } else {
            query_builder.push(" AND ");
        }
        query_builder.push(" model_weights.weights_type = ");
        query_builder.push_bind(weights_type.to_str());
    }

    if let Some(weights_category) = maybe_filter_weight_category {
        if !first_predicate_added {
            query_builder.push(" WHERE ");
            first_predicate_added = true;
        } else {
            query_builder.push(" AND ");
        }
        query_builder.push(" model_weights.weights_category = ");
        query_builder.push_bind(weights_category.to_str());
    }

    if let Some(media_file_type) = maybe_filter_media_file_type {
        if !first_predicate_added {
            query_builder.push(" WHERE ");
            first_predicate_added = true;
        } else {
            query_builder.push(" AND ");
        }
        query_builder.push(" media_files.media_type = ");
        query_builder.push_bind(media_file_type.to_str());
    }

    query_builder.push(" AND f.deleted_at IS NULL ");

    if sort_ascending {
        query_builder.push(" ORDER BY f.created_at ASC ");
    } else {
        query_builder.push(" ORDER BY f.created_at DESC ");
    }

    if enforce_limits {
        let offset = page_index * page_size;
        query_builder.push(format!(" LIMIT {page_size} OFFSET {offset} "));
    }

    query_builder
}

pub async fn list_user_bookmarks_by_maybe_entity_type(
    args: ListUserBookmarksForUserArgs<'_>
) -> AnyhowResult<UserBookmarkListPage> {

    let count_fields = select_total_count_field();
    let mut count_query_builder = query_builder(
        args.maybe_filter_entity_type,
        args.maybe_filter_weight_type,
        args.maybe_filter_weight_category,
        args.maybe_filter_media_file_type,
        Some(args.username),
        false,
        0,
        0,
        args.sort_ascending,
        count_fields.as_str(),
    );

    let row_count_query = count_query_builder.build_query_scalar::<i64>();
    let row_count_result = row_count_query.fetch_one(args.mysql_pool).await?;

    /// Now fetch the actual results with all the fields
    let result_fields = select_result_fields();
    let mut query = query_builder(
        args.maybe_filter_entity_type,
        args.maybe_filter_weight_type,
        args.maybe_filter_weight_category,
        args.maybe_filter_media_file_type,
        Some(args.username),
        true,
        args.page_index,
        args.page_size,
        args.sort_ascending,
        result_fields,
    );

    let query = query.build_query_as::<RawUserBookmarkRecord>();
    let results = query.fetch_all(args.mysql_pool).await?;

    let number_of_pages = (row_count_result / args.page_size as i64) as usize;
    let results = results.into_iter()
        .map(|record| {
            record.into_public_type()
        })
        .collect::<Vec<_>>();

    Ok(UserBookmarkListPage {
        results,
        sort_ascending: args.sort_ascending,
        current_page: args.page_index,
        total_page_count: number_of_pages,
    })
}
