#!/usr/bin/env python3
"""ArtCraft camera-angle orbit matrix generator.

Uploads a reference image and produces a set of camera-angle edits via
artcraft_edit_image_angle (Flux 2 LoRA angle editing). Paid actions and the
local file upload are confirmed by running this script.
"""

import argparse
import os
import sys

from artcraft_mcp_client import McpClient, McpError, extract_token

DEFAULT_OUT_DIR = os.path.expanduser("~/ArtCraft/angle_matrix")

PRESETS = [
    {"name": "Left_Orbit_-30deg", "h": -30.0, "v": 0.0, "z": 1.0},
    {"name": "Right_Orbit_+30deg", "h": 30.0, "v": 0.0, "z": 1.0},
    {"name": "High_Angle_Pitch_+20deg", "h": 0.0, "v": 20.0, "z": 1.0},
    {"name": "Zoom_In_1.4x", "h": 0.0, "v": 0.0, "z": 1.4},
]


def main():
    """Parse args, upload the reference image, enqueue one edit job per angle preset, download results."""
    parser = argparse.ArgumentParser(
        description="ArtCraft Camera Angle Orbit Matrix Generator (paid; runs with confirm)"
    )
    parser.add_argument("--image", type=str, required=True, help="Source reference image path")
    parser.add_argument("--out-dir", type=str, default=DEFAULT_OUT_DIR)
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()

    job_labels = {}

    def on_done(token, state, text):
        """Per-job terminal-state callback: save each render named after its angle preset."""
        label = job_labels.get(token, token)
        if state == "complete_success":
            print(f"[+] {label} completed.", flush=True)
            media = extract_token("media", text)
            if media:
                try:
                    saved = client.download(media, args.out_dir, filename=f"{label}_{media}.png")
                    print(f"[+] Saved: {saved}", flush=True)
                except McpError as e:
                    print(f"[-] Download failed for {media}: {e}", flush=True)
        else:
            print(f"[-] {label} ended with status: {state}", flush=True)

    try:
        client = McpClient(client_name="artcraft-angle-runner")
    except (FileNotFoundError, McpError) as e:
        print(f"[-] {e}", flush=True)
        sys.exit(1)

    try:
        print(f"[*] Uploading source reference image: {args.image}", flush=True)
        media_token = client.upload(args.image, kind="image")
        if not media_token:
            print("[-] Upload failed.", flush=True)
            sys.exit(1)
        print(f"[+] Source Media Token: {media_token}", flush=True)

        for p in PRESETS:
            print(f"[*] Enqueuing angle shift: {p['name']}...", flush=True)
            gen_args = {
                "image_media_token": media_token,
                "horizontal_angle": p["h"],
                "vertical_angle": p["v"],
                "zoom": p["z"],
            }
            try:
                text = client.call_text("artcraft_edit_image_angle", gen_args, confirm=True)
            except McpError as e:
                print(f"[-] Enqueue failed for {p['name']}: {e}", flush=True)
                continue
            jtoken = extract_token("job", text)
            if jtoken:
                print(f"[+] Enqueued Job Token: {jtoken}", flush=True)
                job_labels[jtoken] = p["name"]

        if not job_labels:
            print("[-] No jobs were successfully enqueued. Exiting.", flush=True)
            sys.exit(1)

        print(f"[*] Monitoring {len(job_labels)} angle-shift job(s)...", flush=True)
        client.wait_for_jobs(list(job_labels), timeout_s=args.timeout, on_event=on_done)
    finally:
        client.close()


if __name__ == "__main__":
    main()
