#!/usr/bin/env python3
"""Shared JSON-RPC client for the artcraft-mcp stdio server.

All tool scripts in this directory use this module. It handles binary
discovery, MCP initialize/initialized handshake, JSON-RPC error and
result.isError propagation, stderr draining (the server logs there; an
unread PIPE can deadlock), token extraction, and job polling helpers.

Important: tool calls that spend credits, delete data, or read local files
require arguments.confirm = true. The wrapper scripts pass confirm on your
behalf — running one of these scripts IS the confirmation.
"""

import json
import os
import re
import subprocess
import sys
import threading
import time
from collections import deque
from pathlib import Path

PROTOCOL_VERSION = "2024-11-05"
CLIENT_VERSION = "1.0.0"

# Terminal job statuses on the backend (non-terminal: pending, started,
# attempt_failed — the job retries after an attempt failure).
SUCCESS_STATES = {"complete_success"}
FAILURE_STATES = {
    "complete_failure",
    "dead",
    "cancelled_by_user",
    "cancelled_by_system",
}

# Token prefixes come from crates/schema/public/tokens/src/prefixes.rs.
TOKEN_PATTERNS = {
    "media": re.compile(r"m_[a-zA-Z0-9_-]+"),
    "job": re.compile(r"jinf_[a-zA-Z0-9_-]+"),
    "prompt": re.compile(r"prompt_[a-zA-Z0-9_-]+"),
}

STDERR_TAIL_LINES = 200


class McpError(RuntimeError):
    """A JSON-RPC error, a failed tool call, or a dead server process."""


def find_mcp_executable():
    """Locate the artcraft-mcp binary.

    Order: ARTCRAFT_MCP_PATH env, packaged bin/ locations, the cargo build
    output under the repo root (tools/ -> mcp-server-package/ -> repo/), PATH.
    """
    env_path = os.environ.get("ARTCRAFT_MCP_PATH")
    if env_path and os.path.exists(env_path):
        return os.path.abspath(env_path)

    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent
    names = ("artcraft-mcp.exe", "artcraft-mcp")
    candidates = []
    for name in names:
        candidates += [
            script_dir.parent / "bin" / name,
            script_dir.parent / name,
            script_dir / name,
            repo_root / "target" / "release" / name,
            repo_root / "target" / "debug" / name,
        ]
    for c in candidates:
        if c.exists():
            return str(c)

    for name in names:
        found = shutil_which(name)
        if found:
            return found
    return None


def shutil_which(name):
    """shutil.which without importing shutil at module top (kept small)."""
    for d in os.environ.get("PATH", "").split(os.pathsep):
        p = Path(d) / name
        if p.exists() and os.access(p, os.X_OK):
            return str(p)
    return None


