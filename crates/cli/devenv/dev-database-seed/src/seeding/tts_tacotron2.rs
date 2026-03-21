use std::path::Path;

use log::{info, warn};
use sqlx::{MySql, Pool};

use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use enums_db::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::file_read_bytes::file_read_bytes;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::tts::tts_models::get_tts_model::get_tts_model_by_token;
use mysql_queries::queries::tts::tts_models::insert_tts_model_from_download_job::{insert_tts_model_from_download_job, InsertTtsModelFromDownloadJobArgs};
use storyteller_root::get_seed_tool_data_root;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::users::UserToken;

use crate::bucket_clients::BucketClients;
use crate::seeding::users::HANASHI_USER_TOKEN;

pub async fn seed_tts_tacotron2(mysql_pool: &Pool<MySql>, maybe_bucket_clients: Option<&BucketClients>) -> AnyhowResult<()> {
  info!("Seeding TTS (Tacotron2)...");

  // NB: This is idempotent and will only install the models once.
  let tts_models = [
    ("Mai Valentine from Yugioh (by Vegito)", HANASHI_USER_TOKEN, "TM:cknxtj6mx3t3", "models/tts/tacotron2/MaiYugioh.pth"),
    ("Nagito (by Vegito)", HANASHI_USER_TOKEN, "TM:tmhxapghwaf3", "models/tts/tacotron2/Nagito.pth"),
    ("Son Goku V2 (by Vegito, Arpabet version)", HANASHI_USER_TOKEN, "TM:kbvaa4726jdw", "models/tts/tacotron2/SonGokuV2.pth"),
    ("Vegeta (by Vegito, Arpabet version)", HANASHI_USER_TOKEN, "TM:kvv9xqashp6n", "models/tts/tacotron2/VegetaNew.pth"),
  ];

  let seed_tool_data_root = get_seed_tool_data_root();

  // TODO(bt,2023-11-27): DO NOT USE BucketPathUnifier for any new code. Only for TT2 and super legacy systems.
  let bucket_path_unifier = BucketPathUnifier::default_paths();

  for (model_title, user_token, tts_model_token, subdirectory_path) in tts_models {
    let user_token = UserToken::new_from_str(user_token);
    let tts_model_token = TtsModelToken::new_from_str(tts_model_token);

    let mut model_file_path = seed_tool_data_root.clone();
    model_file_path.push(subdirectory_path);

    let result = seed_model(
      &mysql_pool,
      &tts_model_token,
      model_title,
      &user_token,
      &model_file_path,
      maybe_bucket_clients,
      &bucket_path_unifier
    ).await;

    match result {
      Ok(_) => info!("Seeded {}", model_title),
      Err(err) => warn!(r#"
        Could not TTS model {} : {:?}
        (No worries: if there's a duplicate key error, we probably already
        seeded the TTS model on a previous invocation!)
      "#, model_title, err),
    }
  }

  Ok(())
}

async fn seed_model(
  mysql_pool: &Pool<MySql>,
  tts_model_token: &TtsModelToken,
  model_title: &str,
  user_token: &UserToken,
  model_file_path: &Path,
  maybe_bucket_clients: Option<&BucketClients>,
  bucket_path_unifier: &BucketPathUnifier,
) -> AnyhowResult<()> {
  info!("Seeding TTS model {} ...", model_title);

  let mut private_bucket_hash = "NOT_UPLOADED_BY_SEED_TOOL".to_string();
  let mut private_bucket_object_name = "NOT_UPLOADED_BY_SEED_TOOL".to_string();

  if tts_model_exists(mysql_pool, tts_model_token).await? {
    info!("Model already seeded: {:?}", tts_model_token);
    return Ok(())
  }

  if let Some(bucket_clients) = maybe_bucket_clients {
    let bucket_details = seed_file_to_bucket(model_file_path, bucket_clients, bucket_path_unifier).await?;
    private_bucket_hash = bucket_details.bucket_hash;
    private_bucket_object_name = bucket_details.bucket_object_name;
  }

  let filename = model_file_path
      .file_name()
      .map(|name| name.to_str())
      .flatten()
      .unwrap_or("");

  insert_tts_model_from_download_job(InsertTtsModelFromDownloadJobArgs {
    tts_model_type: TtsModelType::Tacotron2,
    title: model_title,
    original_download_url: "https://example.com",
    original_filename: filename,
    file_size_bytes: 0,
    creator_user_token: user_token,
    creator_ip_address: "127.0.0.1",
    creator_set_visibility: Visibility::Public,
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: &private_bucket_object_name,
    maybe_model_token: Some(&tts_model_token),
    mysql_pool,
  }).await?;

  Ok(())
}

async fn tts_model_exists(
  mysql_pool: &Pool<MySql>,
  tts_model_token: &TtsModelToken,
) -> AnyhowResult<bool> {

  const CAN_SEE_DELETED : bool = true;

  let maybe_model = get_tts_model_by_token(
    tts_model_token.as_str(),
    CAN_SEE_DELETED,
    mysql_pool
  ).await?;

  Ok(maybe_model.is_some())
}

struct BucketDetails {
  bucket_hash: String,
  bucket_object_name: String,
}

async fn seed_file_to_bucket(
  model_file_path: &Path,
  bucket_clients: &BucketClients,
  bucket_path_unifier: &BucketPathUnifier
) -> AnyhowResult<BucketDetails> {

  info!("Uploading Tacotron2 model file {:?} ...", model_file_path);

  // TODO(bt,2023-11-27): DO NOT DO THIS OR COPY THIS PATTERN
  //  This method of uploading model files is super deprecated and results in inconsistent pathing.
  //  Try to standardize on something resembling media_files going forward.
  let private_bucket_hash = sha256_hash_file(&model_file_path)?;

  info!("File hash: {}", private_bucket_hash);

  // FIXME(bt,2023-11-27): DO NOT COPY THIS PATTERN!
  //  'bucket_path_unifier' is super deprecated. Do not use it anymore or for anything except TT2!
  let model_bucket_path = bucket_path_unifier.tts_synthesizer_path(&private_bucket_hash);

  //let public_upload_path = MediaFileBucketPath::generate_new(
  //  Some("sample_"),
  //  Some(".bin"));

  let model_bucket_path = path_to_string(model_bucket_path);

  info!("Uploading TT2 model to bucket path: {:?}", model_bucket_path);

  info!("Reading TT2 model file: {:?}", model_file_path);

  let bytes = file_read_bytes(model_file_path)?;
  let mimetype = get_mimetype_for_bytes(&bytes).unwrap_or("application/octet-stream");

  let _r = bucket_clients.private.upload_file_with_content_type(
    &model_bucket_path,
    bytes.as_ref(),
    mimetype)
      .await?;

  Ok(BucketDetails {
    bucket_hash: private_bucket_hash,
    bucket_object_name: model_bucket_path,
  })
}
