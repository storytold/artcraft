use log::info;
use sqlx::{MySql, Pool};

use bucket_paths::legacy::remote_file_manager_paths::media_descriptor::MediaVideoMp4Descriptor;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::{anyhow, AnyhowResult};
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_cli_tool::{insert_media_file_from_cli_tool, InsertArgs};
use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use storyteller_root::get_seed_tool_data_root;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::seeding::users::HANASHI_USERNAME;

pub async fn seed_test_videos(mysql_pool: &Pool<MySql>, user_token: UserToken) -> AnyhowResult<()> {
    let model_weight_token1 = MediaFileToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let seed_tool_data_root = get_seed_tool_data_root();
    let mut media_file_path = seed_tool_data_root.clone();
    media_file_path.push("media/video/video-style-transfer/miku.mp4");
    let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await?;
    let video_media_descriptor = Box::new(MediaVideoMp4Descriptor {});
    let metadata1 = remote_cloud_file_client.upload_file(video_media_descriptor, media_file_path.as_path().to_str().unwrap()).await?;
    let bucket_details = metadata1.bucket_details.as_ref().unwrap().clone();
    let media1 = InsertArgs {
        pool: &mysql_pool,
        maybe_use_apriori_media_token: Some(&model_weight_token1),
        media_file_type: MediaFileType::Mp4,
        maybe_mime_type: Some(&*metadata1.mimetype),
        file_size_bytes: metadata1.file_size_bytes,
        sha256_checksum: &metadata1.sha256_checksum,
        maybe_origin_filename: Some("miku.mp4"),
        maybe_creator_user_token: Some(&user_token),
        creator_set_visibility: Visibility::Public,
        public_bucket_directory_hash: &bucket_details.object_hash,
        maybe_public_bucket_prefix: Some(&bucket_details.prefix),
        maybe_public_bucket_extension: Some(&bucket_details.suffix),
    };
    let (_media_file_token1, _) = insert_media_file_from_cli_tool(media1).await.unwrap();

    Ok(())
}

pub async fn seed_media_seedtool(mysql_pool: &Pool<MySql>) -> AnyhowResult<()> {
    info!("Seeding media...");

    let user_token = match get_user_token_by_username(HANASHI_USERNAME, mysql_pool).await? {
        None => {
            return Err(anyhow!("could not find user hanashi"));
        }
        Some(token) => token,
    };
    seed_test_videos(mysql_pool, user_token.clone()).await?;
    Ok(())
}
