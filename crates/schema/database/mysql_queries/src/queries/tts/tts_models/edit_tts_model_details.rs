use sqlx;
use sqlx::mysql::MySqlQueryResult;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;

use crate::column_types::vocoder_type::VocoderType;

pub async fn edit_tts_model_details_as_author(
  mysql_pool: &MySqlPool,
  tts_model_token: &str,
  title: Option<&str>,
  description_markdown: Option<&str>,
  description_html: Option<&str>,
  ietf_language_tag: &str,
  ietf_primary_language_subtag: &str,
  creator_set_visibility: Visibility,
  maybe_default_pretrained_vocoder: Option<VocoderType>,
  maybe_custom_vocoder_token: Option<&str>,
  text_pipeline_type: Option<&str>,
  // Author fields
  author_ip_address: &str,
) -> Result<MySqlQueryResult, sqlx::Error> {
  // We need to store the IP address details.
  sqlx::query!(
        r#"
UPDATE tts_models
SET
    maybe_default_pretrained_vocoder = ?,
    maybe_custom_vocoder_token = ?,
    text_pipeline_type = ?,
    title = ?,
    description_markdown = ?,
    description_rendered_html = ?,
    ietf_language_tag = ?,
    ietf_primary_language_subtag = ?,
    creator_set_visibility = ?,
    creator_ip_address_last_update = ?,
    version = version + 1
WHERE token = ?
LIMIT 1
        "#,
      maybe_default_pretrained_vocoder.map(|v| v.to_str()),
      maybe_custom_vocoder_token,
      text_pipeline_type,
      title,
      description_markdown,
      description_html,
      ietf_language_tag,
      ietf_primary_language_subtag,
      &creator_set_visibility.to_str(),
      author_ip_address,
      tts_model_token,
    )
      .execute(mysql_pool)
      .await
}

pub async fn edit_tts_model_details_as_mod(
  mysql_pool: &MySqlPool,
  tts_model_token: &str,
  title: Option<&str>,
  description_markdown: Option<&str>,
  description_html: Option<&str>,
  ietf_language_tag: &str,
  ietf_primary_language_subtag: &str,
  creator_set_visibility: Visibility,
  maybe_default_pretrained_vocoder: Option<VocoderType>,
  maybe_custom_vocoder_token: Option<&str>,
  text_pipeline_type: Option<&str>,
  // moderator fields
  moderator_user_token: &str,
) -> Result<MySqlQueryResult, sqlx::Error> {
  // We need to store the moderator details.
  sqlx::query!(
        r#"
UPDATE tts_models
SET
    maybe_default_pretrained_vocoder = ?,
    maybe_custom_vocoder_token = ?,
    text_pipeline_type = ?,
    title = ?,
    description_markdown = ?,
    description_rendered_html = ?,
    ietf_language_tag = ?,
    ietf_primary_language_subtag = ?,
    creator_set_visibility = ?,
    maybe_mod_user_token = ?,
    version = version + 1
WHERE token = ?
LIMIT 1
        "#,
      maybe_default_pretrained_vocoder.map(|v| v.to_str()),
      maybe_custom_vocoder_token,
      text_pipeline_type,
      title,
      description_markdown,
      description_html,
      ietf_language_tag,
      ietf_primary_language_subtag,
      &creator_set_visibility.to_str(),
      moderator_user_token,
      tts_model_token,
    )
      .execute(mysql_pool)
      .await
}
