"""The committed public spec matches the generator, the guide, and #234."""

import json
import unittest

from openapi.contract_text import GUIDE_SENTENCES
from openapi.generate_public_openapi import (
    CLOUDFLARE_RESPONSE,
    PUBLIC_PATH,
    PUBLIC_SPEC_VERSION,
    REPO_ROOT,
    UPSTREAM_PATH,
    assert_public_invariants,
    build_public_spec,
    path_is_withheld,
    render_public_document,
)
from openapi.library_access import JOBS_SESSION_PATH, LIBRARY_READ_PATHS, MEDIA_LIST_PATHS

GUIDE_PATH = REPO_ROOT / "_docs" / "artcraft_omni_api.md"
NETLIFY_PATH = REPO_ROOT / "script" / "netlify_build_docs.sh"

MEDIA_QUERY = ("sort_ascending", "page_size", "cursor", "cursor_is_reversed")
PROJECT_QUERY = MEDIA_QUERY + ("filter_project_type",)
JOB_QUERY = ("include_states", "exclude_states")

WITHHELD_SAMPLES = (
    "/v1/internal/minimax_jobs/obtain_job",
    "/v1/internal/minimax_jobs/job/{job_token}/success",
    "/v1/internal/minimax_jobs/job/{job_token}/failure",
    "/moderation/user_bans/manage_ban",
    "/v1/moderation/user_sessions/impersonate",
    "/v1/moderation/user_sessions/impersonation_requests/list",
    "/v1/session_token",
    "/v1/image_studio/update_job_status",
)


