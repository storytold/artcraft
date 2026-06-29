use std::io::Write;

use chrono::Local;
use log::{info, warn, LevelFilter};
use sqlx::{MySql, Pool};
use sqlx::mysql::MySqlPoolOptions;

use easyenv::env_logger::Builder;
use easyenv::init_all_with_default_logging;
use errors::AnyhowResult;

use crate::args::{Command, parse_cli_args};
use crate::operations::backfill_user_spend_events::backfill_user_spend_events::backfill_user_spend_events;
use crate::operations::backfill_user_spend_events::stripe_api::StripeApi;
use crate::operations::backfill_user_spend_events::sub_args::parse_backfill_user_spend_events_args;
use crate::operations::calculate_legacy_tts_results_usages::calculate_legacy_tts_results_usages::calculate_legacy_tts_result_usages;
use crate::operations::calculate_model_weights_usages::run_migration::run_migration;

pub mod args;
pub mod operations;

//#[tokio::main(flavor = "multi_thread", worker_threads = 16)]
#[tokio::main]
async fn main() -> AnyhowResult<()> {
  println!("db-backfill: run backfill or migration operations");

  // rustls 0.23 requires a process-wide crypto provider before the first TLS
  // handshake (the replica's `ssl-mode=required` connection and Stripe HTTPS).
  // The dependency graph enables BOTH ring and aws-lc-rs, so rustls refuses to
  // auto-select and panics — install one explicitly. (`Err` = already installed.)
  let _ = rustls::crypto::ring::default_provider().install_default();

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
  // The path is resolved relative to the current working directory — log the
  // absolute path so a "not found" is actionable.
  let secrets_filename = ".env-db-backfill-secrets";
  let secrets_path = std::env::current_dir()
      .map(|dir| dir.join(secrets_filename))
      .unwrap_or_else(|_| std::path::PathBuf::from(secrets_filename));
  info!("Loading secrets from: {}", secrets_path.display());
  // NB: We deliberately do NOT use `dotenv` here. Its parser treats `$`, spaces,
  // and `\` as special INSIDE the value (quoted or not), which mangles DB
  // connection URLs and generated passwords. This loader takes each value
  // verbatim, so `MYSQL_READ_URL=mysql://user:p$ss w@host:25060/db?ssl-mode=required`
  // just works.
  load_secrets_file(&secrets_path)?;

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
      let stripe = StripeApi::new(easyenv::get_env_string_required("STRIPE_ARTCRAFT_SECRET_KEY")?)?;
      backfill_user_spend_events(&read_pool, &write_pool, &stripe, sub_args).await?;
    }
  }

  Ok(())
}

/// Minimal, forgiving `.env`-style loader that sets process env vars from a
/// `KEY=VALUE` file. The value is the remainder of the line taken VERBATIM
/// (after one optional layer of surrounding quotes is stripped). Blank lines and
/// `#` comment lines are ignored. Unlike `dotenv`, it does not interpret `$`,
/// spaces, `\`, or `#` inside the value — so DB URLs and generated passwords
/// pass through unchanged.
fn load_secrets_file(path: &std::path::Path) -> AnyhowResult<()> {
  let contents = std::fs::read_to_string(path)
      .map_err(|err| anyhow::anyhow!("Could not read secrets file at {} : {}", path.display(), err))?;

  let mut loaded_keys: Vec<String> = Vec::new();
  for (line_index, raw_line) in contents.lines().enumerate() {
    let line = raw_line.trim();
    if line.is_empty() || line.starts_with('#') {
      continue;
    }
    let (key, value) = match line.split_once('=') {
      Some((key, value)) => (key.trim(), strip_matching_quotes(value.trim())),
      None => {
        warn!("secrets {}:{}: ignoring line without '=': {:?}", path.display(), line_index + 1, line);
        continue;
      }
    };
    if key.is_empty() {
      warn!("secrets {}:{}: ignoring empty key", path.display(), line_index + 1);
      continue;
    }
    std::env::set_var(key, value);
    loaded_keys.push(key.to_string());
  }

  info!(
    "Loaded {} key(s) from {} ({} bytes): [{}]",
    loaded_keys.len(),
    path.display(),
    contents.len(),
    loaded_keys.join(", "),
  );

  Ok(())
}

#[cfg(test)]
mod secrets_loader_tests {
  use super::strip_matching_quotes;

  // The whole point: a DB URL with a password containing `$`, a space, `#`, and a
  // query string with `=` must survive verbatim (this is exactly what `dotenv` mangled).
  #[test]
  fn url_value_is_taken_verbatim() {
    let line = r#"MYSQL_READ_URL=mysql://user:p$ss w#x@host:25060/db?ssl-mode=required"#;
    let (key, value) = line.split_once('=').unwrap();
    assert_eq!(key.trim(), "MYSQL_READ_URL");
    assert_eq!(
      strip_matching_quotes(value.trim()),
      "mysql://user:p$ss w#x@host:25060/db?ssl-mode=required",
    );
  }

  #[test]
  fn strips_one_layer_of_matching_quotes_only() {
    assert_eq!(strip_matching_quotes("\"abc\""), "abc");
    assert_eq!(strip_matching_quotes("'abc'"), "abc");
    assert_eq!(strip_matching_quotes("abc"), "abc");
    assert_eq!(strip_matching_quotes("\"abc'"), "\"abc'"); // mismatched: untouched
    assert_eq!(strip_matching_quotes("\""), "\"");          // single char: untouched
  }
}

/// Strip a single layer of matching surrounding single or double quotes, if any.
fn strip_matching_quotes(value: &str) -> &str {
  let bytes = value.as_bytes();
  if bytes.len() >= 2 {
    let first = bytes[0];
    let last = bytes[bytes.len() - 1];
    if (first == b'"' && last == b'"') || (first == b'\'' && last == b'\'') {
      return &value[1..value.len() - 1];
    }
  }
  value
}

async fn get_mysql(env_var_name: &str) -> AnyhowResult<Pool<MySql>> {
  let url = easyenv::get_env_string_required(env_var_name)?;
  // Redacted so you can SEE the host + database + params actually being used
  // (e.g. whether a database path is present) without leaking the password.
  info!("Connecting to MySQL {env_var_name}: {}", redact_db_url(&url));

  let pool = MySqlPoolOptions::new()
      .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 20)?)
      .connect(&url)
      .await?;

  Ok(pool)
}

/// Mask the user:password portion of a DB URL for logging, leaving scheme, host,
/// port, database path, and query params visible.
fn redact_db_url(url: &str) -> String {
  if let Some(scheme_end) = url.find("://") {
    let after = &url[scheme_end + 3..];
    if let Some(at) = after.rfind('@') {
      return format!("{}://***@{}", &url[..scheme_end], &after[at + 1..]);
    }
  }
  url.to_string()
}
