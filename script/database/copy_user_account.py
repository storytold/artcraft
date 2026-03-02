#!/usr/bin/env python3
"""
Copy email/password credentials from one user account to another.

Use case: a user accidentally created two accounts and wants their original
credentials (email + password) moved to their preferred account.

What this does (in one transaction):
  1. Reads the source user's email_address and password_hash.
  2. Renames the source user's email to {original}.{timestamp}-renamed.com
     (strips any prior renamed suffixes first, so re-running is safe).
  3. Copies the source email + password_hash onto the target user, sets
     is_without_password=false, and increments password_version.

Requirements:
  pip install pymysql

Usage:
  python copy_user_account.py \\
    --source_email_password_from=<user_token> \\
    --target_copy_to=<user_token>
"""

import argparse
import re
import sys
import time
import tomllib
from pathlib import Path
from urllib.parse import urlparse

try:
    import pymysql
except ImportError:
    print("pymysql is required: pip install pymysql")
    sys.exit(1)


SECRETS_PATH = Path(__file__).parent / "secrets.toml"


def load_config():
    with open(SECRETS_PATH, "rb") as f:
        config = tomllib.load(f)
    url = config["database"]["url"]
    parsed = urlparse(url)
    return {
        "host": parsed.hostname,
        "port": parsed.port or 3306,
        "user": parsed.username,
        "password": parsed.password,
        "database": parsed.path.lstrip("/"),
    }


def connect(config):
    return pymysql.connect(
        host=config["host"],
        port=config["port"],
        user=config["user"],
        password=config["password"],
        database=config["database"],
        connect_timeout=10,
        read_timeout=30,
        write_timeout=30,
        autocommit=False,
    )


def fetch_user(cursor, token: str) -> dict | None:
    cursor.execute(
        """
        SELECT token, email_address, password_hash, password_version,
               is_without_password, version, created_at
        FROM users
        WHERE token = %s
        LIMIT 1
        """,
        (token,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    cols = ["token", "email_address", "password_hash", "password_version",
            "is_without_password", "version", "created_at"]
    return dict(zip(cols, row))


def strip_renamed_suffixes(email: str) -> str:
    """Remove any .{digits}-renamed.com suffixes to recover the original email."""
    pattern = r'\.\d+-renamed\.com$'
    while re.search(pattern, email):
        email = re.sub(pattern, '', email)
    return email


def format_hash(h) -> str:
    if h is None:
        return "(null)"
    if isinstance(h, (bytes, bytearray)):
        return h.hex()[:24] + "..."
    return str(h)[:24] + "..."


def print_user(label: str, user: dict):
    print(f"  {label}:")
    print(f"    token             : {user['token']}")
    print(f"    email_address     : {user['email_address']}")
    print(f"    password_hash     : {format_hash(user['password_hash'])}")
    print(f"    password_version  : {user['password_version']}")
    print(f"    is_without_password: {bool(user['is_without_password'])}")
    print(f"    version           : {user['version']}")
    print(f"    created_at        : {user['created_at']}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Copy email/password from one user account to another."
    )
    parser.add_argument(
        "--source_email_password_from",
        required=True,
        metavar="TOKEN",
        help="Token of the source user (credentials will be copied FROM this account)",
    )
    parser.add_argument(
        "--target_copy_to",
        required=True,
        metavar="TOKEN",
        help="Token of the target user (credentials will be copied TO this account)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    source_token = args.source_email_password_from.strip()
    target_token = args.target_copy_to.strip()

    if source_token == target_token:
        print("ERROR: source and target tokens are the same.")
        sys.exit(1)

    config = load_config()
    conn = connect(config)

    try:
        with conn.cursor() as cursor:
            source = fetch_user(cursor, source_token)
            target = fetch_user(cursor, target_token)

        if source is None:
            print(f"ERROR: No user found with source token: {source_token}")
            sys.exit(1)
        if target is None:
            print(f"ERROR: No user found with target token: {target_token}")
            sys.exit(1)

        print("\nSource (credentials will be copied FROM this account):")
        print_user("source", source)
        print("\nTarget (credentials will be copied TO this account):")
        print_user("target", target)

        original_email = strip_renamed_suffixes(source["email_address"])
        timestamp = int(time.time())
        renamed_email = f"{original_email}.{timestamp}-renamed.com"

        print("\nProposed changes:")
        print(f"  source email  : {source['email_address']}")
        print(f"              → : {renamed_email}")
        print(f"  target email  : {target['email_address']}")
        print(f"              → : {original_email}")
        print(f"  target password_hash → (copied from source)")
        print(f"  target is_without_password → false")
        print(f"  target password_version → {target['password_version']} + 1 = {target['password_version'] + 1}")

        print()
        answer = input("Proceed? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted.")
            sys.exit(0)

        with conn.cursor() as cursor:
            # Step 1: rename source email
            cursor.execute(
                """
                UPDATE users
                SET email_address = %s,
                    version = version + 1
                WHERE token = %s
                """,
                (renamed_email, source_token),
            )
            if cursor.rowcount != 1:
                raise RuntimeError(f"Expected 1 row updated for source, got {cursor.rowcount}")

            # Step 2: copy credentials to target
            cursor.execute(
                """
                UPDATE users
                SET email_address = %s,
                    password_hash = %s,
                    is_without_password = false,
                    password_version = password_version + 1,
                    version = version + 1
                WHERE token = %s
                """,
                (original_email, source["password_hash"], target_token),
            )
            if cursor.rowcount != 1:
                raise RuntimeError(f"Expected 1 row updated for target, got {cursor.rowcount}")

        conn.commit()
        print("\nDone. Changes committed.")
        print(f"  source ({source_token}): email is now {renamed_email}")
        print(f"  target ({target_token}): email is now {original_email}")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        print("Transaction rolled back.")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
