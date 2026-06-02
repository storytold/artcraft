-- Daily ArtCraft generations broken down by model_type since January 1st, 2026.
-- One row per (day, model_type) pair.

SELECT
  DATE(created_at) AS day,
  maybe_model_type AS model_type,
  COUNT(*) AS generations
FROM generic_inference_jobs
WHERE created_at >= '2026-01-01'
  AND maybe_model_type IS NOT NULL
  AND job_type NOT IN (
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
GROUP BY day, model_type
ORDER BY day DESC, generations DESC;
