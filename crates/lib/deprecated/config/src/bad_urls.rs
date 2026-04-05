use url::{Host, Url};

/// Reports if the URL is inappropriate for downloading as a TTS model, vocoder, etc.
pub fn is_bad_tts_model_download_url(url: &str) -> anyhow::Result<bool> {
  is_bad_download_url(url)
}

pub fn is_bad_model_weights_download_url(url: &str) -> anyhow::Result<bool> {
  is_bad_download_url(url)
}

fn is_bad_download_url(url: &str) -> anyhow::Result<bool> {
  if url.trim().is_empty() {
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

      let bad_host = domain.contains("fb.watch")
          || domain.contains("tiktok.com")
          || domain.contains("vm.tiktok.com")
          || domain.contains("youtu.be")
          || domain.contains("youtube.com");

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
  use crate::bad_urls::is_bad_tts_model_download_url;

  #[test]
  fn bad_tts_model_url() {
    assert_eq!(is_bad_tts_model_download_url("").unwrap(), true);
    assert_eq!(is_bad_tts_model_download_url("   ").unwrap(), true);
    assert_eq!(is_bad_tts_model_download_url("https://vm.tiktok.com/ZMNYjT7Xy/?k=1 ").unwrap(), true); // NB: We get lots of these
    assert_eq!(is_bad_tts_model_download_url("https://m.youtube.com/watch?v=HY-vzGBiAZo").unwrap(), true); // NB: We get lots of these
  }

  #[test]
  fn good_tts_model_url() {
    assert_eq!(is_bad_tts_model_download_url("https://drive.google.com/file/d/1-1kEoX4HGCwJm4R9cZhSVByWmUoQVGVm/view").unwrap(), false);
    assert_eq!(is_bad_tts_model_download_url("https://drive.google.com/file/d/1SofQhvSkDY-vi_zuBfHivBbJo4CqhJeH/view?usp=sharing").unwrap(), false);
  }
}