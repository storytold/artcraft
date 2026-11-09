#!/usr/bin/env python3
"""Regenerate schemas/*.json from the artcraft-mcp server's live tools/list.

These files are generated artifacts of the Rust tool definitions in
crates/cli/artcraft-mcp/src/tools/. Do not edit them by hand — change the
Rust input_schema instead and re-run this script:

    PYTHONUTF8=1 python generate_schemas.py

Requires a built binary (cargo build -p artcraft-mcp) or ARTCRAFT_MCP_PATH.
Files for tools that no longer exist are removed.
"""

import json
import os
import sys

TOOLS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools")
sys.path.insert(0, os.path.abspath(TOOLS_DIR))

from artcraft_mcp_client import McpClient, McpError, find_mcp_executable


def main():
    schema_dir = os.path.dirname(os.path.abspath(__file__))
    client = McpClient(client_name="artcraft-schema-generator")

    try:
        res = client.send_request("tools/list", {})
        tools = res["result"]["tools"]
    finally:
        client.close()

    names = set()
    written = 0
    for tool in tools:
        name = tool["name"]
        names.add(name)
        doc = {
            "name": name,
            "description": tool.get("description", ""),
            "inputSchema": tool.get("inputSchema", {"type": "object", "properties": {}}),
        }
        path = os.path.join(schema_dir, f"{name}.json")
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(doc, f, indent=2, ensure_ascii=False)
            f.write("\n")
        written += 1

    removed = 0
    for fname in os.listdir(schema_dir):
        if fname.endswith(".json") and fname[:-5] not in names:
            os.remove(os.path.join(schema_dir, fname))
            print(f"removed stale schema: {fname}")
            removed += 1

    print(f"wrote {written} schemas, removed {removed} stale files")


if __name__ == "__main__":
    if not find_mcp_executable():
        print("artcraft-mcp binary not found; build it first (cargo build -p artcraft-mcp)", file=sys.stderr)
        sys.exit(1)
    try:
        main()
    except McpError as e:
        print(f"schema generation failed: {e}", file=sys.stderr)
        sys.exit(1)
