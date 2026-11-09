# ArtCraft MCP — Python CLI Tools

All scripts talk to the `artcraft-mcp` binary over stdio JSON-RPC through
the shared client `artcraft_mcp_client.py`. They locate the binary via
`ARTCRAFT_MCP_PATH`, packaged `bin/`, cargo `target/{release,debug}`, or PATH.

Paid actions and local file uploads are confirmed by running the script —
the client sends `confirm: true` on your behalf.

Every script accepts `-h/--help`. Run from any cwd with `PYTHONUTF8=1`.

---

## artcraft_healthcheck.py — diagnostics

Verifies binary discovery, protocol handshake, credential presence, tools
list, and live API calls (credits + cost estimate).

```bash
PYTHONUTF8=1 python artcraft_healthcheck.py
```

Prints `[PASS]`/`[FAIL]`/`[WARN]` per check; **exits non-zero on any
failure** (safe for CI smoke tests).

---

## artcraft_cost_estimator.py — credits & estimates (read-only)

```bash
PYTHONUTF8=1 python artcraft_cost_estimator.py \
  --image-model flux_1_dev --count 2 \
  --video-model seedance_2p0 --duration 8 \
  --aspect-ratio wide_16_9
```

| Flag            | Default       | Notes                          |
|-----------------|---------------|--------------------------------|
| `--image-model` | `flux_1_dev`  | Any image model id             |
| `--count`       | `1`           | Image batch count (1-8)        |
| `--video-model` | `seedance_2p0`| Any video model id             |
| `--duration`    | `5`           | Seconds (1-600)                |
| `--aspect-ratio`| `wide_16_9`   | e.g. `tall_9_16`, `square`     |

Also prints credit balance and active subscription.

---

## artcraft_runner.py — batch video/image generation (paid)

```bash
PYTHONUTF8=1 python artcraft_runner.py \
  --image keyframe.png \
  --prompt "Slow dolly through a neon market" \
  --model seedance_2p0 --copies 2 --duration 5 \
  --out-dir ~/ArtCraft/downloads
```

| Flag          | Default               | Notes                              |
|---------------|-----------------------|------------------------------------|
| `--image`     | —                     | Optional start-frame upload        |
| `--prompt`    | required              | Video prompt                       |
| `--model`     | `seedance_2p0`        | Video model id                     |
| `--copies`    | `1`                   | Number of enqueued jobs            |
| `--duration`  | `5`                   | Seconds (1-600)                    |
| `--out-dir`   | `~/ArtCraft/downloads`| Must be inside an allowed dir      |
| `--timeout`   | `900`                 | Overall wait cap (seconds)         |

Polls `artcraft_get_job_status` per job and downloads each `m_` result.

---

## artcraft_3d_runner.py — mesh & splat (paid)

```bash
PYTHONUTF8=1 python artcraft_3d_runner.py \
  --image character.png --mode both --version 3 --splat-version 1.1 \
  --out-dir ~/ArtCraft/3D_Assets
```

| Flag              | Default             | Notes                                   |
|-------------------|---------------------|-----------------------------------------|
| `--image`         | —                   | Reference image (needed for mesh i2i)   |
| `--mode`          | `both`              | `object` | `splat` | `both`          |
| `--prompt`        | —                   | Text prompt (mesh t2i3d or splat)       |
| `--version`       | `3`                 | Mesh: `2.0` `2.1` `3` `3.1` (or model id)|
| `--splat-version` | `1.1`               | Splat: `mini` `plus` `1.0` `1.1` (or id)|
| `--out-dir`       | `~/ArtCraft/3D_Assets` (`ARTCRAFT_3D_OUT`) |                  |
| `--timeout`       | `900`               | Seconds                                 |

---

## artcraft_angle_matrix.py — camera orbit matrix (paid)

Uploads a source image and enqueues 4 angle-shift edits
(`artcraft_edit_image_angle`): ±30° orbits, +20° pitch, 1.4× zoom.

```bash
PYTHONUTF8=1 python artcraft_angle_matrix.py \
  --image subject.png --out-dir ~/ArtCraft/angle_matrix
```

| Flag        | Default                    | Notes                       |
|-------------|----------------------------|-----------------------------|
| `--image`   | required                   | Source reference image      |
| `--out-dir` | `~/ArtCraft/angle_matrix`  | Downloads `<preset>_<m_token>.png` |
| `--timeout` | `600`                      | Seconds                     |

---

## artcraft_audio_weaver.py — music & SFX (paid)

```bash
PYTHONUTF8=1 python artcraft_audio_weaver.py \
  --prompt "Rainy lo-fi, vinyl crackle" --style "lofi,ambient" \
  --bpm 85 --instrumental --out-dir ~/ArtCraft/audio
```

| Flag             | Default       | Notes                                     |
|------------------|---------------|-------------------------------------------|
| `--prompt`       | required      | Audio description or lyrics               |
| `--model`        | `suno_music`  | `suno_remix` `suno_sounds` `suno_sample` `seed_audio_1p0` |
| `--style`        | —             | Genre/style tags                          |
| `--audio-ref`    | —             | Local audio file for remix/reference      |
| `--instrumental` | off           | No vocals                                 |
| `--bpm`          | —             | 30-300                                    |
| `--out-dir`      | `~/ArtCraft/audio` |                                       |
| `--timeout`      | `600`         | Seconds                                   |

---

## artcraft_mcp_client.py — shared client (library)

Import it for custom automation:

```python
from artcraft_mcp_client import McpClient, extract_token

with McpClient() as client:
    token = client.upload("cover.png", kind="image")          # confirm sent
    text  = client.call_text("artcraft_generate_image",
                             {"model": "flux_1_dev", "prompt": "a fox"},
                             confirm=True, idempotency_token="run-001")
    job   = extract_token("job", text)
    client.wait_for_jobs([job])
```

Useful helpers: `call_tool` / `call_text` (raise `McpError` on JSON-RPC and
`isError` failures), `wait_for_jobs` (terminal-state polling),
`extract_token` (`media`/`job`/`prompt`), `download` (returns saved path),
`send_request` (raw JSON-RPC).

## test_artcraft_mcp_client.py — integration tests

```bash
PYTHONUTF8=1 python test_artcraft_mcp_client.py
```

Spawns the real binary: handshake, tools/list surface, schema shape,
confirm gate, error paths, missing-arguments default, stderr drain, and
schemas/*.json parity. Skips cleanly when no binary is present.
