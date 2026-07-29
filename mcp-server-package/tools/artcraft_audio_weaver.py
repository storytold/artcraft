#!/usr/bin/env python3
"""
ArtCraft Audio & Voice Synthesis Weaver
Interfaces with artcraft-mcp-server.exe to generate ambient audio, TTS narrations, and sound effects.
"""

import os
import sys
import json
import time
import re
import argparse
import subprocess

def find_mcp_executable():
    """Dynamically locate artcraft-mcp-server executable across OS environments."""
    env_path = os.environ.get("ARTCRAFT_MCP_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, "artcraft-mcp-server.exe"),
        os.path.join(script_dir, "..", "artcraft-mcp-server.exe"),
        os.path.join(script_dir, "artcraft-mcp.exe"),
        os.path.join(script_dir, "..", "artcraft-mcp.exe"),
        os.path.join(script_dir, "artcraft-mcp-server"),
        os.path.join(script_dir, "..", "artcraft-mcp-server"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return "artcraft-mcp-server.exe"

class ArtCraftAudioClient:
    def __init__(self, exe_path=None):
        self.exe_path = exe_path or find_mcp_executable()
        if not os.path.exists(self.exe_path):
            raise FileNotFoundError(f"ArtCraft MCP binary not found at: {self.exe_path}. Set ARTCRAFT_MCP_PATH or place binary alongside tool.")
        
        self.exe_path = exe_path
        self.proc = subprocess.Popen(
            [self.exe_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self.req_id = 1
        self._initialize()

    def send_request(self, method, params=None):
        msg = {"jsonrpc": "2.0", "id": self.req_id, "method": method}
        if params is not None:
            msg["params"] = params
        self.req_id += 1
        self.proc.stdin.write(json.dumps(msg) + "\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        if not line:
            return None
        return json.loads(line.strip())

    def _initialize(self):
        self.send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "artcraft-audio-runner", "version": "1.0.0"}
        })
        self.proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        self.proc.stdin.flush()

    def upload_media(self, file_path):
        res = self.send_request("tools/call", {
            "name": "upload_media",
            "arguments": {"file_path": file_path}
        })
        if res and "result" in res:
            for c in res["result"].get("content", []):
                text = c.get("text", "")
                m = re.search(r"m_[a-zA-Z0-9_-]+", text)
                if m:
                    return m.group(0)
        return None

    def create_prompt(self, prompt, is_negative=False):
        res = self.send_request("tools/call", {
            "name": "create_prompt",
            "arguments": {"prompt": prompt, "is_negative": is_negative}
        })
        if res and "result" in res:
            for c in res["result"].get("content", []):
                text = c.get("text", "")
                m = re.search(r"prompt_[a-zA-Z0-9_-]+", text)
                if m:
                    return m.group(0)
        return None

    def download_media(self, media_token, out_dir):
        os.makedirs(out_dir, exist_ok=True)
        return self.send_request("tools/call", {
            "name": "download_media_file",
            "arguments": {
                "media_token": media_token,
                "download_directory": out_dir
            }
        })

    def close(self):
        try:
            self.proc.terminate()
        except:
            pass


def main():
    parser = argparse.ArgumentParser(description="ArtCraft Audio & Voice Weaver Tool")
    parser.add_argument("--prompt", type=str, required=True, help="Audio text or prompt description")
    parser.add_argument("--audio-ref", type=str, help="Optional reference audio path")
    parser.add_argument("--out-dir", type=str, default=os.getcwd(), help="Output directory")
    args = parser.parse_args()

    client = ArtCraftAudioClient()

    audio_token = None
    if args.audio_ref:
        print(f"[*] Uploading reference audio: {args.audio_ref}", flush=True)
        audio_token = client.upload_media(args.audio_ref)
        print(f"[+] Audio Reference Token: {audio_token}", flush=True)

    print(f"[*] Staging prompt token for audio synthesis...", flush=True)
    prompt_token = client.create_prompt(args.prompt)
    print(f"[+] Prompt Token Staged: {prompt_token}", flush=True)

    client.close()

if __name__ == "__main__":
    main()
