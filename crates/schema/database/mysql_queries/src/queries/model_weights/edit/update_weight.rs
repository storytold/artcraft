use anyhow::anyhow;
use sqlx::{MySql, QueryBuilder};

use crate::utils::transactor::Transactor;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

pub struct UpdateWeightArgs<'a, 't> {
    pub weight_token: &'a ModelWeightToken,
    pub title: Option<&'a str>,
    pub cover_image: Option<CoverImageOption<'a>>,
    pub maybe_description_markdown: Option<&'a str>,
    pub maybe_description_rendered_html: Option<&'a str>,
    pub creator_set_visibility: Option<&'a Visibility>,
    pub ietf_language_tag: Option<&'a str>,
    pub ietf_primary_language_subtag: Option<&'a str>,
    pub transactor: Transactor<'a, 't>,
}

pub enum CoverImageOption<'a> {
    ClearCoverImage,
    SetCoverImage(&'a MediaFileToken),
}

pub async fn update_weights(args: UpdateWeightArgs<'_, '_>) -> AnyhowResult<()> {
    if args.title.is_none()
        && args.maybe_description_markdown.is_none()
        && args.maybe_description_rendered_html.is_none()
        && args.creator_set_visibility.is_none()
        && args.cover_image.is_none()
    {
        return Err(anyhow!("No fields to update"));
    }

    let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
        r#"
UPDATE model_weights
SET
    "#
    );

    let mut separated = query_builder.separated(", ");

    if let Some(title) = args.title {
        separated.push(" title = ");
        separated.push_bind_unseparated(title);
    }
    if let Some(maybe_description_markdown) = args.maybe_description_markdown {
        separated.push(" maybe_description_markdown = ");
        separated.push_bind_unseparated(maybe_description_markdown);
    }
    if let Some(maybe_description_rendered_html) = args.maybe_description_rendered_html {
        separated.push(" maybe_description_rendered_html = ");
        separated.push_bind_unseparated(maybe_description_rendered_html);
    }
    if let Some(creator_set_visibility) = args.creator_set_visibility {
        separated.push(" creator_set_visibility = ");
        separated.push_bind_unseparated(creator_set_visibility.to_str());
    }
    if let Some(cover_image_option) = args.cover_image {
        match cover_image_option {
            CoverImageOption::ClearCoverImage => {
                separated.push(" maybe_cover_image_media_file_token = NULL ");
            }
            CoverImageOption::SetCoverImage(media_file_token) => {
                separated.push(" maybe_cover_image_media_file_token = ");
                separated.push_bind_unseparated(media_file_token.as_str());
            }
        }
    }
    if let Some(ietf_language_tag) = args.ietf_language_tag {
        if let Some(ietf_primary_language_subtag) = args.ietf_primary_language_subtag {
            separated.push(" maybe_ietf_language_tag = ");
            separated.push_bind_unseparated(ietf_language_tag);

            separated.push(" maybe_ietf_primary_language_subtag = ");
            separated.push_bind_unseparated(ietf_primary_language_subtag);
        }
    }

    separated.push("version = version + 1");

    separated.push_unseparated(" WHERE token = ");
    separated.push_bind_unseparated(args.weight_token.as_str());
    separated.push_unseparated(" LIMIT 1");

    let query = query_builder.build();
    let _r = args.transactor.execute(query).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    // Template
    use sqlx::mysql::MySqlPoolOptions;
    use tokio;

    use errors::AnyhowResult;

    use crate::config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;

    #[ignore]
    #[tokio::test]
    async fn test_update_weights() -> AnyhowResult<()> {
        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;

        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string)
            .await?;

        Ok(())
    }
}