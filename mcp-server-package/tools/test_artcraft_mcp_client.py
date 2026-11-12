#!/usr/bin/env python3
"""Integration test: spawn the real artcraft-mcp binary over stdio and
exercise the protocol surface the tool scripts depend on.

Run:  PYTHONUTF8=1 python test_artcraft_mcp_client.py
Requires a built binary (cargo build -p artcraft-mcp) or ARTCRAFT_MCP_PATH.
Network-free: no tool that hits the ArtCraft API is invoked here.
"""

import json
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SCHEMAS_DIR = Path(__file__).resolve().parent.parent / "schemas"

from artcraft_mcp_client import (
    McpClient,
    McpError,
    extract_token,
    find_mcp_executable,
    parse_status_line,
)


class TestProtocol(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not find_mcp_executable():
            raise unittest.SkipTest("artcraft-mcp binary not found; build it first")
        cls.client = McpClient(client_name="artcraft-python-tests")

    @classmethod
    def tearDownClass(cls):
        cls.client.close()

    def test_initialize_returns_server_info(self):
        info = self.client.server_info
        self.assertEqual(info.get("name"), "artcraft-mcp")

    def test_tools_list_has_expected_surface(self):
        res = self.client.send_request("tools/list", {})
        tools = res["result"]["tools"]
        names = {t["name"] for t in tools}
        self.assertGreaterEqual(len(tools), 60)
        for required in (
            "artcraft_generate_video",
            "artcraft_upload_image",
            "artcraft_get_job_status",
            "artcraft_download_media_file",
            "artcraft_estimate_cost",
            "artcraft_terminate_job",
        ):
            self.assertIn(required, names)

    def test_tool_schemas_are_objects(self):
        res = self.client.send_request("tools/list", {})
        for t in res["result"]["tools"]:
            schema = t.get("inputSchema") or {}
            self.assertEqual(schema.get("type"), "object", t["name"])

    def test_paid_tool_without_confirm_is_rejected(self):
        # No network hit: the confirm gate fires before any API call.
        res = self.client.send_request(
            "tools/call",
            {"name": "artcraft_generate_video", "arguments": {"model": "seedance_2p0", "prompt": "x"}},
        )
        result = res.get("result", {})
        self.assertTrue(result.get("isError"), "expected isError for missing confirm")

    def test_unknown_tool_returns_error(self):
        res = self.client.send_request(
            "tools/call", {"name": "artcraft_no_such_tool", "arguments": {}}
        )
        result = res.get("result", {})
        self.assertTrue(result.get("isError"))

    def test_call_tool_raises_on_is_error(self):
        with self.assertRaises(McpError):
            self.client.call_tool("artcraft_no_such_tool")

    def test_call_with_no_arguments_field_defaults(self):
        # tools/call with arguments omitted entirely must not fail
        res = self.client.send_request("tools/call", {"name": "artcraft_get_session_info"})
        self.assertIn("result", res)

    def test_stderr_drain_does_not_deadlock(self):
        # Several sequential calls; if stderr were left in a full pipe the
        # server would block writing logs. Reaching this assert is the test.
        for _ in range(3):
            self.client.send_request("tools/list", {})
        self.assertTrue(True)


class TestSchemaParity(unittest.TestCase):
    """schemas/*.json must match the server's live tools/list exactly —
    same tool set, same inputSchema. Regenerate with schemas/generate_schemas.py."""

    @classmethod
    def setUpClass(cls):
        if not find_mcp_executable():
            raise unittest.SkipTest("artcraft-mcp binary not found; build it first")
        client = McpClient(client_name="artcraft-schema-parity-test")
        try:
            res = client.send_request("tools/list", {})
            cls.live = {t["name"]: t for t in res["result"]["tools"]}
        finally:
            client.close()

    def test_schema_files_cover_exactly_the_live_tools(self):
        on_disk = {p.stem for p in SCHEMAS_DIR.glob("artcraft_*.json")}
        self.assertEqual(on_disk, set(self.live.keys()),
                         f"schema/tool mismatch: extra={on_disk - set(self.live)} missing={set(self.live) - on_disk}")

    def test_each_schema_matches_live_definition(self):
        for name, tool in self.live.items():
            path = SCHEMAS_DIR / f"{name}.json"
            doc = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(doc["name"], name)
            self.assertEqual(doc["description"], tool.get("description", ""), name)
            self.assertEqual(doc["inputSchema"], tool.get("inputSchema"), name)


class TestHelpers(unittest.TestCase):
    def test_token_extraction(self):
        text = "Job token: jinf_abc123XYZ\nMedia token: m_def456"
        self.assertEqual(extract_token("job", text), "jinf_abc123XYZ")
        self.assertEqual(extract_token("media", text), "m_def456")

    def test_parse_status_line(self):
        self.assertEqual(parse_status_line("Job: jinf_x\nStatus: complete_success\nProgress: 100%"), "complete_success")
        self.assertEqual(parse_status_line("no status"), "unknown")


if __name__ == "__main__":
    unittest.main(verbosity=2)
