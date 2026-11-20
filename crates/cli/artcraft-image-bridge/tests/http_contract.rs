use artcraft_image_bridge::loopback_upload::LoopbackUploadClient;
use std::{
  net::SocketAddr,
  sync::{Arc, Mutex},
};
use tokio::{
  io::{AsyncReadExt, AsyncWriteExt},
  net::TcpListener,
};
use uuid::Uuid;

const UPLOAD_OK: &str = r#"{"success":true,"media_file_token":"m_fixture"}"#;
const READ_OK: &str = r#"{"success":true,"media_file":{"token":"m_fixture","media_class":"image","creator_set_visibility":"private"}}"#;

#[tokio::test]
async fn multipart_preserves_bytes_and_stable_id_then_reads_same_media() -> anyhow::Result<()> {
  let (addr, requests, server) = fixture(vec![
    reply(200, UPLOAD_OK),
    reply(200, READ_OK),
    reply(200, UPLOAD_OK),
    reply(200, READ_OK),
  ])
  .await?;
  let client = LoopbackUploadClient::new(addr)?;
  let id = Uuid::new_v4();
  let bytes = b"fixture-image-bytes\x00\xff".to_vec();
  let first = client
    .upload_and_verify(bytes.clone(), "image/png", id)
    .await?;
  let second = client
    .upload_and_verify(bytes.clone(), "image/png", id)
    .await?;
  assert_eq!(first.media_file_token, second.media_file_token);
  assert_eq!(first.verification, "metadata_only");
  server.await??;
  let requests = requests.lock().unwrap();
  for index in [0, 2] {
    let text = String::from_utf8_lossy(&requests[index]);
    assert!(text.starts_with("POST /v1/media_files/upload/image "));
    assert!(text.contains("name=\"uuid_idempotency_token\""));
    assert!(text.contains(&id.to_string()));
    assert!(text.contains("filename=\"image.png\""));
    assert!(text.contains("name=\"maybe_visibility\"\r\n\r\nprivate"));
    assert!(!text.contains("is_intermediate_system_file"));
    assert!(!text.to_lowercase().contains("authorization:"));
    assert!(!text.to_lowercase().contains("cookie:"));
    assert!(requests[index]
      .windows(bytes.len())
      .any(|window| window == bytes));
  }
  assert!(String::from_utf8_lossy(&requests[1]).starts_with("GET /v1/media_files/file/m_fixture "));
  Ok(())
}

#[tokio::test]
async fn rejects_upload_failures_malformed_json_and_unsafe_tokens() -> anyhow::Result<()> {
  for response in [
    reply(401, "private error detail"),
    reply(200, "not JSON"),
    reply(200, r#"{"success":false,"media_file_token":"m_fixture"}"#),
    reply(
      200,
      r#"{"success":true,"media_file_token":"m_../../escape"}"#,
    ),
  ] {
    let (addr, _, server) = fixture(vec![response]).await?;
    let err = LoopbackUploadClient::new(addr)?
      .upload_and_verify(vec![1], "image/png", Uuid::new_v4())
      .await
      .unwrap_err();
    assert!(!err.to_string().contains("private error detail"));
    server.await??;
  }
  Ok(())
}

#[tokio::test]
async fn rejects_readback_mismatch_and_non_image_records() -> anyhow::Result<()> {
  for body in [
    r#"{"success":true,"media_file":{"token":"m_other","media_class":"image","creator_set_visibility":"private"}}"#,
    r#"{"success":true,"media_file":{"token":"m_fixture","media_class":"video","creator_set_visibility":"private"}}"#,
    r#"{"success":false,"media_file":{"token":"m_fixture","media_class":"image","creator_set_visibility":"private"}}"#,
    r#"{"success":true,"media_file":{"token":"m_fixture","media_class":"image","creator_set_visibility":"public"}}"#,
  ] {
    let (addr, _, server) = fixture(vec![reply(200, UPLOAD_OK), reply(200, body)]).await?;
    assert!(LoopbackUploadClient::new(addr)?
      .upload_and_verify(vec![1], "image/png", Uuid::new_v4())
      .await
      .is_err());
    server.await??;
  }
  Ok(())
}

#[tokio::test]
async fn refuses_redirects_and_oversize_responses() -> anyhow::Result<()> {
  for response in ["HTTP/1.1 302 Found\r\nLocation: https://example.com/\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".into(),
    reply(200, &"x".repeat(1024 * 1024 + 1))] {
    let (addr, _, server) = fixture(vec![response]).await?;
    assert!(LoopbackUploadClient::new(addr)?.upload_and_verify(vec![1], "image/png", Uuid::new_v4()).await.is_err());
    // The client may close before the oversized response is completely written.
    let _ = server.await?;
  }
  Ok(())
}

#[test]
fn rejects_non_loopback_hosts_before_any_connection() {
  assert!(LoopbackUploadClient::new("192.0.2.1:80".parse().unwrap()).is_err());
}

#[tokio::test]
async fn does_not_retry_duplicate_id_or_lost_response() -> anyhow::Result<()> {
  for response in [
    reply(400, r#"{"error":"invalid idempotency token"}"#),
    String::new(),
  ] {
    let (addr, requests, server) = fixture(vec![response]).await?;
    let result = LoopbackUploadClient::new(addr)?
      .upload_and_verify(vec![1], "image/png", Uuid::new_v4())
      .await;
    assert!(result.is_err());
    server.await??;
    assert_eq!(requests.lock().unwrap().len(), 1);
  }
  Ok(())
}

type Requests = Arc<Mutex<Vec<Vec<u8>>>>;
type Server = tokio::task::JoinHandle<anyhow::Result<()>>;

async fn fixture(responses: Vec<String>) -> anyhow::Result<(SocketAddr, Requests, Server)> {
  let listener = TcpListener::bind("127.0.0.1:0").await?;
  let address = listener.local_addr()?;
  let requests = Arc::new(Mutex::new(Vec::new()));
  let captured = requests.clone();
  let server = tokio::spawn(async move {
    for response in responses {
      let (mut socket, _) =
        tokio::time::timeout(std::time::Duration::from_secs(10), listener.accept()).await??;
      let mut data = Vec::new();
      loop {
        let mut chunk = [0u8; 4096];
        let count = socket.read(&mut chunk).await?;
        anyhow::ensure!(count > 0, "Client closed before request completed");
        data.extend_from_slice(&chunk[..count]);
        if let Some(end) = data.windows(4).position(|w| w == b"\r\n\r\n") {
          let headers = String::from_utf8_lossy(&data[..end]).to_lowercase();
          let length: usize = headers
            .lines()
            .find_map(|line| line.strip_prefix("content-length: "))
            .unwrap_or("0")
            .trim()
            .parse()?;
          if data.len() >= end + 4 + length {
            break;
          }
        }
        anyhow::ensure!(
          data.len() < 2 * 1024 * 1024,
          "Request exceeded fixture limit"
        );
      }
      captured.lock().unwrap().push(data);
      socket.write_all(response.as_bytes()).await?;
      socket.shutdown().await?;
    }
    Ok(())
  });
  Ok((address, requests, server))
}

fn reply(status: u16, body: &str) -> String {
  format!("HTTP/1.1 {status} Fixture\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len())
}