class PublicSpecTests(unittest.TestCase):
    """Structural checks on the generated document."""

    @classmethod
    def setUpClass(cls):
        """Load the upstream export once and render the public spec twice."""
        cls.upstream = json.loads(UPSTREAM_PATH.read_text(encoding="utf-8"))
        cls.spec = build_public_spec(cls.upstream)
        cls.rendered = render_public_document()
        cls.again = render_public_document()

    def test_generation_is_deterministic_and_committed(self):
        """The committed frontend/api.json is exactly the generator output."""
        self.assertEqual(self.rendered, self.again)
        self.assertEqual(PUBLIC_PATH.read_text(encoding="utf-8"), self.rendered)
        parsed = json.loads(self.rendered)
        self.assertEqual(parsed["openapi"], "3.1.0")

    def test_info_servers_and_contact(self):
        """The published info block is filled in and has no personal email."""
        info = self.spec["info"]
        self.assertEqual(info["title"], "ArtCraft API")
        self.assertEqual(info["version"], PUBLIC_SPEC_VERSION)
        self.assertTrue(info["description"].strip())
        self.assertTrue(info["license"]["name"].strip())
        self.assertNotIn("email", info["contact"])
        self.assertEqual(
            [server["url"] for server in self.spec["servers"]],
            ["https://api.storyteller.ai", "http://localhost:12345"],
        )
        assert_public_invariants(self.spec)

    def test_withheld_routes_are_removed_and_were_in_the_upstream(self):
        """Internal, moderation, impersonation, session-token, and job-status routes stay out."""
        for path in WITHHELD_SAMPLES:
            self.assertIn(path, self.upstream["paths"], path)
            self.assertTrue(path_is_withheld(path), path)
            self.assertNotIn(path, self.spec["paths"], path)
        rendered = json.dumps(self.spec).lower()
        self.assertNotIn("bt@brand.io", rendered)
        self.assertNotIn("brandon thomas", rendered)
        self.assertNotIn("impersonat", rendered)

    def test_security_schemes_match_the_library_reads(self):
        """Bearer API key, MCP session, session cookie, and visitor cookie."""
        schemes = self.spec["components"]["securitySchemes"]
        self.assertEqual(
            set(schemes),
            {"apiKey", "mcpSession", "sessionCookie", "visitorCookie"},
        )
        self.assertEqual(schemes["apiKey"]["scheme"], "bearer")
        self.assertEqual(schemes["mcpSession"]["scheme"], "bearer")
        self.assertEqual(schemes["mcpSession"]["bearerFormat"], "mcp_session")
        self.assertEqual(schemes["sessionCookie"]["name"], "session")
        self.assertEqual(schemes["visitorCookie"]["name"], "visitor")
        for path in MEDIA_LIST_PATHS:
            security = self.spec["paths"][path]["get"]["security"]
            self.assertEqual(
                security,
                [{"apiKey": []}, {"mcpSession": []}, {"sessionCookie": []}],
                path,
            )
        jobs = self.spec["paths"][JOBS_SESSION_PATH]["get"]["security"]
        self.assertEqual(
            jobs,
            [{"apiKey": []}, {"mcpSession": []}, {"sessionCookie": []}, {"visitorCookie": []}],
        )

    def test_omni_api_is_api_key_only(self):
        """Omni API operations require the API key and ignore a session cookie."""
        found = False
        for path, operations in self.spec["paths"].items():
            if not path.startswith("/v1/omni_api/"):
                continue
            found = True
            for method, operation in operations.items():
                if method == "parameters":
                    continue
                self.assertEqual(operation["security"], [{"apiKey": []}], path)
                self.assertIn("A session cookie is ignored on this route.", operation["description"])
        self.assertTrue(found)

    def test_every_operation_documents_403_error_1010(self):
        """Cloudflare's non-JSON 403 is a shared response on every operation."""
        response = self.spec["components"]["responses"][CLOUDFLARE_RESPONSE]
        self.assertIn("403 error 1010", response["description"])
        self.assertIn("text/html", response["content"])
        seen = 0
        for operations in self.spec["paths"].values():
            for method, operation in operations.items():
                if method == "parameters" or not isinstance(operation, dict):
                    continue
                seen += 1
                cloudflare = operation["responses"]["403"]
                self.assertEqual(
                    cloudflare["$ref"],
                    f"#/components/responses/{CLOUDFLARE_RESPONSE}",
                )
        self.assertGreater(seen, 0)

    def test_library_parameters_and_sentences(self):
        """The spec lists the query parameters and the auth sentences the guide uses."""
        rendered = _flat(json.dumps(self.spec))
        for sentence in GUIDE_SENTENCES:
            self.assertIn(_flat(sentence), rendered, sentence)
        self._assert_query_names(self.spec["paths"]["/v1/media_files/project/list"]["get"], PROJECT_QUERY)
        self._assert_query_names(self.spec["paths"]["/v1/media_files/mesh/list"]["get"], MEDIA_QUERY)
        self._assert_query_names(self.spec["paths"]["/v1/media_files/splat/list"]["get"], MEDIA_QUERY)
        self._assert_query_names(self.spec["paths"][JOBS_SESSION_PATH]["get"], JOB_QUERY)
        page_size = _query(self.spec["paths"]["/v1/media_files/mesh/list"]["get"], "page_size")
        self.assertEqual(page_size["schema"]["default"], 100)
        self.assertNotIn("maximum", page_size["schema"])
        self.assertIn("capped at 1000", page_size["description"])
        sort_ascending = _query(self.spec["paths"]["/v1/media_files/splat/list"]["get"], "sort_ascending")
        self.assertIs(sort_ascending["schema"]["default"], False)

    def test_path_parameters_match_the_url_template(self):
        """Every path parameter is a required template name, and bodies are not path params."""
        for path, operations in self.spec["paths"].items():
            template = [part[1:-1] for part in path.split("/") if part.startswith("{") and part.endswith("}")]
            for method, operation in operations.items():
                if not isinstance(operation, dict) or method == "parameters":
                    continue
                names = [
                    parameter["name"]
                    for parameter in operation.get("parameters") or []
                    if parameter.get("in") == "path"
                ]
                self.assertEqual(names, template, f"{method} {path}")
                for parameter in operation.get("parameters") or []:
                    if parameter.get("in") == "path":
                        self.assertTrue(parameter["required"], path)
        google = self.spec["paths"]["/v1/accounts/google_sso"]["post"]
        self.assertNotIn("parameters", google)
        self.assertIn("requestBody", google)
        cover = self.spec["paths"]["/v1/media_files/cover_image/{token}"]["post"]
        token = [parameter for parameter in cover["parameters"] if parameter["in"] == "path"][0]
        self.assertEqual(token["name"], "token")
        self.assertIn("$ref", token["schema"])
        comments = self.spec["paths"]["/v1/comments/list/{entity_type}/{entity_token}"]["get"]
        comment_names = [parameter["name"] for parameter in comments["parameters"] if parameter["in"] == "path"]
        self.assertEqual(comment_names, ["entity_type", "entity_token"])
        for path in (
            "/v1/omni_api/upload/audio",
            "/v1/omni_api/upload/image",
            "/v1/omni_api/upload/video",
            "/v1/media_files/upload/audio",
        ):
            body = self.spec["paths"][path]["post"]["requestBody"]
            self.assertIn("multipart/form-data", body["content"], path)
            self.assertIn("$ref", body["content"]["multipart/form-data"]["schema"], path)
        weights = self.spec["paths"]["/v1/weights/search"]["get"]
        weight_names = [parameter["name"] for parameter in weights.get("parameters") or []]
        self.assertIn("search_term", weight_names)

    def test_dangling_utoipa_path_refs_become_string_parameters(self):
        """Path structs utoipa did not emit are the URL template name, as a string."""
        token = self.spec["paths"]["/v1/omni_api/job_status/job/{token}"]["get"]["parameters"][0]
        job = self.spec["paths"]["/v1/media_files/by_job/{job_token}"]["get"]["parameters"][0]
        self.assertEqual(token["name"], "token")
        self.assertEqual(token["in"], "path")
        self.assertEqual(token["schema"], {"type": "string"})
        self.assertEqual(job["name"], "job_token")
        self.assertEqual(job["schema"], {"type": "string"})

    def test_refs_resolve_and_withheld_schemas_are_gone(self):
        """Every $ref points at a schema that is still in the document."""
        self._walk_refs(self.spec)
        names = self.spec["components"]["schemas"]
        for banned in (
            "SessionTokenInfoSuccessResponse",
            "ModerationImpersonateRequest",
            "ObtainMinimaxJobRequest",
            "UpdateGptImageJobStatusRequest",
            "ModerationBanUserRequest",
        ):
            self.assertNotIn(banned, names)
        self.assertLess(len(names), len(self.upstream["components"]["schemas"]))

    def test_guide_matches_the_spec_contract(self):
        """The Omni API guide carries the same sentences and does not hide cookies."""
        guide = _flat(GUIDE_PATH.read_text(encoding="utf-8"))
        for sentence in GUIDE_SENTENCES:
            self.assertIn(_flat(sentence), guide, sentence)
        for path in LIBRARY_READ_PATHS:
            self.assertIn(path, guide, path)
        for name in PROJECT_QUERY + JOB_QUERY:
            self.assertIn(name, guide, name)
        self.assertIn("Authorization: Bearer", guide)
        self.assertIn("User-Agent: MyTool/1.0 (+https://example.com)", guide)
        self.assertNotIn("**Do not send cookies.**", guide)
        self.assertNotIn("bt@brand.io", guide)

    def test_docs_build_publishes_the_public_spec_only(self):
        """Netlify copies frontend/api.json and checks the generator first."""
        script = NETLIFY_PATH.read_text(encoding="utf-8")
        self.assertIn("generate_public_openapi.py --check", script)
        copies = [line.strip() for line in script.splitlines() if line.strip().startswith("cp ")]
        self.assertIn("cp ./frontend/api.json ./build/api.json", copies)
        self.assertFalse(any("upstream" in line for line in copies))

    def _assert_query_names(self, operation, names):
        """The operation's query parameters are exactly ``names``, in that order."""
        found = [
            parameter["name"]
            for parameter in operation["parameters"]
            if parameter.get("in") == "query"
        ]
        self.assertEqual(found, list(names))

    def _walk_refs(self, node):
        """Fail when a $ref does not resolve inside this document."""
        if isinstance(node, dict):
            ref = node.get("$ref")
            if isinstance(ref, str):
                self.assertTrue(ref.startswith("#/"), ref)
                self.assertIsNotNone(_lookup(self.spec, ref), ref)
            for value in node.values():
                self._walk_refs(value)
        elif isinstance(node, list):
            for item in node:
                self._walk_refs(item)


def _flat(text):
    """Collapse whitespace so a wrapped sentence still matches the contract."""
    return " ".join(text.split())


def _query(operation, name):
    """Return the query parameter named ``name``."""
    for parameter in operation["parameters"]:
        if parameter.get("name") == name and parameter.get("in") == "query":
            return parameter
    raise AssertionError(name)


def _lookup(spec, ref):
    """Resolve a local JSON pointer, or return None."""
    if not ref.startswith("#/"):
        return None
    current = spec
    for part in ref[2:].split("/"):
        part = part.replace("~1", "/").replace("~0", "~")
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


if __name__ == "__main__":
    unittest.main()
