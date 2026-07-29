#!/usr/bin/env python3
"""
ArtCraft 3D & Gaussian Splatting Automation Tool
Interfaces with artcraft-mcp-server.exe to generate Hunyuan 3D meshes and WorldLabs Marble Splat scenes.
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

DEFAULT_3D_OUT = os.environ.get("ARTCRAFT_3D_OUT") or (
    r"F:\AI_Art\3D_Assets" if os.path.exists(r"F:\AI_Art\3D_Assets") else os.path.expanduser("~/ArtCraft/3D_Assets")
)

class ArtCraft3DClient:
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
            "clientInfo": {"name": "artcraft-3d-runner", "version": "1.0.0"}
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

    def generate_object_3d(self, media_file_token, version="2.0"):
        res = self.send_request("tools/call", {
            "name": "generate_object_3d",
            "arguments": {"media_file_token": media_file_token, "version": version}
        })
        if res and "result" in res:
            for c in res["result"].get("content", []):
                text = c.get("text", "")
                m = re.search(r"jinf_[a-zA-Z0-9_-]+", text)
                if m:
                    return m.group(0)
        return None

    def generate_splat_3d(self, media_file_token=None, prompt=None, version="mini"):
        args = {"version": version}
        if media_file_token:
            args["image_media_file_token"] = media_file_token
        if prompt:
            args["prompt"] = prompt

        res = self.send_request("tools/call", {
            "name": "generate_splat_3d",
            "arguments": args
        })
        if res and "result" in res:
            for c in res["result"].get("content", []):
                text = c.get("text", "")
                m = re.search(r"jinf_[a-zA-Z0-9_-]+", text)
                if m:
                    return m.group(0)
        return None

    def get_job_status(self, job_token):
        return self.send_request("tools/call", {
            "name": "get_job_status",
            "arguments": {"job_token": job_token}
        })

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
    parser = argparse.ArgumentParser(description="ArtCraft 3D Mesh & Gaussian Splat Generator")
    parser.add_argument("--image", type=str, help="Source image path")
    parser.add_argument("--mode", type=str, choices=["object", "splat", "both"], default="both", help="Generation mode")
    parser.add_argument("--prompt", type=str, help="Text prompt for Splat generation")
    parser.add_argument("--version", type=str, default="2.0", help="Hunyuan 3D version (2.0/2.1) or Splat (mini/plus)")
    parser.add_argument("--out-dir", type=str, default=DEFAULT_3D_OUT, help="Output folder")
    args = parser.parse_args()

    client = ArtCraft3DClient()
    media_token = None

    if args.image:
        print(f"[*] Uploading reference image: {args.image}", flush=True)
        media_token = client.upload_media(args.image)
        print(f"[+] Media Token: {media_token}", flush=True)

    job_tokens = {}

    if args.mode in ["object", "both"]:
        if not media_token:
            print("[-] Image path is required for Hunyuan 3D object generation.", flush=True)
        else:
            print("[*] Enqueuing 3D Mesh generation (Hunyuan 3D)...", flush=True)
            jtoken = client.generate_object_3d(media_token, version=args.version)
            if jtoken:
                print(f"[+] 3D Mesh Job Enqueued: {jtoken}", flush=True)
                job_tokens[jtoken] = "3D_Mesh"

    if args.mode in ["splat", "both"]:
        print("[*] Enqueuing 3D Gaussian Splat generation (WorldLabs Marble)...", flush=True)
        splat_ver = "mini" if args.version not in ["mini", "plus"] else args.version
        jtoken = client.generate_splat_3d(media_file_token=media_token, prompt=args.prompt, version=splat_ver)
        if jtoken:
            print(f"[+] Gaussian Splat Job Enqueued: {jtoken}", flush=True)
            job_tokens[jtoken] = "Gaussian_Splat"

    if not job_tokens:
        print("[-] No jobs were enqueued. Exiting.", flush=True)
        client.close()
        return

    print(f"[*] Monitoring {len(job_tokens)} 3D generation jobs...", flush=True)
    completed = set()

    for _ in range(90): # 7.5 min timeout for 3D processing
        for jtoken, label in job_tokens.items():
            if jtoken in completed:
                continue
            status_res = client.get_job_status(jtoken)
            if status_res and "result" in status_res:
                text = ""
                for c in status_res["result"].get("content", []):
                    text += c.get("text", "")
                if "completed" in text.lower() or "finished" in text.lower():
                    print(f"[+] {label} Job {jtoken} completed!", flush=True)
                    completed.add(jtoken)
                    m = re.search(r"med_[a-zA-Z0-9_-]+", text)
                    if m:
                        dl_token = m.group(0)
                        print(f"[*] Downloading {label} ({dl_token}) to {args.out_dir}...", flush=True)
                        client.download_media(dl_token, args.out_dir)
                elif "failed" in text.lower():
                    print(f"[-] {label} Job {jtoken} failed.", flush=True)
                    completed.add(jtoken)

        if len(completed) == len(job_tokens):
            print("[+] All 3D generation jobs completed successfully!", flush=True)
            break
        time.sleep(5)

    client.close()

if __name__ == "__main__":
    main()
