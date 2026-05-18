-- Monthly ArtCraft generations by power users since January 1st, 2026.
-- A "power user" is a user who created more than 10 ArtCraft jobs in the calendar month.

SELECT
  month,
  SUM(job_count) AS generations
FROM (
  SELECT
    maybe_creator_user_token,
    DATE_FORMAT(created_at, '%Y-%m') AS month,
    COUNT(*) AS job_count
  FROM generic_inference_jobs
  WHERE created_at >= '2026-01-01'
    AND maybe_creator_user_token IS NOT NULL
    AND job_type NOT IN (
      'gpt_sovits', 'tacotron2', 'rvc_v2', 'f5_tts',
      'so_vits_svc', 'styletts2', 'face_fusion', 'seed_vc', 'comfy_ui'
    )
  GROUP BY maybe_creator_user_token, month
  HAVING COUNT(*) > 10
) power
GROUP BY month
ORDER BY month DESC;
