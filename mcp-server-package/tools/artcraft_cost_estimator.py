#!/usr/bin/env python3
"""
ArtCraft Credit & Cost Estimator Tool
Queries active credit balance, subscription status, and estimates generation costs for image/video models.
"""

import os
import sys
import json
import argparse
import subprocess

def find_mcp_executable():
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

class ArtCraftCostClient:
    def __init__(self, exe_path=None):
        self.exe_path = exe_path or find_mcp_executable()
        if not os.path.exists(self.exe_path):
            raise FileNotFoundError(f"ArtCraft MCP binary not found at: {self.exe_path}")
        
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
            "clientInfo": {"name": "artcraft-cost-estimator", "version": "1.0.0"}
        })
        self.proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        self.proc.stdin.flush()

    def get_credits(self):
        return self.send_request("tools/call", {"name": "get_credits", "arguments": {}})

    def get_subscription(self):
        return self.send_request("tools/call", {"name": "get_subscription", "arguments": {}})

    def estimate_image_cost(self, model="flux_1_dev", count=1, aspect_ratio="wide_sixteen_by_nine"):
        return self.send_request("tools/call", {
            "name": "estimate_image_cost",
            "arguments": {
                "model": model,
                "provider": "artcraft",
                "generation_mode": "text_to_image",
                "aspect_ratio": aspect_ratio,
                "image_batch_count": count
            }
        })

    def estimate_video_cost(self, model="seedance_2p0", duration=5, aspect_ratio="wide_sixteen_by_nine"):
        return self.send_request("tools/call", {
            "name": "estimate_video_cost",
            "arguments": {
                "model": model,
                "provider": "artcraft",
                "generation_mode": "reference_image_to_video",
                "aspect_ratio": aspect_ratio,
                "duration_seconds": duration
            }
        })

    def close(self):
        try:
            self.proc.terminate()
        except:
            pass


def main():
    parser = argparse.ArgumentParser(description="ArtCraft Credit & Cost Estimator")
    parser.add_argument("--check-balance", action="store_true", help="Check current credit balance & subscription")
    parser.add_argument("--video-model", type=str, default="seedance_2p0", help="Model to estimate video cost")
    parser.add_argument("--image-model", type=str, default="flux_1_dev", help="Model to estimate image cost")
    parser.add_argument("--duration", type=int, default=5, help="Video duration in seconds")
    parser.add_argument("--count", type=int, default=1, help="Image count")
    args = parser.parse_args()

    client = ArtCraftCostClient()

    print("=== ArtCraft Credit & Cost Inspector ===")
    
    cred_res = client.get_credits()
    if cred_res and "result" in cred_res:
        for c in cred_res["result"].get("content", []):
            print("\n[Credit Balance]:")
            print(c.get("text", ""))

    sub_res = client.get_subscription()
    if sub_res and "result" in sub_res:
        for c in sub_res["result"].get("content", []):
            print("\n[Active Subscription]:")
            print(c.get("text", ""))

    print(f"\n[*] Estimating Video Cost for '{args.video_model}' ({args.duration}s)...")
    vcost = client.estimate_video_cost(model=args.video_model, duration=args.duration)
    if vcost and "result" in vcost:
        for c in vcost["result"].get("content", []):
            print(c.get("text", ""))

    print(f"\n[*] Estimating Image Cost for '{args.image_model}' ({args.count} item(s))...")
    icost = client.estimate_image_cost(model=args.image_model, count=args.count)
    if icost and "result" in icost:
        for c in icost["result"].get("content", []):
            print(c.get("text", ""))

    client.close()

if __name__ == "__main__":
    main()
