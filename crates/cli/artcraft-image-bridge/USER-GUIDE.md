# Using the ArtCraft image bridge

This guide takes you from inspecting a file to importing it into your ArtCraft
library. It is written for the Windows prototype contributed by **Emile du Toit,
BrainIT Consulting**, with Codex-assisted implementation and testing.

The bridge imports an image you already have. Generate or edit the image in your
usual application first, then save the finished PNG or JPEG locally. Generation
charges and subscription permissions belong to that application; the bridge
does not provide image generation or convert a subscription into API access.

## 1. What you need

- Windows, PowerShell, Git, Rust installed through rustup, and the MSVC C++ build
  tools. A Rust toolchain must already be active for this checkout. The build
  helper expects Cargo at `%USERPROFILE%\.cargo\bin\cargo.exe`.
- A checkout containing this contribution and a Codex client that supports
  project-local MCP settings, or another stdio MCP client you configure manually.
- Python 3.11 or newer for the optional verification scripts.
- A small, shareable PNG or JPEG. The maximum is 20 MiB and 40 million pixels.
- For live import only: your own ArtCraft account and ArtCraft API key. Offline
  inspection and mock imports do not need an account or key.

The assessment imported images on a free, zero-credit account without a purchase.
Do not buy a plan just to follow this guide. Account permissions and service terms
can change; if ArtCraft requires an upgrade, stop and review that requirement.

**Use artwork you are comfortable sharing by link.** The bridge requests private
metadata, but testing found that someone with the asset link could download it
without signing in. A private label is not a guarantee of confidential storage.

## 2. Build and connect in inspection mode

Open PowerShell in the repository folder. All following relative paths start there.

```powershell
.\build-image-bridge.ps1 -Action build
.\setup-project-mcp.ps1
```

The first command builds the bridge. The second installs an inspection-only
connection in this checkout's `.codex/config.toml`. It creates the selected-image
folder `.build/approved-images`, saves state under `.build`, and copies the runtime
to a versioned location. It preserves other project entries and backs up changes.
It does not edit user-level Codex settings or grant project trust.

Copy one image into `.build/approved-images`. In this guide, call the copy
`sample.jpg` (use `sample.png` for PNG). Copy only the files you want the bridge
to read. Do not put keys, client-confidential work, or unrelated documents there.

Start a fresh Codex session **in this repository folder**. Review the normal
project-trust prompt if one appears. Run `/mcp`; expect
`artcraft_image_bridge` to be connected with **four tools**.

Optional independent check from PowerShell:

```powershell
python verify-project-mcp.py
python verify-project-mcp.py --image .build/approved-images/sample.jpg
```

The first checks discovery. The second also inspects the file and compares its
reported local size/hash. Neither uploads a file or calls a model.

In Codex, ask for inspection of the absolute path to your selected image. State
that this step is inspection only. Expect dimensions, format, byte size, alpha
information, and a SHA-256 hash. Inspection does not create an ArtCraft asset.

## 3. Optional offline practice

```powershell
.\setup-project-mcp.ps1 -Mode Mock
```

Start a fresh Codex session so it loads the changed connection. Ask it to inspect
the selected file, choose one UUID request ID, check that ID, and perform a mock
import with the inspected hash. Keep the ID to check the result again.

Mock mode copies files into local state and does not contact ArtCraft. It uses
`.build/codex-mock-state`, separate from the live state. An image will not appear
in the ArtCraft library after this practice step.

## 4. Save your ArtCraft key and enable live imports

Sign in to ArtCraft yourself and use the account's API Keys section to create a
key for this bridge. The key may be shown only once. Keep it out of chats,
screenshots, source files, command arguments, and MCP configuration.

Run this in your own interactive PowerShell window:

```powershell
.\setup-bridge-key.ps1
```

Paste the key into the hidden-input prompt, then press Enter. Wait for the
encrypted-save confirmation. Empty/invalid input is rejected. The saved file is
`.build/credentials/artcraft-api-key.dpapi`, encrypted for your Windows account.
Do not commit or share it. The bridge needs that account to decrypt it.

```powershell
.\setup-project-mcp.ps1 -Mode Live
```

Start a fresh Codex session in the checkout and recheck `/mcp`. Four connected
tools means discovery works; it does not prove the key is valid. The bridge
checks the key when you request a live import.

## 5. Perform one deliberate import

Use this sequence with your MCP client:

