use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize, Clone)]
pub struct ModelWeightForTts {
  pub token: ModelWeightToken,
  pub weight_type: WeightsType,

  pub title: String,

  // We only supported tacotron2 in the legacy case
  //pub tts_model_type: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  // NB: We won't port these...
  //pub is_locked_from_use: bool,
  //pub is_front_page_featured: bool,
  //pub is_twitch_featured: bool,
  //pub maybe_suggested_unique_bot_command: Option<String>,
  //pub user_ratings_positive_count: u32,
  //pub user_ratings_negative_count: u32,
  //pub user_ratings_total_count: u32, // NB: Does not include "neutral" ratings.

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// TODO(bt,2024-01-13): This is written to support the migration to the `model_weights`
//  table from the `tts_models` table. We should write a more cross-cutting
//  query to treat this not as a special cased thing. All weights should be listable.

/// This is to support the tts model list page.
/// Later this will be migrated or replaced with a more generic query.
pub async fn list_model_weights_for_text_to_speech(
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<ModelWeightForTts>> {

  let models =
      list_tts_models_for_all_creators(mysql_connection).await?;

  Ok(models.into_iter()
      .map(|model| {
        ModelWeightForTts {
          token: model.token,
          weight_type: model.weight_type,
          creator_user_token: model.creator_user_token,
          creator_username: model.creator_username,
          creator_display_name: model.creator_display_name,
          creator_gravatar_hash: model.creator_gravatar_hash,
          title: model.title,
          ietf_language_tag: model.ietf_language_tag.unwrap_or("en".to_string()),
          ietf_primary_language_subtag: model.ietf_primary_language_subtag.unwrap_or("en".to_string()),
          creator_set_visibility: model.creator_set_visibility,
          created_at: model.created_at,
          updated_at: model.updated_at,
        }
      })
      .collect::<Vec<ModelWeightForTts>>())
}

async fn list_tts_models_for_all_creators(
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<RawModelWeightForTts>> {
  // NB: Scoped to only tt2 weights
  let maybe_results = sqlx::query_as!(
    RawModelWeightForTts,
    r#"
SELECT
    w.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
    w.weights_type as `weight_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
    w.title,
    w.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    w_extension.ietf_language_tag,
    w_extension.ietf_primary_language_subtag,
    w.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    w.created_at,
    w.updated_at
FROM model_weights as w
LEFT OUTER JOIN model_weights_extension_tts_details as w_extension
    ON w_extension.model_weights_token = w.token
JOIN users
    ON users.token = w.creator_user_token
WHERE
    w.weights_type IN ("tt2")
    AND w.user_deleted_at IS NULL
    AND w.mod_deleted_at IS NULL
    "#
  )
      .fetch_all(&mut **mysql_connection)
      .await;

  match maybe_results {
    Ok(results) => Ok(results),
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(Vec::new()),
      _ => {
        Err(anyhow!("error querying : {:?}", err))
      }
    }
  }
}

struct RawModelWeightForTts {
  pub token: ModelWeightToken,
  pub weight_type: WeightsType,

  pub title: String,

  // We only supported tacotron2 in the legacy case
  //pub tts_model_type: String,

  pub ietf_language_tag: Option<String>,
  pub ietf_primary_language_subtag: Option<String>,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  // NB: We won't port these...
  //pub is_locked_from_use: bool,
  //pub is_front_page_featured: bool,
  //pub is_twitch_featured: bool,
  //pub maybe_suggested_unique_bot_command: Option<String>,
  //pub user_ratings_positive_count: u32,
  //pub user_ratings_negative_count: u32,
  //pub user_ratings_total_count: u32, // NB: Does not include "neutral" ratings.

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
