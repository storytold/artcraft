redis schema
============

Database 0: TTS / RateLimiter
-----------------------------

TODO: Document rate limiter

Public statistics on usage displayed on the website:

* `ttsUseCount:{model_token}`: INCR, GET
* `w2lUseCount:{template_token}`: INCR, GET
  
Temporary job progress reports to the user:

These are written as a single string, such as "downloading model", "uploading model", 
"generating preview", "executing", etc.

* `ttsDownloadExtraStatus:{inference_job_token}`: SETEX, GET
* `ttsInferenceExtraStatus:{inference_job_token}`: SETEX, GET
* `w2lDownloadExtraStatus:{inference_job_token}`: SETEX, GET
* `w2lInferenceExtraStatus:{inference_job_token}`: SETEX, GET

Database 1: Obs / Twitch
------------------------

* WIP
