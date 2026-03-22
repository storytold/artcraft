use anyhow::anyhow;
use log::warn;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::AnyhowResult;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

use crate::queries::voice_conversion::model_info_lite::model_info_lite::VoiceConversionModelInfoLite;

pub async fn get_voice_conversion_model_info_lite(
  token: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<VoiceConversionModelInfoLite>> {
  let mut connection = mysql_pool.acquire().await?;
  get_voice_conversion_model_info_lite_with_connection(token, &mut connection).await
}

pub async fn get_voice_conversion_model_info_lite_with_connection(
  token: &str,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<VoiceConversionModelInfoLite>> {

  let maybe_model= sqlx::query_as!(
      RawVoiceConversionModelInfoLite,
        r#"
SELECT
    vc.token as `token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,
    vc.model_type as `model_type: enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType`
FROM voice_conversion_models as vc
WHERE vc.token = ?
        "#,
    token
  )
          .fetch_one(&mut **mysql_connection)
          .await;

  let model : RawVoiceConversionModelInfoLite = match maybe_model {
    Ok(model) => model,
    Err(err) => {
      return match err {
        sqlx::Error::RowNotFound => {
          Ok(None)
        },
        _ => {
          warn!("voice conversion model query error: {:?}", err);
          Err(anyhow!("error querying voce conversion model info lite: {:?}", err))
        }
      }
    }
  };

  Ok(Some(VoiceConversionModelInfoLite {
    token: model.token,
    model_type: model.model_type,
  }))
}

struct RawVoiceConversionModelInfoLite {
  pub token: VoiceConversionModelToken,
  pub model_type: VoiceConversionModelType,
}
