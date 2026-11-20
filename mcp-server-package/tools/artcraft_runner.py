#!/usr/bin/env python3
"""ArtCraft MCP batch video/image generation runner.

Uploads an optional start-frame image, enqueues one or more video
generations, polls job status, and downloads results. Paid actions and
local file uploads are confirmed by running this script (confirm: true is
sent automatically).
"""

import argparse
import os
import sys
from pathlib import Path

from artcraft_mcp_client import McpClient, McpError, extract_all_tokens, extract_token

DEFAULT_OUT_DIR = os.path.expanduser("~/ArtCraft/downloads")


def main():
    """Parse args, optionally upload a start frame, enqueue video jobs, and download results."""
    parser = argparse.ArgumentParser(
        description="ArtCraft MCP Batch & Automation Runner (paid generation; runs with confirm)"
    )
    parser.add_argument("--image", type=str, help="Path to initial image keyframe")
    parser.add_argument("--prompt", type=str, required=True, help="Video prompt")
    parser.add_argument("--model", type=str, default="seedance_2p0", help="Video model id")
    parser.add_argument("--copies", type=int, default=1, help="Number of generations")
    parser.add_argument("--duration", type=int, default=5, help="Duration in seconds (1-600)")
    parser.add_argument("--out-dir", type=str, default=DEFAULT_OUT_DIR, help="Download directory")
    parser.add_argument("--timeout", type=int, default=900, help="Max wait seconds for all jobs")
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
        client = McpClient(client_name="artcraft-cli-runner")
    except (FileNotFoundError, McpError) as e:
        print(f"[-] {e}", flush=True)
        sys.exit(1)

    try:
        media_token = None
        if args.image:
            print(f"[*] Uploading source image: {args.image}", flush=True)
            media_token = client.upload(args.image, kind="image")
            if not media_token:
                print("[-] Upload did not return a media token.", flush=True)
                sys.exit(1)
            print(f"[+] Media Token: {media_token}", flush=True)

        for i in range(args.copies):
            print(f"[*] Enqueuing video job #{i + 1}...", flush=True)
            gen_args = {
                "model": args.model,
                "prompt": args.prompt,
                "duration_seconds": args.duration,
            }
            if media_token:
                gen_args["start_frame_image_media_token"] = media_token
            try:
                text = client.call_text("artcraft_generate_video", gen_args, confirm=True)
            except McpError as e:
                print(f"[-] Enqueue failed for job #{i + 1}: {e}", flush=True)
                continue
            jtoken = extract_token("job", text)
            if jtoken:
                print(f"[+] Enqueued Job Token: {jtoken}", flush=True)
                job_labels[jtoken] = f"Job {jtoken} (#{i + 1})"
            else:
                print(f"[-] No job token in response: {text[:200]}", flush=True)

        if not job_labels:
            print("[-] No jobs were successfully enqueued. Exiting.", flush=True)
            sys.exit(1)

        print(f"[*] Monitoring {len(job_labels)} job(s)...", flush=True)
        client.wait_for_jobs(list(job_labels), timeout_s=args.timeout, on_event=on_done)
    finally:
        client.close()


if __name__ == "__main__":
    main()
