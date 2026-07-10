use std::thread;
use std::time::Duration;

use log::info;
use sqlx::{MySql, Pool};

use enums::common::view_as::ViewAs;
use errors::{anyhow, AnyhowResult};
use mysql_queries::queries::media_files::delete::delete_media_file::delete_media_file_as_mod;
use mysql_queries::queries::media_files::list::list_media_files_for_user::{list_media_files_for_user, ListMediaFileForUserArgs};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;

use crate::cli_args::Args;
use crate::util::constants::ECHELON_USER_TOKEN;

pub async fn delete_user_files(args: &Args, mysql: &Pool<MySql>) -> AnyhowResult<()> {
  info!("delete user files for username: {:?}", args.username);

  let username = match args.username.as_deref() {
    Some(username) => username,
    None => return Err(anyhow!("username is required")),
  };

  let maybe_user_profile = get_user_profile_by_username(username, mysql).await?;

  let user_profile = match maybe_user_profile {
    Some(user_profile) => user_profile,
    None => return Err(anyhow!("user not found")),
  };

  info!("user_profile: {:?}", &user_profile);

  delete_all_files(username, mysql).await?;

  Ok(())
}

pub async fn delete_all_files(username: &str, mysql: &Pool<MySql>) -> AnyhowResult<()> {
  let mut page_index = 0;

  loop {
    info!("Querying page {page_index} of files...");

    let media_files = list_media_files_for_user(ListMediaFileForUserArgs {
      username,
      maybe_filter_media_types: None,
      maybe_filter_media_classes: None,
      maybe_filter_engine_categories: None,
      include_user_uploads: true,
      page_size: 100,
      page_index,
      sort_ascending: false,
      view_as: ViewAs::Moderator,
      mysql_pool: &mysql,
    }).await?;

    if media_files.records.is_empty() {
      break;
    }

    for file in media_files.records {
      info!("Deleting file: {:?}", &file.token);
      delete_media_file_as_mod(&file.token, ECHELON_USER_TOKEN, mysql).await?;
    }

    page_index += 1;

    thread::sleep(Duration::from_millis(1000));
  }

  Ok(())
}
