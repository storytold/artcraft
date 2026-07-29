#!/usr/bin/env python3
"""
ArtCraft MCP One-Click Installer & Configurator
Auto-detects installed MCP clients (Windsurf, Claude Desktop, Cursor) and registers artcraft-mcp.
"""

import os
import sys
import json
import argparse

def find_mcp_binary():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, "artcraft-mcp-server.exe"),
        os.path.join(script_dir, "artcraft-mcp.exe"),
        os.path.join(script_dir, "artcraft-mcp-server"),
        os.path.join(script_dir, "tools", "artcraft-mcp-server.exe"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return None

def get_target_configs():
    home = os.path.expanduser("~")
    appdata = os.environ.get("APPDATA", os.path.join(home, "AppData", "Roaming"))
    
    configs = [
        # Windsurf / Codeium
        ("Windsurf", os.path.join(home, ".codeium", "windsurf", "mcp_config.json")),
        ("Windsurf (Alt)", os.path.join(home, ".windsurf", "mcp_config.json")),
        # Claude Desktop
        ("Claude Desktop", os.path.join(appdata, "Claude", "claude_desktop_config.json")),
        # Cursor
        ("Cursor", os.path.join(home, ".cursor", "mcp.json")),
    ]
    return configs

def register_mcp(config_path, client_name, exe_path):
    if not os.path.exists(os.path.dirname(config_path)):
        return False
    
    data = {}
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"[-] Warning: Failed to read {config_path}: {e}")
            data = {}

    if "mcpServers" not in data:
        data["mcpServers"] = {}

    data["mcpServers"]["artcraft"] = {
        "command": exe_path,
        "args": [],
        "description": "ArtCraft AI generation platform — images, video, 3D, voice, and audio tools.",
        "enabled": True
    }

    try:
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[+] Successfully registered ArtCraft MCP in {client_name} ({config_path})")
        return True
    except Exception as e:
        print(f"[-] Failed to write config to {config_path}: {e}")
        return False

def main():
    print("=== ArtCraft MCP One-Click Setup Utility ===")
    exe_path = find_mcp_binary()
    if not exe_path:
        print("[-] Could not find artcraft-mcp-server executable in setup directory.")
        sys.exit(1)

    print(f"[*] Found ArtCraft MCP Binary: {exe_path}")
    
    updated_count = 0
    for name, path in get_target_configs():
        if register_mcp(path, name, exe_path):
            updated_count += 1

    if updated_count == 0:
        print("\n[*] No existing MCP client config files were automatically found.")
        print(f"Manual setup snippet for your mcp_config.json:\n")
        print(json.dumps({
            "mcpServers": {
                "artcraft": {
                    "command": exe_path,
                    "args": [],
                    "description": "ArtCraft AI platform MCP server",
                    "enabled": True
                }
            }
        }, indent=2))
    else:
        print(f"\n[+] Setup complete! ArtCraft MCP configured for {updated_count} client(s). Restart your MCP client to activate.")

if __name__ == "__main__":
    main()
