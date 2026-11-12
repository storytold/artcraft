use artcraft_image_bridge::{
  remote_verify::{compare_original, validate_original_url},
  ImageInfo,
};
use sha2::{Digest, Sha256};
use tokio::{
  io::{AsyncReadExt, AsyncWriteExt},
  net::TcpListener,
};

mod original_checks {
  use super::*;

  #[test]
  fn restricts_downloads_to_supported_https_cdn() {
    assert!(validate_original_url("https://cdn-2.fakeyou.com/media/example.png").is_ok());
    for url in [
      "http://cdn-2.fakeyou.com/media/a",
      "https://127.0.0.1/media/a",
      "https://cdn-2.fakeyou.com.evil.test/media/a",
      "https://cdn-2.fakeyou.com:444/media/a",
      "https://user:password@cdn-2.fakeyou.com/media/a",
      "https://cdn-2.fakeyou.com/elsewhere/a",
      "https://cdn-2.fakeyou.com/media/a?token=secret",
      "https://cdn-2.fakeyou.com/media/a#fragment",
    ] {
      assert!(validate_original_url(url).is_err());
    }
  }

  #[tokio::test]
  async fn compares_bytes_and_rejects_equal_length_substitution() -> anyhow::Result<()> {
    compare_original(response("200 OK", b"original", false).await?, &expected()).await?;
    assert!(
      compare_original(response("200 OK", b"modified", false).await?, &expected())
        .await
        .is_err()
    );
    Ok(())
  }

  #[tokio::test]
  async fn bounds_unadvertised_content_and_rejects_short_or_redirected_responses(
  ) -> anyhow::Result<()> {
    for (status, bytes) in [
      ("200 OK", b"original-too-long".as_slice()),
      ("200 OK", b"short".as_slice()),
      ("302 Found", b"original".as_slice()),
      ("206 Partial Content", b"original".as_slice()),
    ] {
      assert!(
        compare_original(response(status, bytes, true).await?, &expected())
          .await
          .is_err()
      );
    }
    Ok(())
  }
}

fn expected() -> ImageInfo {
  ImageInfo {
    sha256: format!("{:x}", Sha256::digest(b"original")),
    byte_size: 8,
    mime_type: "image/png".into(),
    width: 1,
    height: 1,
    has_alpha: false,
  }
}

async fn response(
  status: &str,
  body: &[u8],
  omit_length: bool,
) -> anyhow::Result<reqwest::Response> {
  let listener = TcpListener::bind("127.0.0.1:0").await?;
  let address = listener.local_addr()?;
  let length = if omit_length {
    String::new()
  } else {
    format!("Content-Length: {}\r\n", body.len())
  };
  let mut wire = format!("HTTP/1.1 {status}\r\n{length}Connection: close\r\n\r\n").into_bytes();
  wire.extend_from_slice(body);
  tokio::spawn(async move {
    let (mut socket, _) = listener.accept().await.unwrap();
    let mut request = Vec::new();
    while !request.ends_with(b"\r\n\r\n") {
      assert!(request.len() < 8192, "Fixture request headers too large");
      let mut byte = [0; 1];
      socket.read_exact(&mut byte).await.unwrap();
      request.push(byte[0]);
    }
    socket.write_all(&wire).await.unwrap();
    socket.shutdown().await.unwrap();
  });
  Ok(
    reqwest::Client::builder()
      .no_proxy()
      .redirect(reqwest::redirect::Policy::none())
      .build()?
      .get(format!("http://{address}/original"))
      .send()
      .await?,
  )
}
