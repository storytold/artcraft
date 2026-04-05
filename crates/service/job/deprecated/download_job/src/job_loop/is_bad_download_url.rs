use log::debug;
use url::{Host, Url};

/// Reports if the URL is inappropriate for downloading as a TTS model, vocoder, etc.
pub fn is_bad_download_url(url: &str) -> anyhow::Result<bool> {

  if url.trim().is_empty() {
    // We can't use empty URLs.
    return Ok(true);
  }

  let looks_malicious = url.contains("\"")
      || url.contains("\'")
      || url.contains("\\");

  if looks_malicious {
    return Ok(true);
  }

  let url = Url::parse(url)?;

  match url.host() {
    Some(Host::Domain(domain)) => {
      let domain = domain.to_lowercase();

      // TODO: If this list grows, store it in a static hashset
      let bad_host = domain.contains("fb.watch")
          || domain.contains("tiktok.com")
          || domain.contains("vm.tiktok.com") // NB: This hostname is known for never disconnecting, which freezes the job
          || domain.contains("youtu.be")
          || domain.contains("youtube.com");

      debug!("domain: {:?}", domain);

      if bad_host {
        return Ok(true)
      }
    }
    _ => {},
  }

  Ok(false)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn bad_download_url() {
    assert_eq!(true, is_bad_download_url("").unwrap());
    assert_eq!(true, is_bad_download_url("   ").unwrap());
    assert_eq!(true, is_bad_download_url("https://vm.tiktok.com/ZMNYjT7Xy/?k=1 ").unwrap()); // NB: We get lots of these
    assert_eq!(true, is_bad_download_url("https://m.youtube.com/watch?v=HY-vzGBiAZo").unwrap()); // NB: We get lots of these
  }

  #[test]
  fn attacker_urls() {
    // NB: These URLs may break escaping
    assert_eq!(true, is_bad_download_url("https://huggingface.co/\"").unwrap());
    assert_eq!(true, is_bad_download_url("https://huggingface.co/\"/bin/bash").unwrap());
    assert_eq!(true, is_bad_download_url("https://huggingface.co/\\\'").unwrap());
    assert_eq!(true, is_bad_download_url("https://huggingface.co/\\\"").unwrap());
  }

  #[test]
  fn good_tts_model_url() {
    assert_eq!(false, is_bad_download_url("https://drive.google.com/file/d/1-1kEoX4HGCwJm4R9cZhSVByWmUoQVGVm/view").unwrap());
    assert_eq!(false, is_bad_download_url("https://drive.google.com/file/d/1SofQhvSkDY-vi_zuBfHivBbJo4CqhJeH/view?usp=sharing").unwrap());
  }

  #[test]
  fn tricky_download_urls() {
    // NB: These are URLs that have caused problems
    assert_eq!(false, is_bad_download_url("https://huggingface.co/aaalby/nmixx/resolve/main/kyujin(1).zip").unwrap());
    assert_eq!(false, is_bad_download_url("https://huggingface.co/datasets/Roscall/Elvis70s/resolve/main/Elvis%2070s%20RVC.zip?download=true").unwrap());
  }
}
