# agent-notify-server

Tiny local HTTP server that plays notification sounds for long-running agents
(Claude Code, in particular). Replaces ad-hoc `afplay` bash loops that were
prone to leaving zombie processes — the server owns the audio pipeline and
exits cleanly with Ctrl+C.

## Run

```sh
cargo run --bin agent-notify-server
# or, for a release-mode binary:
cargo run --release --bin agent-notify-server
```

The server listens on `127.0.0.1:43110` by default. Override with
`HTTP_BIND_ADDRESS`. Override the config path with `NOTIFY_CONFIG_PATH`
(defaults to `crates/tools/servers/agent_notify_server/config/notify_config.yaml`).

## Endpoints

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/` | Static HTML page listing the API. |
| GET | `/alert_beep` | Play `alert_beep_sound` once (mixes over any active loop). |
| GET | `/alert_done` | Play `alert_done_sound` once. |
| GET | `/alert_await` | Play `alert_await_user_input_sound` once. |
| GET | `/loop_beep` | Loop `alert_beep_sound`. Replaces any active loop. |
| GET | `/loop_done` | Loop `alert_done_sound`. Replaces any active loop. |
| GET | `/loop_await` | Loop `alert_await_user_input_sound`. Replaces any active loop. |
| GET | `/stop` | Stop everything — loops *and* queued one-shots. |
| GET | `/state` | Read-only JSON snapshot of the audio engine and loaded config. Does **not** change playback. |

Mixing rules:

- One-shots mix with whichever loop is playing.
- Requesting a new loop replaces the prior loop.
- `/stop` halts everything.
- A missing config key makes the corresponding endpoint return `404`.

### `/state` response shape

```json
{
  "audio": {
    "loop_playing": true,
    "loop_name": "done",
    "voices_active": 2,
    "current_stage": 1,
    "current_gap_millis": 1000,
    "current_jitter_millis": 750,
    "loop_pool_size": 4,
    "loop_uptime_secs": 17
  },
  "config": {
    "alert_beep_sound": "…/test_beep.wav",
    "alert_done_sound": "…/smrpg_flower.wav",
    "alert_await_user_input_sound": "…/smrpg_ghost.wav",
    "extra_alert_beep_count": 0,
    "extra_alert_done_count": 3,
    "extra_alert_await_count": 3,
    "gap_schedule_millis": [2000, 1000, 500, 200],
    "jitter_schedule_millis": [1500, 750, 400, 180],
    "escalate_waits_secs": [10, 20, 30]
  }
}
```

`loop_name` reflects which endpoint started the loop (`beep` / `done` /
`await`). When idle, `loop_playing` is `false` and the loop fields collapse
to zero/null.

## Config

`config/notify_config.yaml`:

```yaml
alert_beep_sound: test_beep.wav
alert_done_sound: smrpg_flower.wav
alert_await_user_input_sound: smrpg_ghost.wav

extra_alert_beep_sounds: []
extra_alert_done_sounds:
  - smrpg_specialflower.wav
  - smrpg_correct.wav
extra_alert_await_sounds:
  - smrpg_wrong.wav
  - smrpg_drybones_crumble.wav

loop_alert_timeout_millis: 2000
loop_alert_timeout_millis_1: 1000
loop_alert_timeout_millis_2: 500
loop_alert_timeout_millis_3: 200
loop_alert_jitter_millis: 250
loop_alert_jitter_millis_1: 150
loop_alert_jitter_millis_2: 80
loop_alert_jitter_millis_3: 40
escalate_wait_1: 15
escalate_wait_2: 30
escalate_wait_3: 45
```

- Paths can be absolute, or relative to the YAML file's directory.
- WAV and MP3 are both supported (decoded via rodio + symphonia).
- `loop_alert_timeout_millis` is the gap *between* consecutive plays of a
  single voice at stage 0. Omit to replay back-to-back.
- `loop_alert_timeout_millis_{1,2,3}` override the gap at each escalation
  stage. Each falls back to the previous stage when unset — so you can set
  just `_1: 200` to drop straight to a 200ms gap from voice 2 onward.
- `loop_alert_jitter_millis[_1|_2|_3]` add `+/- rand(0..=jitter)` to each
  sleep (clamped at 0). Same fallback chain as the timeouts. Useful to
  keep voices from re-aligning even when they share a gap. The *upcoming*
  stage's jitter is also applied to the escalation wait itself, so voices
  2/3/4 don't always land exactly on `escalate_wait_N` — their phase
  drifts by `+/- rand(0..=jitter)` ms.
- **Escalation**: a `/loop_*` request starts one voice immediately. At
  `escalate_wait_1` / `escalate_wait_2` / `escalate_wait_3` seconds, a
  second / third / fourth concurrent voice joins the mix. New voices are
  taken from `extra_alert_<state>_sounds` in order; when that pool is
  exhausted the supervisor cycles back through the full pool
  (primary + extras), so existing voices double up. Each voice runs in
  its own thread and drifts naturally relative to the others.
- All voices in a session share the *current* stage's gap, so existing
  voices also speed up when the supervisor advances stages.

## Claude Code wiring

The intended workflow:

- When Claude needs input → start a `loop_await` sound.
- When the user replies → `stop`.
- When Claude finishes a turn → start a `loop_done` sound (replacing
  `loop_await` if it was still playing); the next user prompt stops it.

### `~/.claude/agent_notify.sh`

This helper probes port 43110, spawns the server with `cargo run` if nothing
is listening (waiting up to 60s for it to come up), then curls the requested
endpoint. Drop it at `~/.claude/agent_notify.sh` and `chmod +x` it.

```bash
#!/bin/bash
# Usage: agent_notify.sh await | done | stop
set -u

