//! Shared resolve helpers for the Kinovi audio provider.
//!
//! The remix/sample models take exactly one user audio reference, which must
//! be downloaded from our CDN and re-uploaded to the Kinovi CDN during the
//! draft `finalize()` phase. The upload plumbing is shared with the Kinovi
//! video provider (`generate_video::providers::kinovi::upload`).

use seedance2pro_web_client::creds::seedance2pro_session::Seedance2ProSession;
use tokens::tokens::media_files::MediaFileToken;

use crate::api::audio_list_ref::AudioListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_audio::audio_generation_draft_context::AudioGenerationDraftContext;
use crate::generate::generate_video::providers::kinovi::upload::upload_to_seedance2pro;

/// A single unresolved audio reference: either an ArtCraft/public URL or a
/// media file token that resolves to one via the draft context's map.
#[derive(Debug, Clone)]
pub enum SingleAudioRef {
  Url(String),
  MediaFileToken(MediaFileToken),
}

/// Extract exactly one audio reference from the builder's audio list.
/// The Kinovi remix/sample models operate on a single source track, so zero
/// or multiple references are rejected regardless of mitigation strategy.
pub(crate) fn require_single_audio_ref(
  audio_references: Option<AudioListRef>,
) -> Result<SingleAudioRef, ArtcraftRouterError> {
  let refs = match audio_references {
    None => {
      return Err(ArtcraftRouterError::InvalidInput(
        "Exactly one audio reference is required, but none was provided".to_string(),
      ));
    }
    Some(AudioListRef::Urls(urls)) => urls.into_iter().map(SingleAudioRef::Url).collect::<Vec<_>>(),
    Some(AudioListRef::MediaFileTokens(tokens)) => {
      tokens.into_iter().map(SingleAudioRef::MediaFileToken).collect::<Vec<_>>()
    }
  };

  match refs.len() {
    0 => Err(ArtcraftRouterError::InvalidInput(
      "Exactly one audio reference is required, but none was provided".to_string(),
    )),
    1 => Ok(refs.into_iter().next().expect("length checked above")),
    count => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "audio_references",
      value: format!("Exactly one audio reference is required, got {}", count),
    })),
  }
}

/// Resolve a single audio reference to a source URL and re-upload it to the
/// Kinovi CDN, returning the Kinovi CDN URL.
pub(crate) async fn resolve_and_upload_audio_ref(
  session: &Seedance2ProSession,
  audio_ref: &SingleAudioRef,
  draft_context: &AudioGenerationDraftContext<'_>,
) -> Result<String, ArtcraftRouterError> {
  let source_url = match audio_ref {
    SingleAudioRef::Url(url) => url.clone(),
    SingleAudioRef::MediaFileToken(token) => {
      let map = draft_context.media_file_to_artcraft_url_map
        .ok_or(ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided))?;
      map.get(token).cloned().ok_or_else(|| {
        ArtcraftRouterError::Client(ClientError::MediaFileTokenNotFoundInMap {
          token: token.clone(),
        })
      })?
    }
  };
  upload_to_seedance2pro(session, &source_url).await
}

#[cfg(test)]
mod tests {
  use super::*;

  mod require_single_audio_ref_tests {
    use super::*;

    #[test]
    fn none_is_rejected() {
      assert!(require_single_audio_ref(None).is_err());
    }

    #[test]
    fn empty_url_list_is_rejected() {
      assert!(require_single_audio_ref(Some(AudioListRef::Urls(vec![]))).is_err());
    }

    #[test]
    fn empty_token_list_is_rejected() {
      assert!(require_single_audio_ref(Some(AudioListRef::MediaFileTokens(vec![]))).is_err());
    }

    #[test]
    fn single_url_is_accepted() {
      let result = require_single_audio_ref(Some(AudioListRef::Urls(vec![
        "https://example.com/a.mp3".to_string(),
      ]))).expect("should accept a single URL");
      assert!(matches!(result, SingleAudioRef::Url(url) if url == "https://example.com/a.mp3"));
    }

    #[test]
    fn single_token_is_accepted() {
      let result = require_single_audio_ref(Some(AudioListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_test123".to_string()),
      ]))).expect("should accept a single token");
      assert!(matches!(result, SingleAudioRef::MediaFileToken(t) if t.as_str() == "mf_test123"));
    }

    #[test]
    fn two_urls_are_rejected() {
      let result = require_single_audio_ref(Some(AudioListRef::Urls(vec![
        "https://example.com/a.mp3".to_string(),
        "https://example.com/b.mp3".to_string(),
      ])));
      assert!(result.is_err());
    }

    #[test]
    fn two_tokens_are_rejected() {
      let result = require_single_audio_ref(Some(AudioListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_a".to_string()),
        MediaFileToken::new("mf_b".to_string()),
      ])));
      assert!(result.is_err());
    }
  }
}
