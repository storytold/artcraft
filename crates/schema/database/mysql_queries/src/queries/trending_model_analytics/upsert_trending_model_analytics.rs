use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums_db::by_table::trending_model_analytics::model_type::ModelType;
use enums_db::by_table::trending_model_analytics::window_name::WindowName;
use errors::AnyhowResult;
use tokens::tokens::tts_models::TtsModelToken;

// NB: Only TTS for now. New enum variants for other token types.
pub enum ModelToken<'a> {
  Tts(&'a TtsModelToken),
}

pub struct Args<'a> {
  pub model_token: ModelToken<'a>,
  pub window_name: WindowName,
  pub numeric_value: u64,
  pub mysql_connection: &'a mut PoolConnection<MySql>,
}

pub async fn upsert_trending_model_analytics(args: Args<'_>) -> AnyhowResult<()> {

  let (model_type, model_token) = match args.model_token {
    ModelToken::Tts(ref token) => (ModelType::Tts, token.as_str()),
  };

  let query = sqlx::query!(
        r#"
INSERT INTO trending_model_analytics
SET
  model_type = ?,
  model_token = ?,
  window_name = ?,
  numeric_value = ?,
  version = 1

ON DUPLICATE KEY UPDATE
  numeric_value = ?,
  version = version + 1
        "#,
      // Insert
      model_type,
      model_token,
      args.window_name,
      args.numeric_value,
      args.numeric_value,
    );

  let _r = query.execute(&mut **args.mysql_connection).await?;
  Ok(())
}
