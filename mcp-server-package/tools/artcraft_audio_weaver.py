#!/usr/bin/env python3
"""ArtCraft audio generation weaver.

Generates music/SFX via artcraft_generate_audio (Suno/Seed Audio), with an
optional uploaded reference track for remixing. Polls the job and downloads
the result. Paid actions and local uploads are confirmed by running this
script.
"""

import argparse
import os
import sys

from artcraft_mcp_client import McpClient, McpError, extract_token

DEFAULT_OUT_DIR = os.path.expanduser("~/ArtCraft/audio")


def main():
    """Parse args, upload an optional audio reference, enqueue the generation job, download results."""
    parser = argparse.ArgumentParser(
        description="ArtCraft Audio & Voice Weaver (paid; runs with confirm)"
    )
    parser.add_argument("--prompt", type=str, required=True, help="Audio text prompt or lyrics")
    parser.add_argument("--model", type=str, default="suno_music",
                        help="suno_music | suno_remix | suno_sounds | suno_sample | seed_audio_1p0")
    parser.add_argument("--style", type=str, help="Genre/style tags")
    parser.add_argument("--audio-ref", type=str, help="Optional reference audio file path")
    parser.add_argument("--instrumental", action="store_true", help="No vocals")
    parser.add_argument("--bpm", type=int, help="Tempo 30-300")
    parser.add_argument("--out-dir", type=str, default=DEFAULT_OUT_DIR)
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()

    try:
        client = McpClient(client_name="artcraft-audio-runner")
    except (FileNotFoundError, McpError) as e:
        print(f"[-] {e}", flush=True)
        sys.exit(1)

    job_token = None

    def on_done(token, state, text):
        """Per-job terminal-state callback: download the media on success, report otherwise."""
        if state == "complete_success":
            print(f"[+] Job {token} completed.", flush=True)
            media = extract_token("media", text)
            if media:
                try:
                    saved = client.download(media, args.out_dir)
                    print(f"[+] Saved: {saved}", flush=True)
                except McpError as e:
                    print(f"[-] Download failed for {media}: {e}", flush=True)
        else:
            print(f"[-] Job {token} ended with status: {state}", flush=True)

    try:
        audio_token = None
        if args.audio_ref:
            print(f"[*] Uploading reference audio: {args.audio_ref}", flush=True)
            audio_token = client.upload(args.audio_ref, kind="audio")
            print(f"[+] Audio Reference Token: {audio_token}", flush=True)

        gen_args = {"model": args.model, "prompt": args.prompt}
        if args.style:
            gen_args["style_prompt"] = args.style
        if audio_token:
            gen_args["audio_media_tokens"] = [audio_token]
        if args.instrumental:
            gen_args["is_instrumental"] = True
        if args.bpm:
            gen_args["bpm"] = args.bpm

        print(f"[*] Enqueuing audio generation ({args.model})...", flush=True)
        try:
            text = client.call_text("artcraft_generate_audio", gen_args, confirm=True)
        except McpError as e:
            print(f"[-] Enqueue failed: {e}", flush=True)
            sys.exit(1)
        job_token = extract_token("job", text)
        if not job_token:
            print(f"[-] No job token in response: {text[:200]}", flush=True)
            sys.exit(1)
        print(f"[+] Enqueued Job Token: {job_token}", flush=True)

        client.wait_for_jobs([job_token], timeout_s=args.timeout, on_event=on_done)
    finally:
        client.close()


if __name__ == "__main__":
    main()