PORT=43110
REPO="$HOME/dev/storyteller/artcraft"
LOGFILE="/tmp/agent-notify-server.log"

case "${1:-}" in
  await) endpoint="loop_await" ;;
  done)  endpoint="loop_done"  ;;
  stop)  endpoint="stop"       ;;
  *) echo "usage: $0 await|done|stop" >&2; exit 1 ;;
esac

probe() {
  curl -fsS -o /dev/null -m 0.5 "http://127.0.0.1:$PORT/" 2>/dev/null
}

if ! probe; then
  if [ ! -d "$REPO" ]; then
    echo "agent-notify-server: repo not found at $REPO" >&2
    exit 1
  fi
  (
    cd "$REPO" || exit 1
    nohup cargo run --bin agent-notify-server >>"$LOGFILE" 2>&1 &
    disown
  ) </dev/null >/dev/null 2>&1

  for _ in $(seq 1 120); do
    probe && break
    sleep 0.5
  done

  if ! probe; then
    echo "agent-notify-server: failed to start; see $LOGFILE" >&2
    exit 1
  fi
fi

curl -fsS -m 1 "http://127.0.0.1:$PORT/$endpoint" -o /dev/null
```

### `~/.claude/settings.json`

Merge these hooks into your existing `hooks` block. `async: true` ensures the
hook never blocks the UI while waiting for `cargo run` on the cold-start path.

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/agent_notify_on_notification.sh",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/agent_notify.sh done",
            "async": true
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/agent_notify.sh stop",
            "async": true
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "AskUserQuestion",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/agent_notify.sh stop",
            "async": true
          }
        ]
      }
    ]
  }
}
```

Why two stop hooks? `UserPromptSubmit` fires only for *typed* user messages, not
for `AskUserQuestion` option selections. The `PostToolUse` matcher on
`AskUserQuestion` covers that case — it fires when the tool call returns
(i.e., once you've answered), and the helper's `/stop` silences whatever
loop the `Notification` or `Stop` hook started.

Why the notification wrapper? The `Notification` hook fires for *every*
Claude Code notification — idle reminders, permission asks, background-agent
attention pings — not just "Claude needs your input". Crucially, the idle
reminder uses the *same* `message` text as a real input prompt
("Claude is waiting for your input"), so the only reliable discriminator
is the `notification_type` field.
`~/.claude/agent_notify_on_notification.sh` reads the hook payload, logs
every event to `/tmp/agent-notify-notifications.log` for audit, and
skips events with `notification_type == "idle_prompt"`. Everything else
(permission prompts, unknown future types) fires `/loop_await` — better
to ring the bell on an unknown attention prompt than miss a real one.

### Replacing the old bash-loop system

### Audit log

The Notification wrapper writes every received notification payload to
`/tmp/agent-notify-notifications.log`, tagged `FIRE` or `SKIP`. If the await
sound stops firing for a case you care about (or fires when it shouldn't),
inspect that log and adjust the `case` patterns in
`agent_notify_on_notification.sh`.

### Replacing the old bash-loop system

If you previously had `~/.claude/notify_loop.sh`, `notify_stop.sh`,
`stop_loop.sh`, `stop_stop.sh`, kill any survivors and remove them:

```sh
pkill -f claude_notify_loop_marker 2>/dev/null
pkill -f 'afplay.*smrpg' 2>/dev/null
rm -f ~/.claude/notify_loop.sh ~/.claude/notify_stop.sh \
      ~/.claude/stop_loop.sh   ~/.claude/stop_stop.sh \
      ~/.claude/notify_loop.pid ~/.claude/stop_loop.pid
```

## Shutdown

Ctrl+C exits cleanly in ~0.3s, even mid-playback. The server has
`shutdown_timeout(0)` and signals the audio engine to drop any in-flight
sound the moment SIGINT arrives — no zombie afplay processes.
