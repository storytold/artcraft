-- Monthly active "power users" for ArtCraft since January 1st, 2026.
-- A "power user" is a user who created more than 10 ArtCraft inference jobs in the calendar month.

SELECT
  month,
  COUNT(*) AS monthly_active_power_users
FROM (
  SELECT
    maybe_creator_user_token,
    DATE_FORMAT(j.created_at, '%Y-%m') AS month
  FROM generic_inference_jobs j
  INNER JOIN users u ON u.token = j.maybe_creator_user_token
  WHERE j.created_at >= '2026-01-01'
    AND j.maybe_creator_user_token IS NOT NULL
    AND j.job_type NOT IN (
      'gpt_sovits', 'tacotron2', 'rvc_v2', 'f5_tts',
      'so_vits_svc', 'styletts2', 'face_fusion', 'seed_vc', 'comfy_ui'
    )
  GROUP BY maybe_creator_user_token, month
  HAVING COUNT(*) > 10
) power
GROUP BY month
ORDER BY month DESC;
