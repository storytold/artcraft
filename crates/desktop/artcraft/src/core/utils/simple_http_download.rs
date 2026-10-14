use errors::AnyhowResult;
use reqwest::Client;
use reqwest::Url;
use std::io::Write;
use std::path::Path;
use tempfile::NamedTempFile;

const USER_AGENT: &str = "storyteller-client/1.0";

/// Downloads a (binary) file to a filesystem path. Good for images, etc. Not great for large files.
pub async fn simple_http_download<P: AsRef<Path>>(url: &Url, download_path: P) -> AnyhowResult<()> {
  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(url.clone()) // NB: No IntoUrl for &Url.
      .header("User-Agent", USER_AGENT)
      .header("Accept", "*/*")
      .send()
      .await?
      .error_for_status()?;

  let bytes = response.bytes().await?;

  let download_path = download_path.as_ref();
  let directory = download_path
      .parent()
      .filter(|parent| !parent.as_os_str().is_empty())
      .unwrap_or_else(|| Path::new("."));
  let temporary = NamedTempFile::new_in(directory)?;
  let mut file = temporary.reopen()?;

  file.write_all(&bytes)?;
  file.flush()?;
  file.sync_all()?;
  drop(file);

  temporary.persist(download_path)?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::simple_http_download;
  use reqwest::Url;
  use std::io::{Read, Write};
  use std::net::TcpListener;
  use tempfile::tempdir;

  #[tokio::test]
  async fn rejects_http_error_without_overwriting_existing_file() {
    let directory = tempdir().unwrap();
    let destination = directory.path().join("media.bin");
    std::fs::write(&destination, b"existing media").unwrap();
    let url = serve_once("500 Internal Server Error", b"not media");

    let result = simple_http_download(&url, &destination).await;

    assert!(result.is_err());
    assert_eq!(std::fs::read(&destination).unwrap(), b"existing media");
  }

  #[tokio::test]
  async fn writes_successful_response() {
    let directory = tempdir().unwrap();
    let destination = directory.path().join("media.bin");
    let url = serve_once("200 OK", b"valid media");

    simple_http_download(&url, &destination).await.unwrap();

    assert_eq!(std::fs::read(&destination).unwrap(), b"valid media");
  }

  fn serve_once(status: &'static str, body: &'static [u8]) -> Url {
    let listener = TcpListener::bind(("127.0.0.1", 0)).unwrap();
    let address = listener.local_addr().unwrap();

    std::thread::spawn(move || {
      let (mut stream, _) = listener.accept().unwrap();
      let mut request = [0_u8; 1024];
      let _ = stream.read(&mut request);
      let headers = format!(
        "HTTP/1.1 {status}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len(),
      );
      stream.write_all(headers.as_bytes()).unwrap();
      stream.write_all(body).unwrap();
    });

    Url::parse(&format!("http://{address}/media")).unwrap()
  }
}
