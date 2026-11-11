use std::io::{Error, ErrorKind};
use std::net::IpAddr;
use std::sync::Arc;
use std::time::Duration;

use reqwest::dns::{Addrs, Name, Resolve, Resolving};
use reqwest::{Client, Url};

struct PublicDns;

/// Build a bounded-time media client without proxies or redirects and with public-only DNS.
pub(super) fn public_media_client() -> Result<Client, reqwest::Error> {
  Client::builder()
    .connect_timeout(Duration::from_secs(10))
    .timeout(Duration::from_secs(600))
    .no_proxy()
    .redirect(reqwest::redirect::Policy::none())
    .dns_resolver(Arc::new(PublicDns))
    .build()
}

/// Require HTTP(S), no userinfo, and public IP literals before downloading provider output.
pub(super) fn validate_media_url(value: &str) -> anyhow::Result<Url> {
  let url = Url::parse(value)?;
  anyhow::ensure!(matches!(url.scheme(), "http" | "https") && url.host().is_some() && url.username().is_empty() && url.password().is_none(), "Provider output must be a public HTTP(S) URL");
  match url.host() {
    Some(url::Host::Ipv4(address)) => anyhow::ensure!(is_public(address.into()), "Provider output address is not public"),
    Some(url::Host::Ipv6(address)) => anyhow::ensure!(is_public(address.into()), "Provider output address is not public"),
    _ => {},
  }
  Ok(url)
}

impl Resolve for PublicDns {
  /// Resolve hostnames to socket addresses, rejecting any private or reserved result.
  fn resolve(&self, name: Name) -> Resolving {
    Box::pin(async move {
      let addresses: Vec<_> = tokio::net::lookup_host((name.as_str(), 0)).await?.collect();
      if addresses.is_empty() || addresses.iter().any(|address| !is_public(address.ip())) {
        return Err(Error::new(ErrorKind::PermissionDenied, "Provider output DNS must resolve only to public addresses").into());
      }
      Ok(Box::new(addresses.into_iter()) as Addrs)
    })
  }
}

/// Exclude private, local, documentation, transition, and reserved address ranges from transfers.
fn is_public(address: IpAddr) -> bool {
  match address {
    IpAddr::V4(address) => {
      let [first, second, third, _] = address.octets();
      !address.is_private() && !address.is_loopback() && !address.is_link_local() && !address.is_documentation()
        && first != 0 && first < 224 && !(first == 100 && (64..=127).contains(&second))
        && !(first == 192 && second == 0 && third == 0) && !(first == 192 && second == 88 && third == 99)
        && !(first == 198 && (18..=19).contains(&second))
    },
    IpAddr::V6(address) => {
      let segments = address.segments();
      segments[0] & 0xe000 == 0x2000 && !(segments[0] == 0x2001 && segments[1] < 0x200)
        && !(segments[0] == 0x2001 && segments[1] == 0xdb8) && segments[0] != 0x2002
        && !(segments[0] == 0x3fff && segments[1] & 0xf000 == 0)
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn rejects_private_literal_and_dns_targets_and_non_http_urls() {
    for url in ["file:///etc/passwd", "ftp://example.com/file", "http://127.0.0.1/", "http://169.254.169.254/", "http://100.64.0.1/", "http://[::1]/", "http://[::ffff:127.0.0.1]/", "http://user:password@example.com/"] {
      assert!(validate_media_url(url).is_err(), "{url}");
    }
    assert!(PublicDns.resolve("localhost".parse().unwrap()).await.is_err());
    assert!(validate_media_url("https://example.com/result.png").is_ok());
    assert!(is_public("8.8.8.8".parse().unwrap()));
    assert!(is_public("2606:4700:4700::1111".parse().unwrap()));
  }
}
