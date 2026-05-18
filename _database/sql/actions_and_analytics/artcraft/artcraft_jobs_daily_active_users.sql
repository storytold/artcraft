-- Daily active users for ArtCraft since January 1st, 2026.
-- A "daily active user" is a user who created at least one ArtCraft inference job that day.

SELECT
  DATE(j.created_at) AS day,
  COUNT(DISTINCT j.maybe_creator_user_token) AS daily_active_users
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
GROUP BY DATE(j.created_at)
ORDER BY day DESC;

