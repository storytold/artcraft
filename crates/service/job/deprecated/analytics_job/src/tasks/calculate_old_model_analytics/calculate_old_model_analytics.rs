use std::time::Duration;

use log::info;
use rand::seq::SliceRandom;
use rand::thread_rng;
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums::by_table::trending_model_analytics::window_name::WindowName;
use errors::AnyhowResult;
use mysql_queries::queries::trending_model_analytics::upsert_trending_model_analytics::{Args, ModelToken, upsert_trending_model_analytics};
use mysql_queries::queries::tts::tts_models::count_tts_model_uses::count_tts_model_uses;
use mysql_queries::queries::tts::tts_models::count_tts_model_uses_total::count_tts_model_uses_total;
use mysql_queries::queries::tts::tts_models::list_all_tts_model_tokens::{list_all_tts_model_tokens, TtsModelTokens};
use tokens::tokens::tts_models::TtsModelToken;

use crate::job_state::JobState;

// TODO(bt, 2023-01-16): Make a job trait and make this an instance.
//  Jobs can store state, batch progress, and not starve one another.
//  It'll be easier to interleave jobs.

pub async fn calculate_old_model_analytics(job_state: &JobState) -> AnyhowResult<()> {
  // TODO(bt, 2023-01-16): It's conceivable the pool connection dies mid-workload and we starve
  //  our tokens. An ideal fix would be a self-healing pool connection, but for now we'll use
  //  ugly hacks.
  let mut mysql_connection = job_state.mysql_pool.acquire().await?;

  let tokens = query_all_model_tokens(&mut mysql_connection).await?;

  tokio::time::sleep(Duration::from_millis(100)).await;

  for token in tokens.tokens {
    info!("Running analytics for TTS model {}", token.token);

    let _r = query_single_model_statistics(
      job_state,
      &mut mysql_connection,
      &token.token).await;

    tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_job_wait_millis)).await;
  }

  Ok(())
}

async fn query_all_model_tokens(
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<TtsModelTokens> {
  let mut tokens = list_all_tts_model_tokens(mysql_connection).await?;

  // NB: This is just a hack to not starve the work queue. We should replace this with a
  // self-healing connection and batch cursors.
  let mut rng = thread_rng();
  tokens.tokens.shuffle(&mut rng);

  Ok(tokens)
}

async fn query_single_model_statistics(
  job_state: &JobState,
  mysql_connection: &mut PoolConnection<MySql>,
  model_token: &TtsModelToken,
) -> AnyhowResult<()> {
  {
    let three_hours_in_minutes = 60 * 3;

    let result = count_tts_model_uses(
      model_token,
      three_hours_in_minutes,
      mysql_connection).await?;

    info!("TTS model {} uses {} times (three hours)", model_token, result.use_count);

    let _r = upsert_trending_model_analytics(Args {
      model_token: ModelToken::Tts(model_token),
      window_name: WindowName::Last3Hours,
      numeric_value: result.use_count,
      mysql_connection,
    }).await?;
  }

  tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_query_wait_millis)).await;

  {
    let three_days_in_minutes = 60 * 24 * 3;

    let result = count_tts_model_uses(
      model_token,
      three_days_in_minutes,
      mysql_connection).await?;

    info!("TTS model {} uses {} times (three days)", model_token, result.use_count);

    let _r = upsert_trending_model_analytics(Args {
      model_token: ModelToken::Tts(model_token),
      window_name: WindowName::Last3Days,
      numeric_value: result.use_count,
      mysql_connection,
    }).await?;
  }

  tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_query_wait_millis)).await;

  {
    let result = count_tts_model_uses_total(
      model_token,
      mysql_connection).await?;

    info!("TTS model {} uses {} times (total)", model_token, result.total_use_count);

    let _r = upsert_trending_model_analytics(Args {
      model_token: ModelToken::Tts(model_token),
      window_name: WindowName::AllTime,
      numeric_value: result.total_use_count,
      mysql_connection,
    }).await?;
  }

  Ok(())
}