class McpClient:
    """One stdio JSON-RPC session with an artcraft-mcp process."""

    def __init__(self, exe_path=None, client_name="artcraft-python-tools", quiet=True):
        """Spawn the server, start stderr draining, and run the initialize handshake."""
        self.exe_path = exe_path or find_mcp_executable()
        if not self.exe_path:
            raise FileNotFoundError(
                "artcraft-mcp binary not found. Build it with "
                "`cargo build --release -p artcraft-mcp` from the repo root, "
                "or set ARTCRAFT_MCP_PATH."
            )

        # stderr is drained by a background thread so server logging can never
        # fill the pipe and deadlock the stdio protocol.
        self.proc = subprocess.Popen(
            [self.exe_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        self.stderr_tail = deque(maxlen=STDERR_TAIL_LINES)
        self._stderr_quiet = quiet
        self._stderr_thread = threading.Thread(target=self._drain_stderr, daemon=True)
        self._stderr_thread.start()

        self.req_id = 1
        self._initialize(client_name)

    def _drain_stderr(self):
        """Consume server stderr on a thread so the pipe can never fill and deadlock."""
        try:
            for line in self.proc.stderr:
                line = line.rstrip("\n")
                self.stderr_tail.append(line)
                if not self._stderr_quiet:
                    print(line, file=sys.stderr)
        except (OSError, ValueError):
            pass

    def stderr_text(self):
        """Return the captured stderr tail (up to STDERR_TAIL_LINES) for error context."""
        return "\n".join(self.stderr_tail)

    def send_request(self, method, params=None):
        """Write one JSON-RPC request and read its response; raises McpError on transport failure."""
        msg = {"jsonrpc": "2.0", "id": self.req_id, "method": method}
        if params is not None:
            msg["params"] = params
        self.req_id += 1
        try:
            self.proc.stdin.write(json.dumps(msg) + "\n")
            self.proc.stdin.flush()
            line = self.proc.stdout.readline()
        except (BrokenPipeError, OSError) as e:
            raise McpError(f"MCP transport failed: {e}\nserver stderr:\n{self.stderr_text()}")
        if not line:
            raise McpError(
                f"MCP server closed stdout (crashed?).\nserver stderr:\n{self.stderr_text()}"
            )
        try:
            res = json.loads(line.strip())
        except json.JSONDecodeError:
            raise McpError(f"Invalid JSON-RPC response: {line.strip()[:200]}")
        return res

    def _initialize(self, client_name):
        """Perform the MCP initialize/initialized handshake and record serverInfo."""
        res = self.send_request(
            "initialize",
            {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": {"name": client_name, "version": CLIENT_VERSION},
            },
        )
        if "error" in res:
            raise McpError(f"initialize failed: {res['error']}")
        self.proc.stdin.write(
            json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n"
        )
        self.proc.stdin.flush()
        self.server_info = res.get("result", {}).get("serverInfo", {})

    def call_tool(self, name, arguments=None, confirm=False, idempotency_token=None):
        """Call an artcraft_* tool. Returns the result object; raises McpError
        on JSON-RPC errors and result.isError tool failures."""
        args = dict(arguments or {})
        if confirm:
            args["confirm"] = True
        if idempotency_token:
            args["idempotency_token"] = idempotency_token

        res = self.send_request("tools/call", {"name": name, "arguments": args})
        if "error" in res:
            raise McpError(f"{name} JSON-RPC error: {res['error']}")
        result = res.get("result", {})
        if result.get("isError"):
            raise McpError(f"{name} failed: {result_text(result)}")
        return result

    def call_text(self, name, arguments=None, **kwargs):
        """call_tool + flatten the result's text content into one string."""
        return result_text(self.call_tool(name, arguments, **kwargs))

    # ---- convenience helpers -------------------------------------------------

    def upload(self, file_path, kind="image"):
        """Upload a local file. kind: image|video|audio. Returns media token."""
        tool = {
            "image": "artcraft_upload_image",
            "video": "artcraft_upload_video",
            "audio": "artcraft_upload_audio",
        }[kind]
        text = self.call_text(tool, {"file_path": str(file_path)}, confirm=True)
        return extract_token("media", text)

    def get_job_status_text(self, job_token):
        """Fetch one job's status text via artcraft_get_job_status."""
        return self.call_text("artcraft_get_job_status", {"job_token": job_token})

    def download(self, media_token, download_dir=None, filename=None):
        """Download a media token via artcraft_download_media_file; return the saved path."""
        args = {"media_token": media_token}
        if download_dir:
            args["download_dir"] = str(download_dir)
        if filename:
            args["filename"] = filename
        text = self.call_text("artcraft_download_media_file", args)
        m = re.search(r"Saved to:\s*(.+)", text)
        return m.group(1).strip() if m else text

    def wait_for_jobs(self, job_tokens, timeout_s=600, interval_s=5, on_event=None):
        """Poll each job until a terminal state. Returns {token: status}.

        on_event(token, state, text) is invoked when a job reaches a terminal
        state. Uses the single-job endpoint; one request per outstanding job
        per round.

        A McpError raised while polling a job (transport failure or a tool
        error such as an invalid token) is treated as terminal for that job:
        it is recorded as "complete_failure", reported via on_event with
        state "error", and not retried. Jobs still pending at timeout_s are
        recorded as "timeout"."""
        deadline = time.time() + timeout_s
        pending = set(job_tokens)
        final = {}
        while pending and time.time() < deadline:
            for token in sorted(pending):
                try:
                    text = self.get_job_status_text(token)
                except McpError as e:
                    final[token] = "complete_failure"
                    pending.discard(token)
                    if on_event:
                        on_event(token, "error", str(e))
                    continue
                state = parse_status_line(text)
                if state in SUCCESS_STATES or state in FAILURE_STATES:
                    final[token] = state
                    pending.discard(token)
                    if on_event:
                        on_event(token, state, text)
            if pending:
                time.sleep(interval_s)
        for token in pending:
            final[token] = "timeout"
        return final

    def close(self):
        """Close all pipes and terminate the server process (kill on timeout)."""
        for stream in (self.proc.stdin, self.proc.stdout, self.proc.stderr):
            try:
                if stream:
                    stream.close()
            except OSError:
                pass
        try:
            self.proc.terminate()
            self.proc.wait(timeout=3)
        except (OSError, subprocess.TimeoutExpired):
            self.proc.kill()

    def __enter__(self):
        """Context-manager entry: returns self."""
        return self

    def __exit__(self, *exc):
        """Context-manager exit: close the server process."""
        self.close()


def result_text(result):
    """Concatenate the text content of a tool result."""
    parts = [c.get("text", "") for c in result.get("content", []) if c.get("type") == "text"]
    return "\n".join(parts)


def extract_token(kind, text):
    """Return the first token of the given kind (media|job|prompt) found in text, or None."""
    m = TOKEN_PATTERNS[kind].search(text)
    return m.group(0) if m else None


def extract_all_tokens(kind, text):
    """Return every token of the given kind (media|job|prompt) found in text."""
    return TOKEN_PATTERNS[kind].findall(text)


def parse_status_line(job_status_text):
    """Extract the Status: field value from artcraft_get_job_status output."""
    m = re.search(r"^Status:\s*(\S+)", job_status_text, re.MULTILINE)
    return m.group(1) if m else "unknown"


def require_success(result_or_text):
    """True when the parsed text does not describe a tool failure."""
    text = result_or_text if isinstance(result_or_text, str) else result_text(result_or_text)
    return "error" not in text.lower()[:50]
