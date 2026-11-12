#!/usr/bin/env python3
"""Build the public ArtCraft OpenAPI spec from the docs-cli export.

The upstream file is the utoipa dump produced in storytold/artcraft-services
by ``SQLX_OFFLINE=true cargo run --bin docs-cli``. This script withholds
internal, moderation, impersonation, session-token, and update_job_status
routes, prunes schemas only those routes used, and records the
Authorization behavior from artcraft-services#234.

Write ``frontend/api.json``:

    python3 script/openapi/generate_public_openapi.py

Fail when the committed file differs:

    python3 script/openapi/generate_public_openapi.py --check
"""

import argparse
import copy
import json
import re
import sys
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from typing import Dict, Iterable, List, Optional, Set

from openapi.contract_text import (
    ANONYMOUS_JOBS,
    BAD_HEADER,
    CLOUDFLARE_1010,
    HEADER_FORMS,
    HEADER_WINS,
    JOB_DOWNSAMPLE,
    JOB_POLL,
    JOB_WINDOW,
    MCP_WARNING,
    MEDIA_REJECTS_VISITOR,
    MISSING_USER_AGENT,
    OMNI_IGNORES_COOKIE,
    OWN_ROWS,
    USER_AGENT_SCOPE,
)
from openapi.library_access import JOBS_SESSION_PATH, LIBRARY_READ_PATHS, MEDIA_LIST_PATHS

REPO_ROOT = Path(__file__).resolve().parents[2]
UPSTREAM_PATH = REPO_ROOT / "frontend" / "openapi" / "upstream.openapi.json"
PUBLIC_PATH = REPO_ROOT / "frontend" / "api.json"

AUTH_REVISION = "54a4e47fa681e8a60f9fdb460e677631513225b3"
PUBLIC_SPEC_VERSION = "1.0.0"
CLOUDFLARE_RESPONSE = "CloudflareError1010"

HTTP_METHODS = ("get", "post", "put", "patch", "delete", "head", "options", "trace")

PARAMETER_NOTES = {
    "page_size": "How many rows to return. Defaults to 100. Values above 1000 are capped at 1000.",
    "cursor": "Opaque cursor from a previous page's maybe_next or maybe_previous.",
    "cursor_is_reversed": "When true, the cursor walks backward. Defaults to false.",
    "sort_ascending": "When true, oldest rows come first. Defaults to false (newest first).",
    "filter_project_type": (
        "Optional project type: scene_3d, mood_board, workflow, video_timeline, or editor_2d."
    ),
    "include_states": (
        "Comma-separated JobStatusPlus values to keep: pending, started, "
        "complete_success, complete_failure, attempt_failed, dead, "
        "cancelled_by_user, cancelled_by_system."
    ),
    "exclude_states": (
        "Comma-separated JobStatusPlus values to drop. Same names as include_states."
    ),
}

WITHHELD_MARKERS = (
    "bt@brand.io",
    "Brandon Thomas",
    "/v1/internal/",
    "/v1/session_token",
    "update_job_status",
    "session_token_info_handler",
    "update_gpt_image_job_status_handler",
    "/moderation/",
    "huge security vuln",
)


