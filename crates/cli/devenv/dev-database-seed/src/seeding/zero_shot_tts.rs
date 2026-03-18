use log::info;
use sqlx::{MySql, Pool};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::by_table::zs_voices::encoding_type::ZsVoiceEncodingType;
use enums::by_table::zs_voices::model_category::ZsVoiceModelCategory;
use enums::by_table::zs_voices::model_type::ZsVoiceModelType;
use enums::common::visibility::Visibility;
use errors::{anyhow, AnyhowResult};
use filesys::file_read_bytes::file_read_bytes;
use uuid_utils::uuid::generate_random_uuid;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use mysql_queries::queries::voice_designer::datasets::create_dataset::{create_dataset, CreateDatasetArgs};
use mysql_queries::queries::voice_designer::voice_samples::insert_dataset_sample_and_media_file::{insert_dataset_sample_and_media_file, InsertDatasetSampleAndMediaFileArgs};
use mysql_queries::queries::voice_designer::voices::create_voice::{create_voice, CreateVoiceArgs};
use storyteller_root::get_storyteller_rust_root;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;
use tokens::tokens::zs_voices::ZsVoiceToken;

use crate::bucket_clients::BucketClients;
use crate::seeding::users::HANASHI_USERNAME;

pub async fn seed_zero_shot_tts(mysql_pool: &Pool<MySql>, maybe_bucket_clients: Option<&BucketClients>) -> AnyhowResult<()> {
  info!("Seeding zero shot TTS...");

  let user_token = match get_user_token_by_username(HANASHI_USERNAME, mysql_pool).await? {
    None => { return Err(anyhow!("could not find user hanashi")) }
    Some(token) => token,
  };

  let records = [
    // NB: The bucket hashes here are already uploaded to the development Google Cloud Storage
    // bucket and should be usable if you have the development secrets on your machine.
    ("Alice", "qtqaprnd5shtybve4fqpvcfp50yjw238", "alice.wav", &user_token),
    ("Random Audio", "qtqaprnd5shtybve4fqpvcfp50yjw231", "vocodes2.wav", &user_token),
    ("Trump Broken", "qtqaprnd5shtybve4fqpvcfp50yjw239", "trump_problem.wav", &user_token),
    ("Biden", "n945w0xsq15xrh16hc147a5mc1a91gwh", "biden.wav", &user_token),
    ("Goku", "cnnv05yjst2m737dpmxazgfpksjf4y7c", "goku.wav", &user_token),
    ("Hilary", "7wav68ba2yy86491jk36cgk36tkmzesr", "hilary.wav", &user_token),
    ("Obama", "z3gy4v56sgtfrxfrpvaj7v74sqc67rcq", "obama.wav", &user_token),
    ("Trump", "qcy7pv3rph0ntkqnpz5cfg9ksyh7kkz5", "trump.wav", &user_token),
  ];

  for (voice_name, bucket_hash, wav_file, user_token) in records {
    create_voice_records(voice_name, bucket_hash, wav_file, user_token, mysql_pool, maybe_bucket_clients).await?;
  }

  Ok(())
}

async fn create_voice_records(
  voice_name: &str,
  bucket_hash: &str,
  wav_file: &str,
  creator_user_token: &UserToken,
  mysql_pool: &Pool<MySql>,
  maybe_bucket_clients: Option<&BucketClients>,
) -> AnyhowResult<(ZsVoiceToken, ZsVoiceDatasetToken)> {
  info!("Creating voice records for voice {} ...", voice_name);

  let dataset_title = format!("{} Dataset", voice_name);

  info!("Creating dataset...");

  let dataset_token = create_dataset(CreateDatasetArgs {
    dataset_title: &dataset_title,
    maybe_creator_user_token: Some(creator_user_token.as_str()),
    creator_ip_address: "127.0.0.1",
    creator_set_visibility: Visibility::Public,
    mysql_pool,
  }).await?;

  let public_upload_path;

  if let Some(bucket_clients) = maybe_bucket_clients {
    public_upload_path = seed_file_to_bucket(wav_file, &bucket_clients.public).await?;
  } else {
    public_upload_path = MediaFileBucketPath::from_object_hash("fake", None, None);
  }

  info!("Creating dataset sample record...");

  let uuid_idempotency_token = generate_random_uuid();

  let (_sample_token, _media_file_token, _id) =
      insert_dataset_sample_and_media_file(InsertDatasetSampleAndMediaFileArgs {
        uuid_idempotency_token: &uuid_idempotency_token,
        dataset_token: &dataset_token,
        media_type: MediaUploadType::Audio,
        origin_category: MediaFileOriginCategory::Upload,
        maybe_original_filename: None,
        maybe_mime_type: None,
        file_size_bytes: 0,
        maybe_original_duration_millis: None,
        maybe_original_audio_encoding: None,
        checksum_sha2: "", // TODO
        media_file_path: &public_upload_path,
        maybe_public_bucket_prefix: None,
        maybe_public_bucket_extension: None,
        maybe_creator_user_token: Some(&creator_user_token),
        maybe_creator_anonymous_visitor_token: None,
        creator_ip_address: "127.0.0.1",
        creator_set_visibility: Visibility::Public,
        mysql_pool,
      }).await?;

  info!("Creating voice record...");

  let voice_token = create_voice(CreateVoiceArgs {
    dataset_token: &dataset_token,
    model_category: ZsVoiceModelCategory::Tts,
    model_type: ZsVoiceModelType::VallEX,
    model_version: 0,
    model_encoding_type: ZsVoiceEncodingType::Encodec,
    voice_title: &voice_name,
    bucket_hash: &bucket_hash,
    maybe_creator_user_token: Some(&creator_user_token),
    creator_ip_address: "127.0.0.1",
    creator_set_visibility: Visibility::Public,
    mysql_pool,
  }).await?;

  Ok((voice_token, dataset_token))
}

async fn seed_file_to_bucket(wav_file: &str, bucket_client: &BucketClient) -> AnyhowResult<MediaFileBucketPath> {
  info!("Uploading wav file {} ...", wav_file);

  let public_upload_path = MediaFileBucketPath::generate_new(
    Some("sample_"),
    Some(".bin"));

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  let mut file_path = get_storyteller_rust_root();
  file_path.push(format!("assets/seed/{}", wav_file));

  info!("Reading seed file: {:?}", file_path);

  let bytes = file_read_bytes(file_path)?;
  let mimetype = get_mimetype_for_bytes(&bytes).unwrap_or("audio/wav");

  let _r = bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    mimetype)
      .await?;

  Ok(public_upload_path)
}
