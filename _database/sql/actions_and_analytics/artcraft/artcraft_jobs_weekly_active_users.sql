-- Weekly active users for ArtCraft since January 1st, 2026.
-- A "weekly active user" is a user who created at least one ArtCraft inference job that week.

SELECT
  DATE(DATE_SUB(j.created_at, INTERVAL WEEKDAY(j.created_at) DAY)) AS week_start,
  COUNT(DISTINCT j.maybe_creator_user_token) AS weekly_active_users
FROM generic_inference_jobs j
INNER JOIN users u ON u.token = j.maybe_creator_user_token
WHERE j.created_at >= '2026-01-01'
  AND j.maybe_creator_user_token IS NOT NULL
  AND j.job_type NOT IN (
    'gpt_sovits',
    'tacotron2',
    'rvc_v2',
    'f5_tts',
    'so_vits_svc',
    'styletts2',
    'face_fusion',
    'seed_vc',
    'comfy_ui'
  )
GROUP BY week_start
ORDER BY week_start DESC;
