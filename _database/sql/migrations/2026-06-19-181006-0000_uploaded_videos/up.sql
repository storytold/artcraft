-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE uploaded_videos (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (used internally for lookups and as a foreign key).
  token VARCHAR(32) NOT NULL,

  -- ========== FILE ==========

  -- SHA-1 checksum of the uploaded bytes (40 hex chars). De-dupes uploads.
  sha1_checksum VARCHAR(40) NOT NULL,

  -- Size of the uploaded file in bytes.
  filesize_bytes INT(10) UNSIGNED NOT NULL,

  -- Pixel dimensions, when they could be determined.
  maybe_width INT(10) UNSIGNED DEFAULT NULL,
  maybe_height INT(10) UNSIGNED DEFAULT NULL,

  -- Resolution label (e.g. "1080p", "1920x1080"), when known.
  maybe_resolution VARCHAR(12) DEFAULT NULL,

  -- ========== DETECTION ==========

  -- Detected provenance family (e.g. "seedance", "veo", "sora", "dreamina", "kling").
  maybe_detected_model_family VARCHAR(32) DEFAULT NULL,

  -- Detected model type / variant (e.g. "full", "fast", "mini").
  maybe_detected_model_type VARCHAR(32) DEFAULT NULL,

  -- Free-form report / analysis blob for this upload.
  maybe_report MEDIUMTEXT DEFAULT NULL,

  -- ========== IP ADDRESSES ==========

  -- IP address that uploaded the video. Wide enough for IPv4/IPv6.
  upload_ip_address VARCHAR(40) NOT NULL,

  -- IP address that last updated the row. Wide enough for IPv4/IPv6.
  maybe_updated_ip_address VARCHAR(40) DEFAULT NULL,

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
  UNIQUE KEY (sha1_checksum),
  KEY index_maybe_detected_model_family (maybe_detected_model_family)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
