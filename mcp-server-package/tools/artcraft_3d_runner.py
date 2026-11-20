#!/usr/bin/env python3
"""ArtCraft 3D mesh & Gaussian splat automation.

Uploads a reference image, enqueues Hunyuan 3D mesh and/or WorldLabs Marble
splat generation, polls, and downloads results. Paid actions and the local
file upload are confirmed by running this script.
"""

import argparse
import os
import sys

from artcraft_mcp_client import McpClient, McpError, extract_token

DEFAULT_3D_OUT = os.environ.get("ARTCRAFT_3D_OUT") or os.path.expanduser("~/ArtCraft/3D_Assets")

MESH_MODELS = {
    "2.0": "hunyuan_3d_2p0",
    "2.1": "hunyuan_3d_2p1",
    "3": "hunyuan_3d_3",
    "3.1": "hunyuan_3d_3p1_pro",
}
SPLAT_MODELS = {
    "mini": "marble_0p1_mini",
    "plus": "marble_0p1_plus",
    "1.0": "marble_1p0",
    "1.1": "marble_1p1_plus",
}


def main():
    """Parse args, upload an optional source image, enqueue mesh/splat jobs, and download results."""
    parser = argparse.ArgumentParser(
        description="ArtCraft 3D Mesh & Gaussian Splat Generator (paid; runs with confirm)"
    )
    parser.add_argument("--image", type=str, help="Source image path")
    parser.add_argument("--mode", choices=["object", "splat", "both"], default="both")
    parser.add_argument("--prompt", type=str, help="Text prompt (splat; or mesh text-to-3D)")
    parser.add_argument("--version", type=str, default="3", help="Mesh version: 2.0/2.1/3/3.1")
    parser.add_argument("--splat-version", type=str, default="1.1", help="Splat: mini/plus/1.0/1.1")
    parser.add_argument("--out-dir", type=str, default=DEFAULT_3D_OUT)
    parser.add_argument("--timeout", type=int, default=900)
    args = parser.parse_args()

    job_labels = {}

    def on_done(token, state, text):
        """Per-job terminal-state callback: download the media on success, report otherwise."""
        label = job_labels.get(token, token)
        if state == "complete_success":
            print(f"[+] {label} completed.", flush=True)
            media = extract_token("media", text)
            if media:
                try:
                    saved = client.download(media, args.out_dir)
                    print(f"[+] Saved: {saved}", flush=True)
                except McpError as e:
                    print(f"[-] Download failed for {media}: {e}", flush=True)
        else:
            print(f"[-] {label} ended with status: {state}", flush=True)

    try:
        client = McpClient(client_name="artcraft-3d-runner")
    except (FileNotFoundError, McpError) as e:
        print(f"[-] {e}", flush=True)
        sys.exit(1)

    try:
        media_token = None
        if args.image:
            print(f"[*] Uploading reference image: {args.image}", flush=True)
            media_token = client.upload(args.image, kind="image")
            print(f"[+] Media Token: {media_token}", flush=True)

        if args.mode in ("object", "both"):
            if not media_token and not args.prompt:
                print("[-] --image or --prompt is required for mesh generation.", flush=True)
            else:
                mesh_model = MESH_MODELS.get(args.version, args.version)
                gen_args = {"model": mesh_model}
                if media_token:
                    gen_args["image_media_token"] = media_token
                if args.prompt:
                    gen_args["prompt"] = args.prompt
                print(f"[*] Enqueuing 3D mesh generation ({mesh_model})...", flush=True)
                try:
                    text = client.call_text("artcraft_generate_3d_object", gen_args, confirm=True)
                    jtoken = extract_token("job", text)
                    if jtoken:
                        print(f"[+] Mesh Job Enqueued: {jtoken}", flush=True)
                        job_labels[jtoken] = f"3D_Mesh {jtoken}"
                except McpError as e:
                    print(f"[-] Mesh enqueue failed: {e}", flush=True)

        if args.mode in ("splat", "both"):
            splat_model = SPLAT_MODELS.get(args.splat_version, args.splat_version)
            gen_args = {"model": splat_model}
            if media_token:
                gen_args["image_media_token"] = media_token
            if args.prompt:
                gen_args["prompt"] = args.prompt
            print(f"[*] Enqueuing Gaussian splat generation ({splat_model})...", flush=True)
            try:
                text = client.call_text("artcraft_generate_splat", gen_args, confirm=True)
                jtoken = extract_token("job", text)
                if jtoken:
                    print(f"[+] Splat Job Enqueued: {jtoken}", flush=True)
                    job_labels[jtoken] = f"Gaussian_Splat {jtoken}"
            except McpError as e:
                print(f"[-] Splat enqueue failed: {e}", flush=True)

        if not job_labels:
            print("[-] No jobs were enqueued. Exiting.", flush=True)
            sys.exit(1)

        print(f"[*] Monitoring {len(job_labels)} 3D job(s)...", flush=True)
        client.wait_for_jobs(list(job_labels), timeout_s=args.timeout, on_event=on_done)
    finally:
        client.close()


if __name__ == "__main__":
    main()
