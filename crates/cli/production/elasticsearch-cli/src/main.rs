//! elasticsearch-cli
//!
//! This is not a dev seed tool, but rather an operational tool meant to interface with both
//! development and production.
//!
//! The intent is to be able to quickly populate documents and indices.
//!

use elasticsearch::http::transport::Transport;
use elasticsearch::Elasticsearch;
use log::info;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::{MySql, Pool};
use std::collections::HashSet;
use std::iter::FromIterator;

use config::shared_constants::DEFAULT_RUST_LOG;
use elasticsearch_schema::searches::search_tts_models::search_tts_models;
use errors::AnyhowResult;

use crate::cli_args::{parse_cli_args, Action, Environment};
use crate::plans::create_all_tts_documents::create_all_tts_documents;
use crate::plans::media_files::create_dimensional_media_file_documents::create_dimensional_media_file_documents;
use crate::plans::media_files::test_search_media_files_documents::test_search_media_files;
use crate::plans::model_weights::create_all_model_weight_documents::create_all_model_weight_documents;
use crate::plans::model_weights::evaluate::evaluate_model_weights_search::evaluate_model_weights_search;
use crate::plans::model_weights::test_search_model_weights_documents::test_search_model_weights_documents;

pub mod cli_args;
pub mod plans;

#[tokio::main]
pub async fn main() -> AnyhowResult<()> {
  println!("elasticsearch-cli: operational tooling for Elasticsearch");

  easyenv::init_all_with_default_logging(Some("info"));

  // NB: This secrets file differs from the rest because we might actually want to cross
  // development/production boundaries for seeding, or scope to production for rebuilding indices.
  // We don't want to pull in secrets from other sources. (Hopefully this isn't getting out of
  // hand at this point.)
  easyenv::from_filename(".env-elasticsearch-secrets")?;

  let args = parse_cli_args()?;

  let mysql= get_mysql(args.mysql_environment).await?;
  let elasticsearch = get_elasticsearch_client(args.elasticsearch_environment)?;

  match args.action {
    Action::ReindexTts => {
      info!("Reindexing TTS...");
      create_all_tts_documents(&mysql, &elasticsearch).await?;
    }
    Action::SearchTts => {
      info!("Searching TTS...");
      let _results = search_tts_models(&elasticsearch, "zel", Some("en")).await?;
    }
    Action::ReindexModelWeights => {
      info!("Reindexing model weights...");
      create_all_model_weight_documents(&mysql, &elasticsearch).await?;
    }
    Action::SearchModelWeights => {
      info!("Searching model weights...");
      let results = test_search_model_weights_documents(&elasticsearch).await?;

      for result in results {
        println!("Result: {:#?}", result);
      }
    }
    Action::EvaluateModelWeights => {
      info!("Evaluate model weights search...");
      let _ = evaluate_model_weights_search(&elasticsearch).await?;
    }
    Action::ReindexMediaFiles => {
      info!("Reindexing media files...");
      create_dimensional_media_file_documents(&mysql, &elasticsearch).await?;
    }
    Action::SearchMediaFiles => {
      info!("Search media files...");
      test_search_media_files(&elasticsearch).await?;
    }
  }

  info!("Done!");
  Ok(())
}

async fn get_mysql(environment: Environment) -> AnyhowResult<Pool<MySql>> {
  info!("Connecting to {:?} MySQL...", environment);

  let connection_string_env = match environment {
    Environment::Development => "MYSQL_DEVELOPMENT_URL",
    Environment::Production => "MYSQL_PRODUCTION_URL",
  };

  let pool = MySqlPoolOptions::new()
      .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 3)?)
      .connect(&easyenv::get_env_string_required(connection_string_env)?)
      .await?;

  Ok(pool)
}

fn get_elasticsearch_client(environment: Environment) -> AnyhowResult<Elasticsearch> {
  info!("Connecting to {:?} Elasticsearch...", environment);

  let connection_string_env = match environment {
    Environment::Development => "ELASTICSEARCH_DEVELOPMENT_URL",
    Environment::Production => "ELASTICSEARCH_PRODUCTION_URL",
  };

  let transport = Transport::single_node(&easyenv::get_env_string_required(connection_string_env)?)?;

  // TODO(bt,2023-10-26): Allow connecting to instances by URL instead of the default dev URL.
  let client = Elasticsearch::new(transport);
  Ok(client)
}
