use serde::Deserialize;
use serde::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Details about submitted live portrait jobs (request arguments only)
#[derive(Serialize, Deserialize, ToSchema)]
pub struct JobDetailsLivePortraitRequest {
  /// Source media token
  /// This can be an image or a video media file token
  /// This is what constitutes the "portrait" or the overall final video.
  /// This video or image must contain a face.
  pub source_media_file_token: MediaFileToken,

  /// Driving media token
  /// This must be a video media file token.
  /// This drives the animation of the face, but the actor will disappear
  /// and their facial expressions will be transferred to the source.
  /// This video must contain a face.
  pub face_driver_media_file_token: MediaFileToken,
}

/// Details about submitted lipsync jobs (request arguments only)
#[derive(Serialize, Deserialize, ToSchema)]
pub struct JobDetailsLipsyncRequest {
  /// Media file token for the source audio.
  /// This is probably an audio file, but in the future we might pull audio from video.
  pub audio_source_token: MediaFileToken,

  /// Media file token for the source visuals.
  /// This is either an image or video.
  pub image_or_video_source_token: MediaFileToken,
}
