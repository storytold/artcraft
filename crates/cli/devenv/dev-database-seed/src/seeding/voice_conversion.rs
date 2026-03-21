use log::info;
use sqlx::{MySql, Pool};

use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::{anyhow, AnyhowResult};
use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use mysql_queries::queries::voice_conversion::models::insert_voice_conversion_model_from_download_job::{insert_voice_conversion_model_from_download_job, InsertVoiceConversionModelArgs};
use tokens::tokens::users::UserToken;

use crate::seeding::users::HANASHI_USERNAME;

pub async fn seed_voice_conversion(mysql_pool: &Pool<MySql>) -> AnyhowResult<()> {
  info!("Seeding voice conversion...");

  let user_token = match get_user_token_by_username(HANASHI_USERNAME, mysql_pool).await? {
    None => { return Err(anyhow!("could not find user hanashi")) }
    Some(token) => token,
  };

  let rvc_models = [
    // NB: The bucket hashes here are already uploaded to the development Google Cloud Storage
    // bucket and should be usable if you have the development secrets on your machine.
    ("Eric Cartman", "4t9d3y4ve807q69t806pw352dx82h83dzf52bfrp9s9z63gqsxgyezxf8fzdn9yn", true),
    ("Stewie", "bvfe3zwvqnrv64rrtvva1f3r2p2k5tpznfejbh90r353brzqfkveytzyt4cy73hs", true),
    ("Yoda", "cqbcbjsbdy77s4g525nrs791s035b13wew7rp6pep49sx0xr8pqr5af5sseqtkq7", false),
  ];

  for (title, private_bucket_hash, has_index_file) in rvc_models {
    create_rvc_model(title, private_bucket_hash, has_index_file, &user_token, mysql_pool).await?;
  }

  Ok(())
}

async fn create_rvc_model(
  title: &str,
  private_bucket_hash: &str,
  has_index_file: bool,
  creator_user_token: &UserToken,
  mysql_pool: &Pool<MySql>,
) -> AnyhowResult<()> {

  info!("Creating voice conversion record");

  insert_voice_conversion_model_from_download_job(InsertVoiceConversionModelArgs {
    model_type: VoiceConversionModelType::RvcV2,
    maybe_new_weights_token: None,
    title,
    original_download_url: "https://example.com",
    original_filename: "unknown.zip",
    file_size_bytes: 1234,
    creator_user_token,
    creator_ip_address: "127.0.0.1",
    creator_set_visibility: Default::default(),
    has_index_file,
    private_bucket_hash,
    private_bucket_object_name: "unused",
    mysql_pool,
  }).await?;

  Ok(())
}