1. Identify the absolute path of the selected image and inspect it.
2. Create one UUID request ID for this intended upload. Record it. Check its saved
   status before importing. Use the inspected SHA-256 as `expected_sha256`.
3. Explicitly authorize remote storage in your ArtCraft account and acknowledge
   that anyone holding a direct asset link may download it. For a live call,
   `accept_remote_link_access` must be `true`.
4. Call `artcraft_import_local_image` once with that path, hash, request ID, and
   acceptance. Then call `artcraft_get_import` with the same request ID.
5. Keep the returned status and media token. Open your ArtCraft library yourself
   to confirm the asset visually; optionally open it in the editing canvas.

Do not create a new ID simply because the first call was interrupted or returned
an error. A repeated ID with different content or backend is rejected. Reusing
the same ID and state prevents another upload for that recorded attempt.

A successful live result is
`uploaded_metadata_verified_link_access_not_private`. This means the upload
returned an asset token and the service returned matching token/class/visibility
metadata. It does **not** mean a remote byte comparison, a visual check, or a
privacy test was performed. `artcraft_get_import` reads the last saved result;
it does not refresh the remote asset.

## 6. If something goes wrong

Ask `artcraft_explain_import_recovery` about the request ID saved from your import.
It returns the retained record, an explanation, and suggested next checks without
contacting ArtCraft, decrypting credentials, uploading, or changing state. It
works for live records even when the original local image is no longer available.
Mock reports check the saved local copy's bytes. Malformed records or corrupt
mock copies produce an error and remain untouched.

Use a known request ID: existing records have no timestamp and this tool does
not guess which import was last. A report is a snapshot; another client may
change state after it is read. Missing or unfamiliar records do not establish
that an upload failed or authorize a fresh upload.

- **Not connected or zero tools:** confirm the session is in the correct checkout,
  review the client startup warning, and check project trust. Run the independent
  discovery script. If it works, restart the project session to load its current
  configuration. Do not change unrelated MCP servers or global settings.
- **Import disabled:** the default mode is inspection only. Use mock for offline
  practice or deliberately configure live mode after saving your own key.
- **File refused:** ensure the absolute path resolves inside the selected-image
  folder, the file is a valid PNG/JPEG within limits, and the hash comes from a
  fresh inspection. Renaming an unsupported file does not convert its format.
- **Local key error before an attempt is recorded:** repair or replace your key,
  then use the same request ID. Local inspection and saved-status lookup still
  work. Replace a saved key explicitly with `setup-bridge-key.ps1 -Replace`.
- **`upload_outcome_unknown`:** preserve the state and request ID. A timeout,
  crash, HTTP failure, or cancellation may leave this status. Check your ArtCraft
  library and reconcile with the service before taking any further upload action.
  There is no automatic reset/retry tool. A missing library result is not proof
  that the upload never happened.
- **`uploaded_metadata_pending`:** a token was saved, but verification did not
  complete. Repeating the exact same request can repeat metadata verification
  without another upload. Keep the original image and state available.

A null saved record is meaningful only in the original, intact state directory.
Deleting state, changing it, or using another checkout loses this duplicate-upload
protection. Do not use those actions to get past an uncertain outcome. Deleting
local records also does not delete remotely uploaded artwork.

## 7. Updating, disconnecting, and keeping records

To install an updated build, repeat the build command and setup with your chosen
mode, then start a fresh client session. Existing sessions keep their old runtime
copy until restarted. State and keys are retained; old runtimes are not deleted.

To disconnect, close the relevant client session and remove only the marked
ArtCraft image bridge section from this checkout's `.codex/config.toml`. Preserve
other settings. Keep `.build/codex-mcp-state` while imports need reconciliation.
Revoke the ArtCraft key in your account if retiring it; deleting a local encrypted
file alone does not revoke the remote key. No automated uninstaller is provided.

Local configuration, selected images, credentials, state, and build output are
ignored by Git. Treat state as private: it can contain file paths, hashes, and
asset tokens. Keep backups private and retain the original state for recovery.

## Other MCP clients

Configure the built binary as a stdio server with absolute arguments:

```text
artcraft-image-bridge <image-root> <state-directory>
artcraft-image-bridge <image-root> <state-directory> --mock
artcraft-image-bridge <image-root> <state-directory> --live-key <dpapi-file>
```

This is a protocol server, not an interactive command prompt. The state directory
and credential must be outside the image root. Windows DPAPI is the only live-key
bootstrap implemented in this draft. Other clients and operating systems require
their own validation; do not assume this assessment establishes their support.
