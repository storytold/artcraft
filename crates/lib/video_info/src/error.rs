use std::fmt;
use std::io;

/// Errors produced while reading and parsing video information.
#[derive(Debug)]
pub enum VideoInfoError {
  /// The file could not be read.
  Io(io::Error),

  /// The video has no recognizable Seedance / C2PA generative-AI manifest —
  /// either it isn't a Seedance generation, or the provenance metadata was
  /// stripped (e.g. by re-encoding).
  NotSeedance,

  /// The video has no recognizable Google Veo / Generative-AI C2PA manifest.
  NotVeo,

  /// The video has no recognizable OpenAI Sora C2PA manifest.
  NotSora,

  /// The video has no recognizable Dreamina (ByteDance/CapCut) `ilst` metadata.
  NotDreamina,

  /// The video has no recognizable Kling (Kuaishou) AIGC-label `ilst` metadata.
  NotKling,

  /// The video has no recognized provenance of any supported kind (returned by
  /// the [`crate::VideoInfo`] dispatcher when no format matches).
  Unrecognized,

  /// A manifest was detected, but a required field could not be extracted
  /// (truncated / unexpected manifest encoding). Carries a short description of
  /// what was missing.
  MalformedManifest(String),
}

impl fmt::Display for VideoInfoError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      Self::Io(err) => write!(f, "I/O error reading video: {}", err),
      Self::NotSeedance => write!(f, "no Seedance C2PA manifest found in video"),
      Self::NotVeo => write!(f, "no Google Veo C2PA manifest found in video"),
      Self::NotSora => write!(f, "no OpenAI Sora C2PA manifest found in video"),
      Self::NotDreamina => write!(f, "no Dreamina metadata found in video"),
      Self::NotKling => write!(f, "no Kling metadata found in video"),
      Self::Unrecognized => write!(f, "no recognized provenance found in video"),
      Self::MalformedManifest(detail) => write!(f, "malformed manifest: {}", detail),
    }
  }
}

impl std::error::Error for VideoInfoError {
  fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
    match self {
      Self::Io(err) => Some(err),
      _ => None,
    }
  }
}

impl From<io::Error> for VideoInfoError {
  fn from(err: io::Error) -> Self {
    Self::Io(err)
  }
}
