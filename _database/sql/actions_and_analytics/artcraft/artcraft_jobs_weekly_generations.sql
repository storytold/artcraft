-- Weekly ArtCraft generations since January 1st, 2026.

SELECT
  DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) AS week_start,
  COUNT(*) AS generations
FROM generic_inference_jobs
WHERE created_at >= '2026-01-01'
  AND job_type NOT IN (
    'gpt_sovits', 'tacotron2', 'rvc_v2', 'f5_tts',
    'so_vits_svc', 'styletts2', 'face_fusion', 'seed_vc', 'comfy_ui'
  )
GROUP BY week_start
ORDER BY week_start DESC;
