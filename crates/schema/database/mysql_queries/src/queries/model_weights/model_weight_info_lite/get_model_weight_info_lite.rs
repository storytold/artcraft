use anyhow::anyhow;
use log::warn;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_types::WeightsType;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::queries::model_weights::model_weight_info_lite::model_weight_info_lite::ModelWeightInfoLite;

pub async fn get_model_weight_info_lite(
  token: &ModelWeightToken,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<ModelWeightInfoLite>> {
  let mut connection = mysql_pool.acquire().await?;
  get_model_weight_info_lite_with_connection(token, &mut connection).await
}

pub async fn get_model_weight_info_lite_with_connection(
  token: &ModelWeightToken,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<ModelWeightInfoLite>> {

  let maybe_model= sqlx::query_as!(
      RawModelWeightInfoLite,
        r#"
SELECT
    m.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
    m.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`
FROM model_weights as m
WHERE m.token = ?
        "#,
    token
  )
          .fetch_one(&mut **mysql_connection)
          .await;

  let model : RawModelWeightInfoLite = match maybe_model {
    Ok(model) => model,
    Err(err) => {
      return match err {
        sqlx::Error::RowNotFound => {
          Ok(None)
        },
        _ => {
          warn!("error querying model weight info lite: {:?}", err);
          Err(anyhow!("error querying model weight info lite: {:?}", err))
        }
      }
    }
  };

  Ok(Some(ModelWeightInfoLite {
    token: model.token,
    weights_type: model.weights_type,
  }))
}

struct RawModelWeightInfoLite {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,
}
