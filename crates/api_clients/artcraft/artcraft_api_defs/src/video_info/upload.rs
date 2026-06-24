//! Response type for `POST /v1/video_info/upload`.
//!
//! Same detected provenance as the read-only endpoint, plus the persisted
//! [`UploadedVideoToken`] (used for follow-up requests, e.g. attaching a note).

use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::uploaded_videos::UploadedVideoToken;

use crate::video_info::read_only::{
  DreaminaVideoInfo, KlingVideoInfo, SeedanceVideoInfo, SoraVideoInfo, VeoVideoInfo,
  VideoProvenanceKind,
};

/// Response for `POST /v1/video_info/upload`. Mirrors
/// [`crate::video_info::read_only::VideoInfoReadOnlyResponse`] and adds the
/// persisted record's token.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct VideoInfoUploadResponse {
  pub success: bool,

  /// The persisted `uploaded_videos` record token (e.g. `uvt_…`).
  pub uploaded_video_token: UploadedVideoToken,

  /// Which provenance family was detected (if any).
  pub kind: VideoProvenanceKind,

  /// The container `©too` encoder tag, e.g. `"Lavf60.16.100"` or `"Google"`.
  pub maybe_encoder: Option<String>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Seedance`].
  pub maybe_seedance: Option<SeedanceVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Veo`].
  pub maybe_veo: Option<VeoVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Sora`].
  pub maybe_sora: Option<SoraVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Dreamina`].
  pub maybe_dreamina: Option<DreaminaVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Kling`].
  pub maybe_kling: Option<KlingVideoInfo>,
}
