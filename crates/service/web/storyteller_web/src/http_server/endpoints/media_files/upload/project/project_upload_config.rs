//! Static per-project-kind configuration for the project save endpoints
//! (`/v1/media_files/upload/project/{kind}/new` and `.../update/{token}`).

use enums::by_table::media_files::media_file_project_type::MediaFileProjectType;
use enums::by_table::media_files::media_file_type::MediaFileType;

pub const PROJECT_MIMETYPE: &str = "application/json";

pub struct ProjectUploadConfig {
  pub project_type: MediaFileProjectType,
  pub media_file_type: MediaFileType,
  pub bucket_prefix: &'static str,
  pub bucket_suffix: &'static str,
}

pub const MOOD_BOARD_PROJECT_CONFIG: ProjectUploadConfig = ProjectUploadConfig {
  project_type: MediaFileProjectType::MoodBoard,
  media_file_type: MediaFileType::MoodJson,
  bucket_prefix: "artcraft_",
  bucket_suffix: ".mood.json",
};

pub const VIDEO_TIMELINE_PROJECT_CONFIG: ProjectUploadConfig = ProjectUploadConfig {
  project_type: MediaFileProjectType::VideoTimeline,
  media_file_type: MediaFileType::TimelineJson,
  bucket_prefix: "artcraft_",
  bucket_suffix: ".timeline.json",
};

pub const EDITOR_2D_PROJECT_CONFIG: ProjectUploadConfig = ProjectUploadConfig {
  project_type: MediaFileProjectType::Editor2d,
  media_file_type: MediaFileType::EditorJson,
  bucket_prefix: "artcraft_",
  bucket_suffix: ".editor.json",
};

pub const SCENE_3D_PROJECT_CONFIG: ProjectUploadConfig = ProjectUploadConfig {
  project_type: MediaFileProjectType::Scene3d,
  media_file_type: MediaFileType::SceneJson,
  bucket_prefix: "scene_",
  bucket_suffix: ".scn.json",
};
