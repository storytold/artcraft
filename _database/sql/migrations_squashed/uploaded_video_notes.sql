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
  maybe_filename VARCHAR(512) DEFAULT NULL,

  -- The model type the submitter claims this video is.
  maybe_reported_model_type VARCHAR(32) DEFAULT NULL,

  -- Free-form custom model name when the submitter's model isn't a known type.
  maybe_reported_model_name VARCHAR(64) DEFAULT NULL,

  -- The website / platform the video was obtained from.
  maybe_website VARCHAR(32) DEFAULT NULL,

  -- Free-form website when it isn't a known option.
  maybe_other_website VARCHAR(128) DEFAULT NULL,

  -- Free-form comments from the submitter.
  maybe_comments VARCHAR(1024) DEFAULT NULL,

  -- ========== CONTACT & FLAGS ==========

  -- Optional email address for follow-up.
  maybe_email_address VARCHAR(255) DEFAULT NULL,

  -- Whether the submitter consents to us sharing the report.
  can_share_report BOOLEAN NOT NULL DEFAULT FALSE,

  -- Whether the submitter believes they were scammed.
  was_scammed BOOLEAN NOT NULL DEFAULT FALSE,

  -- ========== IP ADDRESSES ==========

  -- IP address that submitted the note. Wide enough for IPv4/IPv6.
  comment_create_ip_address VARCHAR(40) NOT NULL,

  -- IP address that last updated the note. Wide enough for IPv4/IPv6.
  maybe_comment_update_ip_address VARCHAR(40) DEFAULT NULL,

  -- ========== VERSION ==========

  -- Optimistic-concurrency "vector clock". Bump by 1 on every update — set in
  -- the UPDATE statement (MySQL can't auto-increment a plain column via schema).
  version INT(8) UNSIGNED NOT NULL DEFAULT 0,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY fk_uploaded_video_token (uploaded_video_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
