use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize, Clone)]
pub struct ModelWeightForVoiceConversion {
  pub token: ModelWeightToken,
  pub weight_type: WeightsType,

  pub title: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  // TODO(bt,2023-12-18): This should probably live in the extension table.
  //pub is_front_page_featured: bool,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// TODO(bt,2023-12-18): This is written to support the migration to the `model_weights`
//  table from the `voice_conversion_models` table. We should write a more cross-cutting
//  query to treat this not as a special cased thing. All weights should be listable.

/// This is to support the voice conversion list page.
/// Later this will be migrated or replaced with a more generic query.
pub async fn list_model_weights_for_voice_conversion(
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<ModelWeightForVoiceConversion>> {

  let models =
      list_voice_conversion_models_for_all_creators(mysql_connection).await?;

  Ok(models.into_iter()
      .map(|model| {
        ModelWeightForVoiceConversion {
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
      .collect::<Vec<ModelWeightForVoiceConversion>>())
}

async fn list_voice_conversion_models_for_all_creators(
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<RawModelWeightForVoiceConversion>> {
  // NB: Scoped to only rvc_v2 and so_vits_svc weights
  let maybe_results = sqlx::query_as!(
    RawModelWeightForVoiceConversion,
    r#"
SELECT
    w.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
    w.weights_type as `weight_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
    w.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash as creator_gravatar_hash,
    w.title,
    w_extension.ietf_language_tag,
    w_extension.ietf_primary_language_subtag,
    w.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
    w.created_at,
    w.updated_at
FROM model_weights as w
LEFT OUTER JOIN model_weights_extension_voice_conversion_details as w_extension
    ON w_extension.model_weights_token = w.token
JOIN users
    ON users.token = w.creator_user_token
WHERE
    w.weights_type IN ("rvc_v2", "so_vits_svc")
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

struct RawModelWeightForVoiceConversion {
  pub token: ModelWeightToken,
  pub weight_type: WeightsType,

  pub title: String,

  pub ietf_language_tag: Option<String>,
  pub ietf_primary_language_subtag: Option<String>,

  pub creator_user_token: UserToken,
  pub creator_username: String,
  pub creator_display_name: String,
  pub creator_gravatar_hash: String,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
