README
======

This directory contains a collection of (hopefully organized and up to date) documentation on 
running the various backend pieces, development setup, production maintenance, etc. Check out 
all the markdown documents in this directory tree for information organized by topic.

Development / Setup
-------------------

- [Most of the general documents for cross-cutting setup of FakeYou.com live here.](./local_development)
- Some per-application documents (such as for `aichatbot-sidecar`) live as READMEs under that particular 
  application's code directory, eg. `/crates/{appCategory}/{appName}/README.md` (These are irrelevant 
  for most folks.)

Web API Overview
----------------

### FakeYou.com

* [FakeYou.com](https://fakeyou.com) is powered by the following applications:
    * HTTP APIs:
        * `storyteller-web` - HTTP API + database monolith for FakeYou
    * Asynchronous Jobs:
        * `download-job` - Handle async download of ML models (RVC, SVC, etc.)
        * `inference-job` - Run async ML model inference (RVC, SVC, SadTalker, etc.) 
                            This will handle most model inference going forward.
        * `tts-download-job` - (*deprecated*) Async download of Tacotron2 models only
        * `tts-inference-job` - (*deprecated*) Async TTS inference of Tacotron2 models only
        * `w2l-download-job` - (*deprecated*) Async download of videos and images
        * `w2l-inference-job` - (*deprecated*) Async W2L inference
    * Documentation Server:
        * `docs` - this will run a local swagger server with the endpoints that you have access to, http://127.0.0.1:8989/api-docs/openapi.json use this to port everything over to the post man.
        
### PowerStream

* [PowerStream](https://power.stream) (deprecated) is powered by the following applications:
    * HTTP APIs:
        * `storyteller-web` - HTTP + database monolith for FakeYou ***and*** PowerStream.
    * Twitch API integration:
        * `twitch-pubsub-subscriber` - Dynamically subscribes to Twitch PubSub for "active" users
    * Websocket events:
        * `websocket-gateway` - Websocket for users' browsers to pull down enriched Twitch events.

TODO
----

Notes / TODOs:

* Examples for good Actix+Sqlx Tests:
  https://stackoverflow.com/questions/65370752/how-do-i-create-an-actix-web-server-that-accepts-both-sqlx-database-pools-and-tr

* Actix/sqlx runtime compat:
  https://github.com/launchbadge/sqlx/issues/1117#issuecomment-801237734
