use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};

#[derive(Clone, Serialize, Deserialize)]
pub struct ModelWeightForLegacyTtsEnqueue {
    pub token: ModelWeightToken,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,

    pub creator_user_token: UserToken,
    pub creator_set_visibility: Visibility,

    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_weight_for_legacy_tts_enqueue(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_pool: &MySqlPool
) -> AnyhowResult<Option<ModelWeightForLegacyTtsEnqueue>> {
    let mut connection = mysql_pool.acquire().await?;
    get_weight_for_legacy_tts_enqueue_with_connection(weight_token, can_see_deleted, &mut connection).await
}

pub async fn get_weight_for_legacy_tts_enqueue_with_connection(
    weight_token: &ModelWeightToken,
    can_see_deleted: bool,
    mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<ModelWeightForLegacyTtsEnqueue>> {
    let maybe_result = if can_see_deleted {
        select_include_deleted(weight_token, mysql_connection).await
    } else {
        select_without_deleted(weight_token, mysql_connection).await
    };

    let record: RawWeight = match maybe_result {
        Ok(record) => record,
        Err(sqlx::Error::RowNotFound) => {
            return Ok(None);
        }
        Err(err) => {
            error!("Error fetching weights by token: {:?}", err);
            return Err(anyhow!("Error fetching weights by token: {:?}", err));
        }
    };

    Ok(Some(ModelWeightForLegacyTtsEnqueue {
        token: record.token,
        weights_type: record.weights_type,
        weights_category: record.weights_category,
        creator_user_token: record.creator_user_token,
        creator_set_visibility: record.creator_set_visibility,
        user_deleted_at: record.user_deleted_at,
        mod_deleted_at: record.mod_deleted_at,
    }))
}

async fn select_include_deleted(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<RawWeight, sqlx::Error> {
    sqlx
        ::query_as!(
            RawWeight,
            r#"
        SELECT
        wt.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        wt.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
        wt.weights_category as `weights_category: enums_db::by_table::model_weights::weights_category::WeightsCategory`,

        wt.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
        wt.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

        wt.user_deleted_at,
        wt.mod_deleted_at

        FROM model_weights as wt
        WHERE
            wt.token = ?
            "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

async fn select_without_deleted(
    weight_token: &ModelWeightToken,
    mysql_connection: &mut PoolConnection<MySql>
) -> Result<RawWeight, sqlx::Error> {
    sqlx
        ::query_as!(
            RawWeight,
            r#"
        SELECT
        wt.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        wt.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
        wt.weights_category as `weights_category: enums_db::by_table::model_weights::weights_category::WeightsCategory`,

        wt.creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,
        wt.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

        wt.user_deleted_at,
        wt.mod_deleted_at

        FROM model_weights as wt
        WHERE
            wt.token = ?
            AND wt.user_deleted_at IS NULL
            AND wt.mod_deleted_at IS NULL
        "#,
            weight_token.as_str()
        )
        .fetch_one(&mut **mysql_connection).await
}

// RawWeight is the struct that is returned from the database in raw form.
#[derive(Serialize)]
struct RawWeight {
    pub token: ModelWeightToken,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,

    pub creator_user_token: UserToken,
    pub creator_set_visibility: Visibility,

    pub user_deleted_at: Option<DateTime<Utc>>,
    pub mod_deleted_at: Option<DateTime<Utc>>,
}
