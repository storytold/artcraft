-- Daily ArtCraft generations since January 1st, 2026.

SELECT
  DATE(created_at) AS day,
  COUNT(*) AS generations
FROM generic_inference_jobs
WHERE created_at >= '2026-01-01'
  AND job_type NOT IN (
    'gpt_sovits', 'tacotron2', 'rvc_v2', 'f5_tts',
    'so_vits_svc', 'styletts2', 'face_fusion', 'seed_vc', 'comfy_ui'
  )
GROUP BY day
ORDER BY day DESC;
