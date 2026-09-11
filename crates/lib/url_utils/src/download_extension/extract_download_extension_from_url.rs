use crate::download_extension::DownloadExtension;
use url::Url;

/// This should be used for naming files on the local file system based on their URL.
#[deprecated(note = "Use `extract_extension_from_url_str` in `url_utils::extension::extract_extension_from_url` instead")]
pub fn extract_download_extension_from_url_str(url: &str) -> Option<DownloadExtension> {
  let parsed_url = Url::parse(url).ok()?;
  extract_download_extension_from_url(&parsed_url)
}

/// This should be used for naming files on the local file system based on their URL.
#[deprecated(note = "Use `extract_extension_from_url` in `url_utils::extension::extract_extension_from_url` instead")]
pub fn extract_download_extension_from_url(url: &Url) -> Option<DownloadExtension> {
  let path = url.path();
  let extension = std::path::Path::new(path)
      .extension()
      .and_then(|ext| ext.to_str())?;
  DownloadExtension::try_from_str(extension)
}

#[cfg(test)]
mod tests {
  use crate::download_extension::DownloadExtension;
  use crate::download_extension::extract_download_extension_from_url::extract_download_extension_from_url_str;

  #[test]
  fn success_case() {
    let url = "https://storyteller.ai/example.jpg";
    let maybe_extension= extract_download_extension_from_url_str(url);
    assert_eq!(maybe_extension, Some(DownloadExtension::Jpg));
  }

  #[test]
  fn difficult_url() {
    let url = "https://videos.youtube.com/foo/bar/files/00000000-f19a-1275-a092-caa60b38f8d2%2Fraw?se=2025-11-21T22%3A26%3A53Z&sp=r&sv=2024-08-09&sr=b&skoid=8cfff87a-01fc-27c1-9091-32999dcd1389&sktid=aa8ccaf6-e6da-484e-ab11-9c7496c21c53&skt=2025-11-17T21%3A09%3A08Z&ske=2025-10-23T21%3A14%3A08Z&sks=b&skv=2024-08-04&sig=T2U6%2Brw9WJdJagBkCL4/GlFr72KhZGP3QPlobIO7JlU%3D&ac=oaisdsorprnorthcentralus";
    let maybe_extension= extract_download_extension_from_url_str(url);
    assert!(maybe_extension.is_none());
  }
}
