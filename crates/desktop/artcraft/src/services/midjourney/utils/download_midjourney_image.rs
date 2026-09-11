use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use errors::AnyhowResult;
use midjourney_client::utils::get_image_url::get_image_url;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use url::Url;
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;

pub async fn download_midjourney_image(
  image_downloader: &ImageDownloaderClient, 
  job_id: &str, 
  index: u8, 
  app_data_root: &AppDataRoot
) -> AnyhowResult<PathBuf> {
  let url = get_image_url(job_id, index)?;
  let parsed_url = Url::parse(&url)?;

  //let response = reqwest::get(&url).await?;
  //let image_bytes = response.bytes().await?;
  
  let image_bytes = image_downloader.download_image(job_id, index).await?;

  let ext = parsed_url.path().split(".").last().unwrap_or("png");

  let tempdir = app_data_root.temp_dir().path();
  let download_filename = format!("{}_{}.{}", job_id, index, ext);
  let download_path = tempdir.join(download_filename);

  let mut file = File::create(&download_path)?;
  file.write_all(&image_bytes)?;

  Ok(download_path)
}