def main(argv: List[str]) -> int:
    """Write the public spec, or exit 1 when ``--check`` finds drift."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit 1 when frontend/api.json differs from the generator",
    )
    args = parser.parse_args(argv)
    rendered = render_public_document()
    if args.check:
        return _check_committed(rendered)
    PUBLIC_PATH.write_text(rendered, encoding="utf-8", newline="\n")
    print(f"wrote {PUBLIC_PATH.relative_to(REPO_ROOT)}")
    return 0


def render_public_document() -> str:
    """Return the public spec as UTF-8 JSON with a trailing newline."""
    upstream = json.loads(UPSTREAM_PATH.read_text(encoding="utf-8"))
    spec = build_public_spec(upstream)
    assert_public_invariants(spec)
    return json.dumps(spec, indent=2, ensure_ascii=False) + "\n"


def build_public_spec(upstream: dict) -> dict:
    """Copy the docs-cli export and apply the public overlay."""
    spec = {
        "openapi": upstream["openapi"],
        "info": public_info(),
        "servers": public_servers(),
        "paths": copy.deepcopy(public_paths(upstream["paths"])),
        "components": {
            "securitySchemes": security_schemes(),
            "responses": {CLOUDFLARE_RESPONSE: cloudflare_response()},
            "schemas": copy.deepcopy(upstream["components"]["schemas"]),
        },
        "x-artcraft-generator": {
            "command": "python3 script/openapi/generate_public_openapi.py",
            "upstream": "frontend/openapi/upstream.openapi.json",
            "auth": "https://github.com/storytold/artcraft-services/pull/234",
            "authRevision": AUTH_REVISION,
        },
    }
    annotate_operations(spec)
    repair_dangling_parameter_refs(spec)
    prune_schemas(spec)
    return spec


def public_info() -> dict:
    """Info block for the published spec. No personal contact."""
    description = "\n\n".join((
        "Public HTTP API for ArtCraft generation, uploads, job status, and library reads.",
        CLOUDFLARE_1010,
        MISSING_USER_AGENT,
        USER_AGENT_SCOPE,
        HEADER_FORMS,
        (
            "Security requirements are declared on the Omni API routes and on the "
            "library and job reads. Those reads match artcraft-services#234 at "
            f"{AUTH_REVISION}. Other operations keep their server behavior and do "
            "not gain a guessed requirement in this file."
        ),
        "Generated by python3 script/openapi/generate_public_openapi.py. Do not hand-edit.",
    ))
    return {
        "title": "ArtCraft API",
        "description": description,
        "contact": {
            "name": "ArtCraft",
            "url": "https://discord.gg/artcraft",
        },
        "license": {
            "name": "Apache-2.0 OR MIT",
            "url": "https://github.com/storytold/artcraft/blob/main/LICENSE-APACHE",
        },
        "version": PUBLIC_SPEC_VERSION,
    }


def public_servers() -> List[dict]:
    """The base URLs the Omni API guide documents."""
    return [
        {"url": "https://api.storyteller.ai", "description": "Production"},
        {"url": "http://localhost:12345", "description": "Development"},
    ]


def public_paths(upstream_paths: Dict[str, dict]) -> Dict[str, dict]:
    """Drop withheld routes and keep the rest in upstream order."""
    return {
        path: operations
        for path, operations in upstream_paths.items()
        if not path_is_withheld(path)
    }


def path_is_withheld(path: str) -> bool:
    """True for routes that must not appear in the public spec.

    The withheld set is ``/v1/internal/*``, moderation (including
    impersonation), ``/v1/session_token``, and
    ``/v1/image_studio/update_job_status``. The job-status handler has
    no credential check; its own comment defers secrets-based auth.
    """
    if path == "/v1/session_token" or path.startswith("/v1/session_token/"):
        return True
    if path == "/v1/image_studio/update_job_status":
        return True
    if path == "/v1/internal" or path.startswith("/v1/internal/"):
        return True
    if path == "/moderation" or path.startswith("/moderation/"):
        return True
    if path == "/v1/moderation" or path.startswith("/v1/moderation/"):
        return True
    if "impersonat" in path.lower():
        return True
    return False


def security_schemes() -> dict:
    """Schemes #234 actually accepts. Header forms match the parser."""
    header = (
        f"{HEADER_FORMS} Bearer is recommended. "
        f"{HEADER_WINS} {BAD_HEADER}"
    )
    return {
        "apiKey": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "artcraft_api",
            "description": (
                "ArtCraft API key. The secret prefix is artcraft_api_ and the "
                f"key is 53 characters. {header}"
            ),
        },
        "mcpSession": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "mcp_session",
            "description": (
                "MCP private session token in the same Authorization header. "
                "The token prefix is mcp_session_. "
                f"{MCP_WARNING} {header} "
                "A missing, expired, revoked, or unknown token is 401. "
                "The Omni API generation and upload routes do not accept this scheme."
            ),
        },
        "sessionCookie": {
            "type": "apiKey",
            "in": "cookie",
            "name": "session",
            "description": (
                "Website session cookie. Used only when the Authorization header "
                f"is absent. {HEADER_WINS} {BAD_HEADER}"
            ),
        },
        "visitorCookie": {
            "type": "apiKey",
            "in": "cookie",
            "name": "visitor",
            "description": (
                f"{ANONYMOUS_JOBS} {MEDIA_REJECTS_VISITOR} {BAD_HEADER}"
            ),
        },
    }


def cloudflare_response() -> dict:
    """The non-JSON 403 Cloudflare returns before the API key is checked."""
    return {
        "description": f"{CLOUDFLARE_1010} {MISSING_USER_AGENT} {USER_AGENT_SCOPE}",
        "content": {
            "text/html": {
                "schema": {"type": "string"},
            },
        },
    }


def annotate_operations(spec: dict) -> None:
    """Attach 403, and auth, on the operations whose behavior is known."""
    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            attach_cloudflare(operation)
            if path in LIBRARY_READ_PATHS and method == "get":
                annotate_library_read(path, operation)
            elif path.startswith("/v1/omni_api/"):
                annotate_omni_api(operation)


def attach_cloudflare(operation: dict) -> None:
    """Reference the shared 403 on one operation and keep status codes ordered."""
    responses = dict(operation.get("responses") or {})
    responses["403"] = {"$ref": f"#/components/responses/{CLOUDFLARE_RESPONSE}"}
    operation["responses"] = ordered_responses(responses)


def ordered_responses(responses: dict) -> dict:
    """Sort response codes numerically so 403 sits with the other statuses."""
    def sort_key(code: str):
        """Order numeric status codes before named response keys."""
        return (0, int(code)) if code.isdigit() else (1, code)

    return {code: responses[code] for code in sorted(responses, key=sort_key)}


def annotate_library_read(path: str, operation: dict) -> None:
    """Record #234 auth, pagination, and the job window on one library read."""
    operation["description"] = library_description(path)
    operation["security"] = library_security(path)
    unauthorized = operation["responses"].get("401")
    if not isinstance(unauthorized, dict):
        raise ValueError(f"{path} is missing a 401 response")
    unauthorized["description"] = BAD_HEADER
    annotate_parameters(path, operation)


def library_description(path: str) -> str:
    """Description text for one library read. Shared sentences stay verbatim."""
    common = " ".join((
        HEADER_FORMS,
        MCP_WARNING,
        HEADER_WINS,
        BAD_HEADER,
        OWN_ROWS,
    ))
    if path == JOBS_SESSION_PATH:
        return " ".join((
            common,
            ANONYMOUS_JOBS,
            MEDIA_REJECTS_VISITOR,
            JOB_WINDOW,
            JOB_DOWNSAMPLE,
            JOB_POLL,
            "include_states and exclude_states take comma-separated JobStatusPlus values.",
        ))
    pagination = (
        "page_size defaults to 100 and is capped at 1000. "
        "sort_ascending defaults to false. cursor_is_reversed defaults to false."
    )
    if path == "/v1/media_files/project/list":
        listed = (
            "Lists the caller's saved projects, including 3D Stage scenes. "
            "filter_project_type is scene_3d, mood_board, workflow, video_timeline, or editor_2d."
        )
    elif path == "/v1/media_files/mesh/list":
        listed = "Lists the caller's meshes."
    elif path == "/v1/media_files/splat/list":
        listed = "Lists the caller's splats."
    else:
        raise ValueError(f"not a library read: {path}")
    return " ".join((common, listed, MEDIA_REJECTS_VISITOR, pagination))


def library_security(path: str) -> List[dict]:
    """OpenAPI OR-list for one library read.

    The header-wins rule cannot be expressed as an OR of schemes. The
    operation description states it. The visitor cookie is only on the
    job list, and only when the header is absent.
    """
    schemes = [
        {"apiKey": []},
        {"mcpSession": []},
        {"sessionCookie": []},
    ]
    if path == JOBS_SESSION_PATH:
        schemes.append({"visitorCookie": []})
    return schemes


def annotate_parameters(path: str, operation: dict) -> None:
    """Document defaults for the query parameters this path already declares."""
    expected = ("include_states", "exclude_states") if path == JOBS_SESSION_PATH else _media_params(path)
    for name in expected:
        parameter = require_parameter(operation, name)
        parameter["description"] = PARAMETER_NOTES[name]
        _set_known_default(parameter, name)


def _media_params(path: str) -> Iterable[str]:
    """Query parameter names for a media list. Project adds the type filter."""
    names = ["sort_ascending", "page_size", "cursor", "cursor_is_reversed"]
    if path == "/v1/media_files/project/list":
        names.append("filter_project_type")
    return names


def _set_known_default(parameter: dict, name: str) -> None:
    """Record handler defaults. Parameters without a default are left unset."""
    schema = parameter.setdefault("schema", {})
    if name == "page_size":
        schema["default"] = 100
        schema["maximum"] = 1000
    elif name == "sort_ascending":
        schema["default"] = False
    elif name == "cursor_is_reversed":
        schema["default"] = False


def require_parameter(operation: dict, name: str) -> dict:
    """Return a query parameter, or fail when the upstream export dropped it."""
    for parameter in operation.get("parameters") or []:
        if parameter.get("name") == name and parameter.get("in") == "query":
            return parameter
    operation_id = operation.get("operationId")
    raise ValueError(f"{operation_id} is missing query parameter {name}")


def annotate_omni_api(operation: dict) -> None:
    """Omni API routes take an API key and ignore a session cookie."""
    description = operation.get("description") or operation.get("summary") or ""
    note = f"{OMNI_IGNORES_COOKIE} {HEADER_FORMS} {BAD_HEADER}"
    if note not in description:
        operation["description"] = f"{description}\n\n{note}".strip()
    operation["security"] = [{"apiKey": []}]
    unauthorized = operation["responses"].get("401")
    if isinstance(unauthorized, dict):
        unauthorized["description"] = BAD_HEADER
    else:
        operation["responses"]["401"] = {"description": BAD_HEADER}
    operation["responses"] = ordered_responses(operation["responses"])


def repair_dangling_parameter_refs(spec: dict) -> None:
    """Point unresolved path-parameter refs at a string schema.

    utoipa names some path structs in ``parameters`` without emitting the
    schema. The public spec keeps the URL template's name and a string
    schema so every remaining ``$ref`` resolves.
    """
    schemas = spec["components"]["schemas"]
    for path, operations in spec["paths"].items():
        template_names = re.findall(r"\{([^{}]+)\}", path)
        for operation in operations.values():
            if not isinstance(operation, dict):
                continue
            for parameter in operation.get("parameters") or []:
                schema = parameter.get("schema")
                ref = schema.get("$ref") if isinstance(schema, dict) else None
                ref_name = schema_name(ref) if isinstance(ref, str) else None
                if ref_name is None or ref_name in schemas:
                    continue
                if parameter.get("in") != "path":
                    raise ValueError(f"unresolved non-path ref {schema.get('$ref')} on {path}")
                parameter["schema"] = {"type": "string"}
                if parameter.get("name") == "path" and len(template_names) == 1:
                    parameter["name"] = template_names[0]
                    parameter["description"] = f"Path parameter `{template_names[0]}`."


def prune_schemas(spec: dict) -> None:
    """Keep schemas reachable from the public paths and the shared 403."""
    schemas = spec["components"]["schemas"]
    pending = _refs_under(spec["paths"]) | _refs_under(spec["components"]["responses"])
    keep: Set[str] = set()
    while pending:
        ref = pending.pop()
        name = schema_name(ref)
        if name is None or name in keep:
            continue
        if name not in schemas:
            raise ValueError(f"unresolved schema ref {ref}")
        keep.add(name)
        pending |= _refs_under(schemas[name])
    spec["components"]["schemas"] = {
        name: schema for name, schema in schemas.items() if name in keep
    }


def _refs_under(node) -> Set[str]:
    """Collect every ``$ref`` string under a JSON value."""
    found: Set[str] = set()
    if isinstance(node, dict):
        ref = node.get("$ref")
        if isinstance(ref, str):
            found.add(ref)
        for value in node.values():
            found |= _refs_under(value)
    elif isinstance(node, list):
        for item in node:
            found |= _refs_under(item)
    return found


def schema_name(ref: str) -> Optional[str]:
    """Return the schema name for a components schema ref.

    Non-schema refs are ignored by the pruner.
    """
    prefix = "#/components/schemas/"
    if not ref.startswith(prefix):
        return None
    return ref[len(prefix):].replace("~1", "/").replace("~0", "~")


def assert_public_invariants(spec: dict) -> None:
    """Fail generation when the public spec still discloses a withheld route."""
    rendered = json.dumps(spec)
    for path in spec["paths"]:
        if path_is_withheld(path):
            raise ValueError(f"withheld path remained: {path}")
    lowered = rendered.lower()
    for marker in WITHHELD_MARKERS:
        if marker.lower() in lowered:
            raise ValueError(f"public spec still contains {marker}")
    if "impersonat" in lowered:
        raise ValueError("public spec still contains an impersonation reference")
    contact = spec["info"].get("contact") or {}
    if "email" in contact:
        raise ValueError("public spec contact still has an email")
    for path in LIBRARY_READ_PATHS:
        if path not in spec["paths"]:
            raise ValueError(f"library read disappeared: {path}")
    for path in MEDIA_LIST_PATHS:
        security = spec["paths"][path]["get"]["security"]
        if security != library_security(path):
            raise ValueError(f"media security drifted on {path}")
    jobs_security = spec["paths"][JOBS_SESSION_PATH]["get"]["security"]
    if jobs_security != library_security(JOBS_SESSION_PATH):
        raise ValueError("job list security drifted")


def _check_committed(rendered: str) -> int:
    """Compare the generator output with the committed public spec."""
    if not PUBLIC_PATH.is_file():
        print(f"missing {PUBLIC_PATH.relative_to(REPO_ROOT)}", file=sys.stderr)
        return 1
    committed = PUBLIC_PATH.read_text(encoding="utf-8")
    if committed != rendered:
        print(
            "frontend/api.json drifted from script/openapi/generate_public_openapi.py. "
            "Regenerate it and commit the result.",
            file=sys.stderr,
        )
        return 1
    print("frontend/api.json matches the generator")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
