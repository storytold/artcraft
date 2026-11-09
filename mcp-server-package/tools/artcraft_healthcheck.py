#!/usr/bin/env python3
"""ArtCraft MCP health check.

Verifies binary discovery, MCP protocol handshake, tool discovery, and live
API connectivity (credits + cost estimate). Prints PASS/FAIL per check and
exits non-zero if any check fails."""

import sys
from pathlib import Path

from artcraft_mcp_client import McpClient, McpError, find_mcp_executable


def main():
    print("=" * 65)
    print("   ArtCraft MCP Diagnostic & Health Check Suite")
    print("=" * 65)

    failures = []

    bin_path = find_mcp_executable()
    if not bin_path:
        print("[FAIL] artcraft-mcp binary not found.")
        print("       Build it: cargo build --release -p artcraft-mcp (from repo root)")
        print("       Or set ARTCRAFT_MCP_PATH to the binary.")
        sys.exit(1)
    print(f"[PASS] Found MCP Server Binary: {bin_path}")

    creds_dir = Path.home() / "Artcraft" / "credentials"
    if (creds_dir / "artcraft_session.txt").exists() or (creds_dir / "artcraft_avt.txt").exists():
        print(f"[PASS] Credential files present under {creds_dir}")
    else:
        print("[WARN] No credential files found; authenticated tools may fail.")
        print(f"       (expected under {creds_dir}; cookie-store fallback may still work)")

    try:
        client = McpClient(bin_path, client_name="artcraft-healthcheck")
    except McpError as e:
        print(f"[FAIL] initialize: {e}")
        sys.exit(1)

    info = client.server_info
    print(f"[PASS] MCP Protocol Connected: {info.get('name')} v{info.get('version')}")

    try:
        res = client.send_request("tools/list", {})
        tools = res.get("result", {}).get("tools", [])
        if tools:
            print(f"[PASS] Tools Discovery: {len(tools)} tools registered.")
        else:
            failures.append("tools/list returned no tools")
            print("[FAIL] tools/list returned no tools")
    except McpError as e:
        failures.append(f"tools/list: {e}")
        print(f"[FAIL] tools/list: {e}")

    try:
        text = client.call_text("artcraft_get_credits")
        print(f"[PASS] Account Authentication: {text.splitlines()[0] if text else '(empty)'}")
    except McpError as e:
        failures.append(f"artcraft_get_credits: {e}")
        print(f"[FAIL] Account check: {e}")

    try:
        text = client.call_text(
            "artcraft_estimate_cost",
            {"media_type": "image", "model": "flux_1_dev"},
        )
        first = text.splitlines()[0] if text else "(empty)"
        print(f"[PASS] API Cost Estimator: {first}")
    except McpError as e:
        failures.append(f"artcraft_estimate_cost: {e}")
        print(f"[FAIL] Cost estimation: {e}")

    client.close()

    print("\n" + "=" * 65)
    if failures:
        print(f"   [-] {len(failures)} diagnostic check(s) FAILED")
        print("=" * 65)
        sys.exit(1)
    print("   [+] All diagnostic checks PASSED")
    print("=" * 65)


if __name__ == "__main__":
    main()
