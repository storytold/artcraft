use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::Duration;

use reqwest::Client;
use tempfile::NamedTempFile;

const MAX_TRANSFER_BYTES: u64 = 1024 * 1024 * 1024;

pub(super) async fn cache_downloads(checkpoint_path: &Path, urls: &[String]) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
  let directory = checkpoint_path.with_extension("media");
  std::fs::create_dir_all(&directory)?;
  let mut paths = Vec::with_capacity(urls.len());
  for (index, url) in urls.iter().enumerate() {
    let extension = url_utils::download_extension::extract_download_extension_from_url::extract_download_extension_from_url_str(url).map(|extension| extension.as_extension_without_period()).unwrap_or("bin");
    let path = directory.join(format!("{index}.{extension}"));
    match std::fs::symlink_metadata(&path) {
      Ok(metadata) if metadata.is_file() && metadata.len() > 0 && metadata.len() <= MAX_TRANSFER_BYTES => {},
      Ok(_) => return Err("Invalid cached provider media".into()),
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
        let download = download_file(url, &directory).await?;
        download.as_file().sync_all()?;
        download.persist_noclobber(&path)?;
      },
      Err(error) => return Err(error.into()),
    }
    paths.push(path);
  }
  Ok(paths)
}

pub(super) fn clear_cached_downloads(checkpoint_path: &Path) -> Result<(), std::io::Error> {
  match std::fs::remove_dir_all(checkpoint_path.with_extension("media")) {
    Ok(()) => Ok(()),
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
    Err(error) => Err(error),
  }
}

pub(super) async fn download_file(url: &str, directory: &Path) -> Result<NamedTempFile, Box<dyn std::error::Error>> {
  let client = Client::builder().connect_timeout(Duration::from_secs(10)).timeout(Duration::from_secs(600)).build()?;
  download_with_client(&client, url, directory, MAX_TRANSFER_BYTES).await
}

async fn download_with_client(client: &Client, url: &str, directory: &Path, max_bytes: u64) -> Result<NamedTempFile, Box<dyn std::error::Error>> {
  let mut response = client.get(url).send().await?.error_for_status()?;
  if response.content_length().is_some_and(|length| length > max_bytes) {
    return Err("Provider output exceeds transfer size limit".into());
  }
  let extension = url_utils::download_extension::extract_download_extension_from_url::extract_download_extension_from_url_str(url).map(|extension| extension.as_extension_without_period()).unwrap_or("bin");
  let mut file = tempfile::Builder::new().prefix("provider_").suffix(&format!(".{extension}")).tempfile_in(directory)?;
  let mut received = 0u64;
  while let Some(chunk) = response.chunk().await? {
    received += chunk.len() as u64;
    if received > max_bytes {
      return Err("Provider output exceeds transfer size limit".into());
    }
    file.write_all(&chunk)?;
  }
  if received == 0 {
    return Err("Provider returned an empty media file".into());
  }
  file.flush()?;
  Ok(file)
}

