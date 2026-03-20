use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::model_weights::weights_types::WeightsType;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::queries::model_weights::model_weight_info_lite::model_weight_info_lite::ModelWeightInfoLite;

pub async fn list_model_weight_info_lite(
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Vec<ModelWeightInfoLite>> {
  let mut connection = mysql_pool.acquire().await?;
  list_model_weight_info_lite_with_connection(&mut connection).await
}

pub async fn list_model_weight_info_lite_with_connection(
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<ModelWeightInfoLite>> {

  let models = sqlx::query_as!(
      RawModelWeightsInfoLite,
        r#"
SELECT
    w.token as `token: tokens::tokens::model_weights::ModelWeightToken`,
    w.weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`
FROM model_weights as w
        "#)
          .fetch_all(&mut **mysql_connection)
          .await?;

  Ok(models.into_iter()
    .map(|model| {
      ModelWeightInfoLite {
        token: model.token,
        weights_type: model.weights_type,
      }
    })
    .collect::<Vec<_>>())
}

struct RawModelWeightsInfoLite {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,
}
