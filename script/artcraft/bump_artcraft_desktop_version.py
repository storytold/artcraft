#!/usr/bin/env python3
"""
Bump the ArtCraft desktop app version across all three version files.

Usage:
  python bump_artcraft_desktop_version.py           # auto-bump minor (0.9.x -> 0.10.0)
  python bump_artcraft_desktop_version.py 1.2.3     # set explicit version

The auto-bump reads the highest current version found across all three files,
increments the minor component by 1, and resets the patch to 0.
e.g. 0.9.4 -> 0.10.0, 0.22.3 -> 0.23.0
"""

import re
import sys
import json
import os

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")

VERSION_RS    = os.path.join(REPO_ROOT, "crates/desktop/artcraft/src/version.rs")
TAURI_CONF    = os.path.join(REPO_ROOT, "crates/desktop/artcraft/tauri.conf.json")
TAURI_MAC     = os.path.join(REPO_ROOT, "crates/desktop/artcraft/tauri-mac.conf.json")

VERSION_RE = re.compile(r"\d+\.\d+\.\d+")


def read_version_rs(path):
    with open(path) as f:
        content = f.read()
    m = re.search(r'ARTCRAFT_VERSION:\s*&str\s*=\s*"(\d+\.\d+\.\d+)"', content)
    if not m:
        return None
    return m.group(1)


def read_json_version(path):
    with open(path) as f:
        data = json.load(f)
    v = data.get("version")
    if v and VERSION_RE.fullmatch(v):
        return v
    return None


def bump_minor(version):
    major, minor, _patch = version.split(".")
    return f"{major}.{int(minor) + 1}.0"


def write_version_rs(path, new_version):
    with open(path) as f:
        content = f.read()
    updated = re.sub(
        r'(ARTCRAFT_VERSION:\s*&str\s*=\s*)"(\d+\.\d+\.\d+)"',
        rf'\g<1>"{new_version}"',
        content,
    )
    if updated == content:
        raise ValueError(f"Could not find ARTCRAFT_VERSION in {path}")
    with open(path, "w") as f:
        f.write(updated)


def write_json_version(path, new_version):
    with open(path) as f:
        content = f.read()
    updated = re.sub(
        r'("version"\s*:\s*)"(\d+\.\d+\.\d+)"',
        rf'\g<1>"{new_version}"',
        content,
    )
    if updated == content:
        raise ValueError(f"Could not find version field in {path}")
    with open(path, "w") as f:
        f.write(updated)


def parse_tuple(version):
    return tuple(int(x) for x in version.split("."))


def main():
    # --- Determine new version ---
    if len(sys.argv) > 2:
        print("Usage: bump_artcraft_desktop_version.py [VERSION]", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) == 2:
        arg = sys.argv[1]
        if not re.fullmatch(r"\d+\.\d+\.\d+", arg):
            print(f"Error: version argument '{arg}' does not match \\d+\\.\\d+\\.\\d+", file=sys.stderr)
            sys.exit(1)
        new_version = arg
        print(f"Using explicit version: {new_version}")
    else:
        # Read all three and take the highest
        versions = {}
        for label, reader, path in [
            ("version.rs",         read_version_rs,   VERSION_RS),
            ("tauri.conf.json",    read_json_version, TAURI_CONF),
            ("tauri-mac.conf.json",read_json_version, TAURI_MAC),
        ]:
            try:
                v = reader(path)
                if v:
                    versions[label] = v
                    print(f"  {label}: {v}")
                else:
                    print(f"  {label}: (could not parse version)")
            except Exception as e:
                print(f"  {label}: (error reading: {e})")

        if not versions:
            print("Error: could not read version from any file. Supply a version argument.", file=sys.stderr)
            sys.exit(1)

        highest = max(versions.values(), key=parse_tuple)
        new_version = bump_minor(highest)
        print(f"Highest current version: {highest} -> bumped to: {new_version}")

    # --- Write new version to all three files ---
    errors = []
    for label, writer, path in [
        ("version.rs",         write_version_rs,   VERSION_RS),
        ("tauri.conf.json",    write_json_version, TAURI_CONF),
        ("tauri-mac.conf.json",write_json_version, TAURI_MAC),
    ]:
        try:
            writer(path, new_version)
            print(f"  Updated {label}")
        except Exception as e:
            errors.append(f"  Failed to update {label}: {e}")

    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        sys.exit(1)

    print(f"\nDone. All files set to {new_version}")


if __name__ == "__main__":
    main()
