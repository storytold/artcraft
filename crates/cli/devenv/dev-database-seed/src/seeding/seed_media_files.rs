use std::path::Path;

use log::{info, warn};
use sqlx::{MySql, Pool};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::file_read_bytes::file_read_bytes;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_cli_tool::{insert_media_file_from_cli_tool, InsertArgs};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use storyteller_root::get_seed_tool_data_root;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::bucket_clients::BucketClients;
use crate::seeding::users::HANASHI_USER_TOKEN;

pub async fn seed_media_files(mysql_pool: &Pool<MySql>, maybe_bucket_clients: Option<&BucketClients>) -> AnyhowResult<()> {
  info!("Seeding media files...");

  // NB: This is idempotent and will only install the media files once.
  // Delete the records if you want to re-seed.
  let media_files = [
    // Audio
    (HANASHI_USER_TOKEN, "m_21jxt406aattq2cna1xtgf5m4mjyyr", MediaFileType::Audio, "media/audio/voice-samples/biden.wav"),
    (HANASHI_USER_TOKEN, "m_cxzabpxf88h10rshqraksxbqmhs41h", MediaFileType::Audio, "media/audio/voice-samples/brandon1.wav"),
    (HANASHI_USER_TOKEN, "m_sq2vhrrmmbr079afk21543aa2jg53g", MediaFileType::Audio, "media/audio/voice-samples/brandon2.wav"),
    (HANASHI_USER_TOKEN, "m_s61a8g3jnddr3xdg3gctsjxxk9jwja", MediaFileType::Audio, "media/audio/voice-samples/elon.wav"),
    (HANASHI_USER_TOKEN, "m_e59fh75g76pvebx4qe4r4aymd93q30", MediaFileType::Audio, "media/audio/voice-samples/goku.wav"),
    (HANASHI_USER_TOKEN, "m_ttq0ym8ht4v0z87zqz27fhadp0743c", MediaFileType::Audio, "media/audio/voice-samples/hillary.wav"),
    (HANASHI_USER_TOKEN, "m_300bv6f141hv553fjf287p5gb76k37", MediaFileType::Audio, "media/audio/voice-samples/mario_impersonator.wav"),
    (HANASHI_USER_TOKEN, "m_rd1ey2jem8a37r3vna2h9mht6zevs5", MediaFileType::Audio, "media/audio/voice-samples/rick.wav"),
    (HANASHI_USER_TOKEN, "m_8n5epqfvs2vh60khap0s3ezem4epkc", MediaFileType::Audio, "media/audio/voice-samples/trump.wav"),
    (HANASHI_USER_TOKEN, "m_g6dpwcpq51e6kvmpbbkdvgxfan9k1k", MediaFileType::Audio, "media/audio/voice-samples/trump_tts.wav"),
    // Images
    (HANASHI_USER_TOKEN, "m_cn5t6ywm9k1ge9qzzxst5krc5tm08m", MediaFileType::Jpg, "media/image/face-animator-inputs/bill.jpg"),
    (HANASHI_USER_TOKEN, "m_nf9xebrr8hd1bxkfy7src5k8nv2dzy", MediaFileType::Jpg, "media/image/face-animator-inputs/elon.jpg"),
    (HANASHI_USER_TOKEN, "m_t17zh2r3ahs485b8m7c9q502cs6jqh", MediaFileType::Jpg, "media/image/face-animator-inputs/ernest.jpg"),
    (HANASHI_USER_TOKEN, "m_vms09sby8tyw742y2s66a4w8f0w278", MediaFileType::Jpg, "media/image/face-animator-inputs/link.jpg"),
    (HANASHI_USER_TOKEN, "m_s1z9krfzrscy92jgq3sxhpx1n4vxvc", MediaFileType::Jpg, "media/image/face-animator-inputs/ripley.jpg"),
    (HANASHI_USER_TOKEN, "m_we7mnzbd76g4yn19dm6m53er0pjvew", MediaFileType::Png, "media/image/face-animator-inputs/san.png"),
    (HANASHI_USER_TOKEN, "m_wahwz92nxxfg0x42dw9fdrhwq30yk0", MediaFileType::Jpg, "media/image/face-animator-inputs/zelda.jpg"),
    // Video
    (HANASHI_USER_TOKEN, "m_gedarcfdkxx3zv8zz2wmwsnc1r8jbp", MediaFileType::Video, "media/video/storyteller-studio-renders/girl-rotating-room.mp4"),
    (HANASHI_USER_TOKEN, "m_3s74yyd4jwrjdp17yx1694n29jv5gr", MediaFileType::Video, "media/video/storyteller-studio-renders/hanashi-run.mp4"),
    (HANASHI_USER_TOKEN, "m_p6d64gm1wawz25bmdahfded3366b9f", MediaFileType::Video, "media/video/storyteller-studio-renders/mocap-kiss.mp4"),
    (HANASHI_USER_TOKEN, "m_szp2c77z6je965k44vc22xn9432a88", MediaFileType::Video, "media/video/storyteller-studio-renders/rotating-mocap-girl.mp4"),
    (HANASHI_USER_TOKEN, "m_mdwspz81zymw9hvmb1d3jm830t25xe", MediaFileType::Video, "media/video/storyteller-studio-renders/rotating-mocap-m.mp4"),
    (HANASHI_USER_TOKEN, "m_prcs6xkm8phs5y4a2dfwemwjy6n6z3", MediaFileType::Video, "media/video/storyteller-studio-renders/rotating-run-girl.mp4"),
    (HANASHI_USER_TOKEN, "m_5j889dzw08vn9pbrscx1sncff43ekp", MediaFileType::Video, "media/video/storyteller-studio-renders/rotating-run-jww.mp4"),
    (HANASHI_USER_TOKEN, "m_fwm2w6wbssez274ayz6x8ta0h1a9qp", MediaFileType::Video, "media/video/storyteller-studio-renders/rotating-run-pascal.mp4"),
    (HANASHI_USER_TOKEN, "m_yqqkrt2srep6a35xg78114jn9epwg1", MediaFileType::Video, "media/video/storyteller-studio-renders/rotating-run-pop.mp4"),
    (HANASHI_USER_TOKEN, "m_m4r043kez14pm6vaamsecpz8fafh7g", MediaFileType::Video, "media/video/video-style-transfer/man-explaining.mp4"),
    (HANASHI_USER_TOKEN, "m_81gq3hygqvrahg6ncxbtcpjap4f9nv", MediaFileType::Video, "media/video/video-style-transfer/woman-gradient-background.mp4"),
    (HANASHI_USER_TOKEN, "m_dp9ykj3yasjx69g2fx2bpd26wwjz0f", MediaFileType::Video, "media/video/video-style-transfer/woman-red-hair.mp4"),
  ];

  let seed_tool_data_root = get_seed_tool_data_root();

  for (user_token, media_file_token, media_file_type, subdirectory_path) in media_files {
    let user_token = UserToken::new_from_str(user_token);
    let media_file_token = MediaFileToken::new_from_str(media_file_token);

    let mut media_file_path = seed_tool_data_root.clone();
    media_file_path.push(subdirectory_path);

    let result = seed_model(
      &mysql_pool,
      &media_file_token,
      &user_token,
      media_file_type,
      &media_file_path,
      maybe_bucket_clients,
    ).await;

    match result {
      Ok(_) => info!("Seeded {:?}", media_file_path),
      Err(err) => warn!(r#"
        Could not seed media file {} , {:?} : {:?}
        (No worries: if there's a duplicate key error, we probably already
        seeded the media file on a previous invocation!)
      "#, media_file_token, subdirectory_path, err),
    }
  }

  Ok(())
}

async fn seed_model(
  mysql_pool: &Pool<MySql>,
  media_file_token: &MediaFileToken,
  user_token: &UserToken,
  media_file_type: MediaFileType,
  media_file_path: &Path,
  maybe_bucket_clients: Option<&BucketClients>,
) -> AnyhowResult<()> {
  info!("Seeding Media file {:?} ...", media_file_path);

  let mut bucket_hash = "NOT_UPLOADED_BY_SEED_TOOL".to_string();
  let mut maybe_bucket_prefix = None;
  let mut maybe_bucket_extension = None;
  
  if media_file_exists(mysql_pool, media_file_token).await? {
    info!("Media file already seeded: {:?}", media_file_token);
    return Ok(())
  }

  if let Some(bucket_clients) = maybe_bucket_clients {
    let bucket_details = seed_file_to_bucket(media_file_path, bucket_clients).await?;
    bucket_hash = bucket_details.bucket_hash;
    maybe_bucket_prefix = bucket_details.maybe_bucket_prefix;
    maybe_bucket_extension = bucket_details.maybe_bucket_extension;
  }

  let maybe_mime_type = get_mimetype_for_file(media_file_path)?;
  let file_size_bytes = file_size(media_file_path)?;
  let sha256_checksum = sha256_hash_file(media_file_path)?;

  let maybe_filename = media_file_path
      .file_name()
      .map(|name| name.to_str())
      .flatten();

  insert_media_file_from_cli_tool(InsertArgs {
    pool: &mysql_pool,
    maybe_use_apriori_media_token: Some(media_file_token),
    media_file_type,
    maybe_mime_type,
    file_size_bytes,
    sha256_checksum: &sha256_checksum,
    maybe_origin_filename: maybe_filename,
    maybe_creator_user_token: Some(user_token),
    creator_set_visibility: Visibility::Public,
    public_bucket_directory_hash: &bucket_hash,
    maybe_public_bucket_prefix: maybe_bucket_prefix.as_deref(),
    maybe_public_bucket_extension: maybe_bucket_extension.as_deref(),
  }).await?;

  Ok(())
}

async fn media_file_exists(
  mysql_pool: &Pool<MySql>,
  media_file_token: &MediaFileToken,
) -> AnyhowResult<bool> {

  const CAN_SEE_DELETED : bool = true;

  let maybe_file = get_media_file(
    &media_file_token,
    CAN_SEE_DELETED,
    mysql_pool
  ).await?;

  Ok(maybe_file.is_some())
}

struct BucketDetails {
  bucket_hash: String,
  maybe_bucket_prefix: Option<String>,
  maybe_bucket_extension: Option<String>,
}

async fn seed_file_to_bucket(
  media_file_path: &Path,
  bucket_clients: &BucketClients,
) -> AnyhowResult<BucketDetails> {

  info!("Uploading media file {:?} ...", media_file_path);

  let maybe_bucket_prefix = Some("fakeyou_");

  let maybe_bucket_extension = media_file_path
      .extension()
      .map(|extension| extension.to_str())
      .flatten();
  // get the new bucket path ...
  let bucket_location = MediaFileBucketPath::generate_new(maybe_bucket_prefix, maybe_bucket_extension);
  
  let bucket_path = path_to_string(bucket_location.to_full_object_pathbuf());

  info!("Reading media file: {:?}", media_file_path);
  // get meta data 
  let bytes = file_read_bytes(media_file_path)?;
  let mimetype = get_mimetype_for_bytes(&bytes).unwrap_or("application/octet-stream");
  
  info!("Uploading media file to bucket path: {:?}", bucket_path);

  let _r = bucket_clients.public.upload_file_with_content_type(
    &bucket_path,
    bytes.as_ref(),
    mimetype
  ).await?;

  Ok(BucketDetails {
    bucket_hash: bucket_location.get_object_hash().to_string(),
    maybe_bucket_prefix: maybe_bucket_prefix.map(|s| s.to_string()),
    maybe_bucket_extension: maybe_bucket_extension.map(|s| s.to_string()),
  })
}

// Temporary "test" to generate random tokens.
// #[cfg(test)]
// mod tests {
//   use tokens::tokens::media_files::MediaFileToken;
//
//   #[test]
//   fn test() {
//     // Print some randomly sampled tokens
//     for _i in 0..50 {
//       let token = MediaFileToken::generate();
//       println!("Token: {}", token);
//     }
//     // Deliberately fail the test to get the output
//     assert_eq!(1, 2);
//   }
// }
