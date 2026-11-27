#!/usr/bin/env python3
"""ArtCraft credit & cost estimator.

Shows credit balance, subscription, and pre-generation cost estimates using
the real artcraft_estimate_cost tool argument names.
"""

import argparse
import sys

from artcraft_mcp_client import McpClient, McpError


def main():
    """Print credit balance, subscription, and image/video cost estimates for the given models."""
    parser = argparse.ArgumentParser(description="ArtCraft Credit & Cost Estimator")
    parser.add_argument("--video-model", type=str, default="seedance_2p0", help="Video model id")
    parser.add_argument("--image-model", type=str, default="flux_1_dev", help="Image model id")
    parser.add_argument("--duration", type=int, default=5, help="Video duration in seconds")
    parser.add_argument("--count", type=int, default=1, help="Image batch count (1-8)")
    parser.add_argument("--aspect-ratio", type=str, default="wide_16_9",
                        help="e.g. wide_16_9, tall_9_16, square")
    args = parser.parse_args()

    try:
        client = McpClient(client_name="artcraft-cost-estimator")
    except (FileNotFoundError, McpError) as e:
        print(f"[-] {e}", flush=True)
        sys.exit(1)

    print("=== ArtCraft Credit & Cost Inspector ===")

    try:
        print("\n[Credit Balance]:")
        print(client.call_text("artcraft_get_credits"))
    except McpError as e:
        print(f"[-] credits: {e}")

    try:
        print("\n[Active Subscription]:")
        print(client.call_text("artcraft_get_subscription"))
    except McpError as e:
        print(f"[-] subscription: {e}")

    print(f"\n[*] Estimating Video Cost for '{args.video_model}' ({args.duration}s)...")
    try:
        print(client.call_text("artcraft_estimate_cost", {
            "media_type": "video",
            "model": args.video_model,
            "duration_seconds": args.duration,
            "aspect_ratio": args.aspect_ratio,
        }))
    except McpError as e:
        print(f"[-] video estimate: {e}")

    print(f"\n[*] Estimating Image Cost for '{args.image_model}' ({args.count} item(s))...")
    try:
        print(client.call_text("artcraft_estimate_cost", {
            "media_type": "image",
            "model": args.image_model,
            "generation_mode": "text_to_image",
            "aspect_ratio": args.aspect_ratio,
            "batch_count": args.count,
        }))
    except McpError as e:
        print(f"[-] image estimate: {e}")

    client.close()


if __name__ == "__main__":
    main()
