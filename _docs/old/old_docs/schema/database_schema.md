database schema
================

(This is woefully incomplete and unmaintained.)

Twitch Model
------------

- `twitch_user_id`
  Though numeric, this should always be a string per
  [https://discuss.dev.twitch.tv/t/bug-v5-api-returns--id-as-string-for-featured-channels/10310]
  and 
  [https://discuss.dev.twitch.tv/t/type-of-user-id-in-api-responses/10205]
  
- `twitch_channel_id`
  This is the same as `twitch_user_id`. They're exactly 1:1. Prefer to 
  use 'user_id' terminology.

- `twitch_username`
  Between 4 and 25 characters.

