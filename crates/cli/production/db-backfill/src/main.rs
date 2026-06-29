use std::io::Write;

use chrono::Local;
use log::{info, LevelFilter};
use sqlx::{MySql, Pool};
use sqlx::mysql::MySqlPoolOptions;

use easyenv::env_logger::Builder;
use easyenv::init_all_with_default_logging;
use errors::AnyhowResult;

use crate::args::{Command, parse_cli_args};
use crate::operations::backfill_user_spend_events::backfill_user_spend_events::backfill_user_spend_events;
use crate::operations::backfill_user_spend_events::sub_args::parse_backfill_user_spend_events_args;
use crate::operations::calculate_legacy_tts_results_usages::calculate_legacy_tts_results_usages::calculate_legacy_tts_result_usages;
use crate::operations::calculate_model_weights_usages::run_migration::run_migration;

pub mod args;
pub mod operations;

//#[tokio::main(flavor = "multi_thread", worker_threads = 16)]
#[tokio::main]
async fn main() -> AnyhowResult<()> {
  println!("db-backfill: run backfill or migration operations");

  // init_all_with_default_logging(None);
  Builder::new()
      .format(|buf, record| {
        writeln!(
          buf,
          "{} [{}] {}",
          Local::now().format("%Y-%m-%dT%H:%M:%S"),
          record.level(),
          record.args()
        )
      })
      .filter(None, LevelFilter::Info)
      .init();

  let command = parse_cli_args()?;

  // NB: This secrets file differs from the rest because we might want to backfill production from local dev.
  // (Hopefully this isn't getting out of hand at this point.)
  easyenv::from_filename(".env-db-backfill-secrets")?;

  info!("dispatching command: {:?}", command);

  match command.sub_command {
    Command::CalculateModelWeightsUsages => {
      let mysql = get_mysql("MYSQL_PRODUCTION_URL").await?;
      run_migration(mysql).await?
    }
    Command::CalculateLegacyTtsResultsUsages => {
      let mysql = get_mysql("MYSQL_PRODUCTION_URL").await?;
      calculate_legacy_tts_result_usages(mysql).await?
    }
    Command::BackfillUserSpendEvents => {
      // Read pool = the replica (source); write pool = your target DB (local in
      // a dry run, prod when you go live). Stripe key = the ArtCraft account.
      let sub_args = parse_backfill_user_spend_events_args();
      let read_pool = get_mysql("MYSQL_READ_URL").await?;
      let write_pool = get_mysql("MYSQL_WRITE_URL").await?;
      let stripe_client = stripe::Client::new(easyenv::get_env_string_required("STRIPE_ARTCRAFT_SECRET_KEY")?);
      backfill_user_spend_events(&read_pool, &write_pool, &stripe_client, sub_args).await?;
    }
  }

  Ok(())
}

async fn get_mysql(env_var_name: &str) -> AnyhowResult<Pool<MySql>> {
  info!("Connecting to MySQL {env_var_name}...");

  let pool = MySqlPoolOptions::new()
      .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 20)?)
      .connect(&easyenv::get_env_string_required(env_var_name)?)
      .await?;

  Ok(pool)
}
