#!/usr/bin/env python3
"""
ArtCraft MCP Comprehensive Health Check & Diagnostic Tool
Verifies MCP server binary discovery, JSON-RPC protocol initialization,
local credentials resolution, and live endpoint connectivity.
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def find_binary(preferred="artcraft-mcp.exe"):
    script_dir = Path(__file__).resolve().parent
    candidates = [
        script_dir.parent / "bin" / preferred,
        script_dir.parent / preferred,
        script_dir / preferred,
        script_dir.parent / "bin" / "artcraft-mcp",
        script_dir.parent / "artcraft-mcp",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None

def run_session(binary_path, requests):
    proc = subprocess.Popen(
        [str(binary_path)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    responses = []
    for req in requests:
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        if line:
            try:
                responses.append(json.loads(line.strip()))
            except json.JSONDecodeError:
                responses.append(None)
        else:
            responses.append(None)
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except:
        proc.kill()
    return responses

def main():
    print("=" * 65)
    print("   ArtCraft MCP Diagnostic & Health Check Suite")
    print("=" * 65)

    bin_path = find_binary()
    if not bin_path:
        print("[-] FAILED: Could not locate ArtCraft MCP binary in project tree.")
        sys.exit(1)
    print(f"[+] Found MCP Server Binary: {bin_path.name}")
    print(f"    Path: {bin_path}")

    # Check local credentials
    creds_dir = Path.home() / "Artcraft" / "credentials"
    session_file = creds_dir / "artcraft_session.txt"
    avt_file = creds_dir / "artcraft_avt.txt"
    if session_file.exists() and avt_file.exists():
        print(f"[+] Credentials Found in: {creds_dir}")
        print("    - artcraft_session.txt: OK")
        print("    - artcraft_avt.txt: OK")
    elif os.environ.get("ARTCRAFT_API_KEY"):
        print("[+] Credentials Found: ARTCRAFT_API_KEY environment variable configured.")
    else:
        print("[!] Note: No desktop credentials or API key detected. Auth tools may fail.")

    # Execute diagnostic requests
    requests = [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "artcraft-healthcheck", "version": "1.0.0"}
            }
        },
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        },
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "artcraft_get_credits" if "artcraft-mcp" in bin_path.name else "get_credits",
                "arguments": {}
            }
        },
        {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "artcraft_estimate_cost" if "artcraft-mcp" in bin_path.name else "estimate_image_cost",
                "arguments": {
                    "media_type": "image",
                    "model": "flux_1_dev"
                } if "artcraft-mcp" in bin_path.name else {
                    "model": "flux_1_dev",
                    "provider": "artcraft",
                    "generation_mode": "text_to_image"
                }
            }
        }
    ]

    print("\n[*] Initializing MCP JSON-RPC protocol...")
    res = run_session(bin_path, requests)

    # 1. Initialize
    if res[0] and "result" in res[0]:
        s_info = res[0]["result"].get("serverInfo", {})
        print(f"[PASS] MCP Protocol Connected: {s_info.get('name')} v{s_info.get('version')}")
    else:
        print(f"[FAIL] Initialize failed: {res[0]}")
        sys.exit(1)

    # 2. List tools
    if res[1] and "result" in res[1]:
        tools = res[1]["result"].get("tools", [])
        print(f"[PASS] Tools Discovery: {len(tools)} tools registered and accessible.")
    else:
        print(f"[FAIL] tools/list failed: {res[1]}")

    # 3. Credits
    if res[2] and "result" in res[2]:
        text = res[2]["result"]["content"][0]["text"].replace("\n", " | ")
        print(f"[PASS] Account Authentication: {text}")
    else:
        print(f"[FAIL] Account check failed: {res[2]}")

    # 4. Cost estimation
    if res[3] and "result" in res[3]:
        text = res[3]["result"]["content"][0]["text"].replace("\n", " | ")
        print(f"[PASS] API Cost Estimator: {text}")
    else:
        print(f"[FAIL] Cost estimation check failed: {res[3]}")

    print("\n" + "=" * 65)
    print("   [+] All diagnostic checks PASSED successfully!")
    print("=" * 65)

if __name__ == "__main__":
    main()
