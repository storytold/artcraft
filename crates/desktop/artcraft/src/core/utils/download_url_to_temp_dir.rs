use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use std::io::Write;
use tempfile::NamedTempFile;
use url::Url;

pub async fn download_url_to_temp_dir(url: &str, app_data_root: &AppDataRoot) -> AnyhowResult<NamedTempFile> {
  let url = Url::parse(&url)?;

  let response = reqwest::get(url.clone()).await?;
  let response_bytes = response.bytes().await?;

  let ext = url.path().split(".").last().unwrap_or("png");

  let mut temp_file = app_data_root.temp_dir().new_named_temp_file_with_extension(ext)?;

  temp_file.write_all(&response_bytes)?;

  Ok(temp_file)
}
