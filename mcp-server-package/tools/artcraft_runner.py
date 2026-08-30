#!/usr/bin/env python3
"""
ArtCraft MCP CLI Runner
Utility script to interface directly with artcraft-mcp-server.exe over stdio JSON-RPC.
Supports image uploads, batch video/image generation, job status polling, and automatic downloading.
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

class ArtCraftMCPClient:
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
        msg = {
            "jsonrpc": "2.0",
            "id": self.req_id,
            "method": method
        }
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
            "clientInfo": {"name": "artcraft-cli-runner", "version": "1.0.0"}
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

    def generate_video(self, prompt, model="seedance_2p0", duration=5, start_frame_token=None):
        args = {
            "prompt": prompt,
            "model": model,
            "duration": duration
        }
        if start_frame_token:
            args["start_frame_media_token"] = start_frame_token

        res = self.send_request("tools/call", {
            "name": "generate_video",
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
    parser = argparse.ArgumentParser(description="ArtCraft MCP Batch & Automation Runner")
    parser.add_argument("--image", type=str, help="Path to initial image keyframe")
    parser.add_argument("--prompt", type=str, required=True, help="Video prompt")
    parser.add_argument("--model", type=str, default="seedance_2p0", help="Video model")
    parser.add_argument("--copies", type=int, default=1, help="Number of copies to generate")
    parser.add_argument("--duration", type=int, default=5, help="Duration in seconds")
    parser.add_argument("--out-dir", type=str, default=os.getcwd(), help="Output download directory")
    args = parser.parse_args()

    client = ArtCraftMCPClient()
    media_token = None

    if args.image:
        print(f"[*] Uploading source image: {args.image}", flush=True)
        media_token = client.upload_media(args.image)
        print(f"[+] Media Token: {media_token}", flush=True)

    job_tokens = []
    for i in range(args.copies):
        print(f"[*] Enqueuing video job #{i+1}...", flush=True)
        jtoken = client.generate_video(
            prompt=args.prompt,
            model=args.model,
            duration=args.duration,
            start_frame_token=media_token
        )
        if jtoken:
            print(f"[+] Enqueued Job Token: {jtoken}", flush=True)
            job_tokens.append(jtoken)
        else:
            print(f"[-] Failed to enqueue Job #{i+1}", flush=True)

    print(f"[*] Monitoring {len(job_tokens)} jobs...", flush=True)
    completed = set()

    for _ in range(60): # 5 min timeout
        for jtoken in job_tokens:
            if jtoken in completed:
                continue
            status_res = client.get_job_status(jtoken)
            if status_res and "result" in status_res:
                text = ""
                for c in status_res["result"].get("content", []):
                    text += c.get("text", "")
                if "completed" in text.lower() or "finished" in text.lower():
                    print(f"[+] Job {jtoken} completed!", flush=True)
                    completed.add(jtoken)
                    m = re.search(r"med_[a-zA-Z0-9_-]+", text)
                    if m:
                        dl_token = m.group(0)
                        print(f"[*] Downloading media {dl_token} to {args.out_dir}...", flush=True)
                        client.download_media(dl_token, args.out_dir)
                elif "failed" in text.lower():
                    print(f"[-] Job {jtoken} failed.", flush=True)
                    completed.add(jtoken)

        if len(completed) == len(job_tokens):
            print("[+] All jobs completed!", flush=True)
            break
        time.sleep(5)

    client.close()

if __name__ == "__main__":
    main()
