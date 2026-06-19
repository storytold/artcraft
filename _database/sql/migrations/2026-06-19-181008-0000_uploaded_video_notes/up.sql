-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE uploaded_video_notes (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (used internally for lookups and as a foreign key).
  token VARCHAR(32) NOT NULL,

  -- The uploaded video this note is about (FK to uploaded_videos.token).
  uploaded_video_token VARCHAR(32) NOT NULL,

  -- ========== SUBMISSION ==========

  -- Original filename of the submitted clip, as provided by the user.
  filename VARCHAR(512) DEFAULT NULL,

  -- The model type the submitter claims this video is.
  reported_model_type VARCHAR(32) DEFAULT NULL,

  -- Free-form custom model name when the submitter's model isn't a known type.
  maybe_reported_model_name VARCHAR(64) DEFAULT NULL,

  -- The website / platform the video was obtained from.
  website VARCHAR(32) DEFAULT NULL,

  -- Free-form website when it isn't a known option.
  other_website VARCHAR(128) DEFAULT NULL,

  -- Free-form comments from the submitter.
  comments VARCHAR(1024) DEFAULT NULL,

  -- ========== IP ADDRESS ==========

  -- IP address that submitted the note. Wide enough for IPv4/IPv6.
  comment_ip_address VARCHAR(40) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY fk_uploaded_video_token (uploaded_video_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
