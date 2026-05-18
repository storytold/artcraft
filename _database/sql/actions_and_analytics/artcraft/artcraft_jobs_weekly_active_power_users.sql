-- Weekly active "power users" for ArtCraft since January 1st, 2026.
-- A "power user" is a user who created more than 10 ArtCraft inference jobs in the calendar month.
-- This query then counts how many such power users were active in each week.

SELECT
  DATE(DATE_SUB(j.created_at, INTERVAL WEEKDAY(j.created_at) DAY)) AS week_start,
  COUNT(DISTINCT j.maybe_creator_user_token) AS weekly_active_power_users
FROM generic_inference_jobs j
INNER JOIN users u ON u.token = j.maybe_creator_user_token
INNER JOIN (
  SELECT maybe_creator_user_token, DATE_FORMAT(created_at, '%Y-%m') AS month
  FROM generic_inference_jobs
  WHERE created_at >= '2026-01-01'
    AND maybe_creator_user_token IS NOT NULL
    AND job_type NOT IN (
      'gpt_sovits', 'tacotron2', 'rvc_v2', 'f5_tts',
      'so_vits_svc', 'styletts2', 'face_fusion', 'seed_vc', 'comfy_ui'
    )
  GROUP BY maybe_creator_user_token, month
  HAVING COUNT(*) > 10
) power ON power.maybe_creator_user_token = j.maybe_creator_user_token
  AND power.month = DATE_FORMAT(j.created_at, '%Y-%m')
WHERE j.created_at >= '2026-01-01'
  AND j.maybe_creator_user_token IS NOT NULL
  AND j.job_type NOT IN (
    'gpt_sovits', 'tacotron2', 'rvc_v2', 'f5_tts',
    'so_vits_svc', 'styletts2', 'face_fusion', 'seed_vc', 'comfy_ui'
  )
GROUP BY week_start
ORDER BY week_start DESC;
