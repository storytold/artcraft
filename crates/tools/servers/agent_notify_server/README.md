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

Mixing rules:

- One-shots mix with whichever loop is playing.
- Requesting a new loop replaces the prior loop.
- `/stop` halts everything.
- A missing config key makes the corresponding endpoint return `404`.

## Config

`config/notify_config.yaml`:

```yaml
alert_beep_sound: test_beep.wav
alert_done_sound: smrpg_flower.wav
alert_await_user_input_sound: smrpg_ghost.wav
loop_alert_timeout_millis: 2000
```

- Paths can be absolute, or relative to the YAML file's directory.
- `loop_alert_timeout_millis` is the gap *between* consecutive plays of a
  looping sound (after one play ends, before the next begins). Omit to replay
  back-to-back.
- WAV and MP3 are both supported (decoded via rodio + symphonia).

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
            "command": "bash ~/.claude/agent_notify.sh await",
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
    ]
  }
}
```

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