#[cfg(test)]
mod provider_transfer_tests {
  use super::*;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  #[tokio::test]
  async fn cached_output_survives_restart_after_provider_url_expires() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("checkpoint.json");
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/result.png", listener.local_addr().unwrap());
    let server = tokio::spawn(async move {
      let (mut socket, _) = listener.accept().await.unwrap();
      let mut request = [0; 4096];
      socket.read(&mut request).await.unwrap();
      socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 5\r\nConnection: close\r\n\r\nmedia").await.unwrap();
    });
    let files = cache_downloads(&path, &[url.clone()]).await.unwrap();
    server.await.unwrap();
    assert_eq!(std::fs::read(&files[0]).unwrap(), b"media");
    assert_eq!(cache_downloads(&path, &[url]).await.unwrap(), files);
    clear_cached_downloads(&path).unwrap();
    assert!(!files[0].exists());
  }

  #[tokio::test]
  async fn downloads_are_owned_and_http_errors_or_size_failures_leave_no_files() {
    let directory = tempfile::tempdir().unwrap();
    let client = Client::new();
    for (status, body, limit, success) in [(200, "media", 10, true), (503, "error", 10, false), (200, "too large", 2, false), (200, "", 10, false)] {
      let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
      let url = format!("http://{}/result.png", listener.local_addr().unwrap());
      let server = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = [0; 4096];
        socket.read(&mut request).await.unwrap();
        socket.write_all(format!("HTTP/1.1 {status} OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes()).await.unwrap();
      });
      let result = download_with_client(&client, &url, directory.path(), limit).await;
      assert_eq!(result.is_ok(), success);
      if let Ok(file) = result {
        assert_eq!(std::fs::read(file.path()).unwrap(), body.as_bytes());
        let path = file.path().to_path_buf();
        drop(file);
        assert!(!path.exists());
      }
      server.await.unwrap();
      assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 0);
    }
  }

  #[tokio::test]
  async fn chunked_responses_cannot_bypass_the_size_limit() {
    let directory = tempfile::tempdir().unwrap();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/result.png", listener.local_addr().unwrap());
    let server = tokio::spawn(async move {
      let (mut socket, _) = listener.accept().await.unwrap();
      let mut request = [0; 4096];
      socket.read(&mut request).await.unwrap();
      socket.write_all(b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n5\r\nmedia\r\n0\r\n\r\n").await.unwrap();
    });
    assert!(download_with_client(&Client::new(), &url, directory.path(), 2).await.is_err());
    server.await.unwrap();
    assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 0);
  }

  #[tokio::test]
  async fn stalled_body_times_out_and_dropped_transfer_removes_partial_file() {
    let directory = tempfile::tempdir().unwrap();
    for cancel in [false, true] {
      let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
      let url = format!("http://{}/result.mp4", listener.local_addr().unwrap());
      let (started, received) = tokio::sync::oneshot::channel();
      let server = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = [0; 4096];
        socket.read(&mut request).await.unwrap();
        socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\nx").await.unwrap();
        started.send(()).unwrap();
        std::future::pending::<()>().await;
      });
      let client = Client::builder().timeout(Duration::from_millis(100)).build().unwrap();
      let transfer = download_with_client(&client, &url, directory.path(), 100);
      tokio::pin!(transfer);
      if cancel {
        tokio::select! {
          result = &mut transfer => panic!("unexpected completion: {}", result.is_ok()),
          _ = async { received.await.unwrap(); tokio::time::sleep(Duration::from_millis(10)).await; } => {},
        }
      } else {
        assert!(transfer.await.is_err());
      }
      server.abort();
    }
    assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 0);
  }

  #[tokio::test]
  async fn stalled_headers_cannot_block_the_next_transfer() {
    let directory = tempfile::tempdir().unwrap();
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/result.png", listener.local_addr().unwrap());
    let server = tokio::spawn(async move {
      let (_socket, _) = listener.accept().await.unwrap();
      std::future::pending::<()>().await;
    });
    let client = Client::builder().timeout(Duration::from_millis(100)).build().unwrap();
    assert!(download_with_client(&client, &url, directory.path(), 10).await.is_err());
    server.abort();
    assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 0);
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/next.png", listener.local_addr().unwrap());
    let server = tokio::spawn(async move {
      let (mut socket, _) = listener.accept().await.unwrap();
      let mut request = [0; 4096];
      socket.read(&mut request).await.unwrap();
      socket.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 5\r\nConnection: close\r\n\r\nmedia").await.unwrap();
    });
    let file = download_with_client(&client, &url, directory.path(), 10).await.unwrap();
    assert_eq!(std::fs::read(file.path()).unwrap(), b"media");
    drop(file);
    server.await.unwrap();
    assert_eq!(std::fs::read_dir(directory.path()).unwrap().count(), 0);
  }
}
