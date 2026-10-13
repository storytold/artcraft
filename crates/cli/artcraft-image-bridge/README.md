# ArtCraft image bridge

Import a selected local PNG or JPEG into ArtCraft from an MCP client. The bridge
can inspect the file, upload it with explicit permission, and look up its saved
import status. Image creation happens separately in the user's chosen application.

**Draft contribution.** Windows is the tested setup and live-credential platform.
This is a standalone stdio MCP server in an isolated Cargo workspace; integration
with ArtCraft's desktop workspace and broader MCP work remains a maintainer decision.

Start with the [user guide](USER-GUIDE.md), including an offline practice workflow,
live setup, expected results, and recovery. The repository's MIT/Apache-2.0 licenses
apply to this contribution.

## Tools

- `artcraft_inspect_local_image`: decode an approved local image and report its
  dimensions, format, byte size, alpha flag, and SHA-256. No network request.
- `artcraft_import_local_image`: disabled in default inspection mode; copies
  locally in mock mode; explicitly uploads in live mode. Requires the inspected
  hash and a stable request ID. Live imports also require direct-link acceptance.
- `artcraft_get_import`: read persisted status. It is not a new remote integrity
  or privacy check.

## Design and limits

Files must be inside an explicitly selected root, with state and credentials
outside it. PNG/JPEG only; maximum 20 MiB encoded size and 40 million pixels;
decoder memory is bounded. Resolved paths and opened-file identity are checked.
Windows network/device paths and alternate data streams are rejected. The root
must be controlled by the same trusted local user; this is not an OS sandbox.

A short cross-process lock protects state transactions. Multiple clients can
connect concurrently. Before an upload, a durable claim records its request ID.
An interrupted or uncertain attempt will not be automatically uploaded again.
These protections depend on retaining the original state directory; they are not
a service-wide exactly-once guarantee. There is no reset/reconciliation tool yet.

Live credentials are explicitly supplied Windows DPAPI files and are loaded only
for live calls. Missing or unreadable credentials do not prevent local tools from
working. Helper execution has a timeout. The HTTP client uses a fixed ArtCraft
service host, no redirects, no automatic retries, and no proxy discovery.

**Private metadata did not prevent anonymous direct-link downloads in the tested
service.** Use shareable artwork and disclose that limitation before upload.
Metadata verification does not compare downloaded image bytes.

The bridge makes no image-generation calls, accesses no OpenAI credentials, and
does not implement subscription sign-in or establish subscription entitlements.

## Developer checks

From the repository root on Windows, with Rust and MSVC build tools available:

```powershell
.\build-image-bridge.ps1 -Action test
.\build-image-bridge.ps1 -Action clippy
.\build-image-bridge.ps1 -Action build
python test-project-setup.py
.\setup-bridge-key.ps1 -SelfTest
```

Python helpers require Python 3.11 or newer. Automated tests use local files,
mock state, loopback HTTP fixtures, and synthetic credentials. They do not upload
artwork or call a model. Loopback tests exercise the upload contract separately
from the fixed-host production HTTP client. Windows-specific tests cover DPAPI
and credential failure. Other platforms have not been validated for this draft.

Manual assessment of the prototype included PNG/JPEG imports on a zero-credit
account, independently byte-matched originals, a conversational Codex import,
and opening an imported JPEG in ArtCraft's editing canvas. These are point-in-time
observations, not service guarantees. The latest credential-resilience changes
were checked offline rather than by repeating those live uploads.

## Attribution

Contributed by **Emile du Toit, BrainIT Consulting**, with Codex-assisted
implementation and testing. Emile directed the assessment, workflow design,
and hands-on validation. Existing ArtCraft authorship and licenses are retained.
