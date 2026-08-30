#!/usr/bin/env python3
"""
ArtCraft Multi-Angle Camera Orbit Matrix Generator
Interfaces with artcraft-mcp-server.exe to produce 4-angle spatial camera shifts using flux_2_lora_angles.
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

class ArtCraftAngleClient:
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
            "clientInfo": {"name": "artcraft-angle-runner", "version": "1.0.0"}
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

    def generate_angle_shift(self, prompt, media_token, model="flux_2_lora_angles", h_angle=0.0, v_angle=0.0, zoom=1.0):
        args = {
            "prompt": prompt,
            "model": model,
            "image_media_tokens": media_token,
            "adjust_horizontal_angle": float(h_angle),
            "adjust_vertical_angle": float(v_angle),
            "adjust_zoom": float(zoom)
        }
        res = self.send_request("tools/call", {
            "name": "generate_image",
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
    parser = argparse.ArgumentParser(description="ArtCraft Camera Angle Orbit Matrix Generator")
    parser.add_argument("--image", type=str, required=True, help="Source reference image path")
    parser.add_argument("--prompt", type=str, default="Maintain exact subject details and lighting while rotating camera perspective.", help="Angle shift prompt")
    parser.add_argument("--model", type=str, default="flux_2_lora_angles", choices=["flux_2_lora_angles", "qwen_edit_2511_angles"], help="Angle model")
    parser.add_argument("--out-dir", type=str, default=os.getcwd(), help="Output folder")
    args = parser.parse_args()

    client = ArtCraftAngleClient()

    print(f"[*] Uploading source reference image: {args.image}", flush=True)
    media_token = client.upload_media(args.image)
    if not media_token:
        print("[-] Failed to upload media.", flush=True)
        client.close()
        return
    print(f"[+] Source Media Token: {media_token}", flush=True)

    # 4 Orbit Presets
    presets = [
        {"name": "Left_Orbit_-30deg", "h": -30.0, "v": 0.0, "z": 1.0},
        {"name": "Right_Orbit_+30deg", "h": 30.0, "v": 0.0, "z": 1.0},
        {"name": "High_Angle_Pitch_+20deg", "h": 0.0, "v": 20.0, "z": 1.0},
        {"name": "Zoom_In_1.4x", "h": 0.0, "v": 0.0, "z": 1.4}
    ]

    job_tokens = {}
    for p in presets:
        print(f"[*] Enqueuing Angle Shift: {p['name']}...", flush=True)
        jtoken = client.generate_angle_shift(
            prompt=args.prompt,
            media_token=media_token,
            model=args.model,
            h_angle=p["h"],
            v_angle=p["v"],
            zoom=p["z"]
        )
        if jtoken:
            print(f"[+] Enqueued Job Token: {jtoken}", flush=True)
            job_tokens[jtoken] = p["name"]

    print(f"[*] Monitoring {len(job_tokens)} camera angle shift jobs...", flush=True)
    completed = set()

    for _ in range(60):
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
            print("[+] All camera angle shift jobs completed successfully!", flush=True)
            break
        time.sleep(5)

    client.close()

if __name__ == "__main__":
    main()
