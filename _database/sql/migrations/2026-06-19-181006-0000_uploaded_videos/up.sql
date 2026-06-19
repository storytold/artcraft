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
  width INT(10) UNSIGNED DEFAULT NULL,
  height INT(10) UNSIGNED DEFAULT NULL,

  -- ========== DETECTION ==========

  -- Detected provenance family (e.g. "seedance", "veo", "sora", "dreamina", "kling").
  detected_model_family VARCHAR(32) DEFAULT NULL,

  -- Detected model type / variant (e.g. "full", "fast", "mini").
  detected_model_type VARCHAR(32) DEFAULT NULL,

  -- Free-form model name for anything that doesn't map to a known type.
  other_model_name VARCHAR(64) DEFAULT NULL,

  -- ========== IP ADDRESS ==========

  -- IP address that uploaded the video. Wide enough for IPv4/IPv6.
  upload_ip_address VARCHAR(40) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (sha1_checksum),
  KEY index_detected_model_family (detected_model_family)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
