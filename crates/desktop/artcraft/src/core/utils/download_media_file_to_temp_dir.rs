use crate::core::artcraft_error::ArtcraftError;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::get_url_file_extension::get_url_file_extension;
use crate::core::utils::simple_http_download_to_tempfile::simple_http_download_to_tempfile;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use tempfile::NamedTempFile;
use tokens::tokens::media_files::MediaFileToken;
// TODO: Better more concrete error handling

pub async fn download_media_file_to_temp_dir(app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, token: &MediaFileToken) -> Result<NamedTempFile, ArtcraftError> {
  let response = get_media_file(
    &app_env_configs.storyteller_host, 
    token
  ).await?;

  let media_file_url = &response.media_file.media_links.cdn_url;

  let extension_with_dot = get_url_file_extension(media_file_url)
      .map(|ext| format!(".{}", ext))
      .unwrap_or_else(|| ".png".to_string()); // TODO: Better default extension passed by caller as heuristic.

  //let filename = format!("{}{}", response.media_file.token.as_str(), extension_with_dot);
  //let filename = app_data_root.downloads_dir().path().join(&filename);

  let mut file = app_data_root.temp_dir().new_named_temp_file_with_extension(&extension_with_dot)?;

  simple_http_download_to_tempfile(&media_file_url, &mut file).await?;

  Ok(file) // NB: Must return TempFile to not drop / delete it
}
