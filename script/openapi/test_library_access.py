"""Auth and User-Agent outcomes for the four library reads.

Each read is checked with an API key, an MCP session, a bad header, and
a missing header. The header owner wins over another account's cookie.
"""

import unittest

from openapi.library_access import (
    CallerKind,
    EndpointKind,
    HeaderKind,
    LIBRARY_READ_PATHS,
    UserAgentKind,
    classify_user_agent,
    client_response,
    endpoint_kind,
    resolve_library_read,
)

ACCOUNT_A = "account-a"
ACCOUNT_B = "account-b"
VISITOR = "visitor-c"
DESCRIPTIVE_AGENT = "MyTool/1.0 (+https://example.com)"
URLLIB_AGENT = "Python-urllib/3.12"


class LibraryReadTests(unittest.TestCase):
    """The decision table artcraft-services#234 implements."""

    def test_each_read_accepts_its_api_key_owner(self):
        """A valid API key lists that key's account on every library read."""
        for path in LIBRARY_READ_PATHS:
            result = resolve_library_read(
                endpoint_kind(path),
                HeaderKind.API_KEY,
                header_owner=ACCOUNT_A,
                session_owner=ACCOUNT_B,
                visitor_id=VISITOR,
            )
            self.assertEqual(result.status, 200, path)
            self.assertEqual(result.caller, CallerKind.API_KEY_OWNER, path)
            self.assertEqual(result.owner_id, ACCOUNT_A, path)
            self.assertFalse(result.cookie_consulted, path)

    def test_each_read_accepts_its_mcp_session_owner(self):
        """A live MCP session lists that session's account, not the cookie's."""
        for path in LIBRARY_READ_PATHS:
            result = resolve_library_read(
                endpoint_kind(path),
                HeaderKind.MCP_SESSION,
                header_owner=ACCOUNT_A,
                session_owner=ACCOUNT_B,
            )
            self.assertEqual(result.status, 200, path)
            self.assertEqual(result.caller, CallerKind.MCP_OWNER, path)
            self.assertEqual(result.owner_id, ACCOUNT_A, path)
            self.assertFalse(result.cookie_consulted, path)

    def test_bad_header_is_401_and_ignores_a_valid_cookie(self):
        """Malformed, unknown, expired, and banned headers do not fall back."""
        bad = (
            HeaderKind.MALFORMED,
            HeaderKind.UNKNOWN,
            HeaderKind.EXPIRED_OR_REVOKED,
            HeaderKind.BANNED_OWNER,
        )
        for path in LIBRARY_READ_PATHS:
            for header in bad:
                result = resolve_library_read(
                    endpoint_kind(path),
                    header,
                    session_owner=ACCOUNT_B,
                    visitor_id=VISITOR,
                )
                self.assertEqual(result.status, 401, f"{path} {header}")
                self.assertIsNone(result.caller, path)
                self.assertFalse(result.cookie_consulted, path)

    def test_missing_header_uses_the_session_on_every_read(self):
        """With no Authorization header, the website session is the caller."""
        for path in LIBRARY_READ_PATHS:
            result = resolve_library_read(
                endpoint_kind(path),
                HeaderKind.ABSENT,
                session_owner=ACCOUNT_A,
                visitor_id=VISITOR,
            )
            self.assertEqual(result.status, 200, path)
            self.assertEqual(result.caller, CallerKind.SESSION_USER, path)
            self.assertEqual(result.owner_id, ACCOUNT_A, path)
            self.assertTrue(result.cookie_consulted, path)

    def test_missing_header_without_a_session(self):
        """Only the job list accepts an anonymous visitor. Media lists are 401."""
        for path in LIBRARY_READ_PATHS:
            result = resolve_library_read(
                endpoint_kind(path),
                HeaderKind.ABSENT,
                visitor_id=VISITOR,
            )
            if endpoint_kind(path) is EndpointKind.JOBS_SESSION:
                self.assertEqual(result.status, 200, path)
                self.assertEqual(result.caller, CallerKind.ANONYMOUS_VISITOR, path)
                self.assertEqual(result.owner_id, VISITOR, path)
            else:
                self.assertEqual(result.status, 401, path)
                self.assertIsNone(result.caller, path)
            self.assertTrue(result.cookie_consulted, path)

    def test_missing_header_and_missing_cookie_is_401(self):
        """No header and no cookie is 401 on every library read."""
        for path in LIBRARY_READ_PATHS:
            result = resolve_library_read(endpoint_kind(path), HeaderKind.ABSENT)
            self.assertEqual(result.status, 401, path)
            self.assertIsNone(result.owner_id, path)


class UserAgentTests(unittest.TestCase):
    """403 for a library default is decided before the key. A bad key is 401."""

    def test_library_default_is_403_before_a_valid_key(self):
        """Python urllib is 403 and the key is not checked."""
        library = resolve_library_read(
            EndpointKind.MEDIA_LIST,
            HeaderKind.API_KEY,
            header_owner=ACCOUNT_A,
        )
        response = client_response(URLLIB_AGENT, library)
        self.assertEqual(response.status, 403)
        self.assertFalse(response.key_checked)
        self.assertIsNone(response.library)
        self.assertEqual(response.user_agent, UserAgentKind.LIBRARY_DEFAULT)

    def test_library_default_stays_403_when_the_key_is_invalid(self):
        """A blocked agent does not become 401 just because the key is bad."""
        library = resolve_library_read(EndpointKind.JOBS_SESSION, HeaderKind.UNKNOWN)
        response = client_response("python-urllib/3.11", library)
        self.assertEqual(response.status, 403)
        self.assertFalse(response.key_checked)

    def test_descriptive_agent_reaches_auth(self):
        """A descriptive agent with a valid key is 200. A bad key is 401."""
        success = resolve_library_read(
            EndpointKind.MEDIA_LIST,
            HeaderKind.API_KEY,
            header_owner=ACCOUNT_A,
        )
        failure = resolve_library_read(EndpointKind.MEDIA_LIST, HeaderKind.UNKNOWN)
        ok = client_response(DESCRIPTIVE_AGENT, success)
        rejected = client_response(DESCRIPTIVE_AGENT, failure)
        self.assertEqual(ok.status, 200)
        self.assertTrue(ok.key_checked)
        self.assertEqual(ok.library.owner_id, ACCOUNT_A)
        self.assertEqual(rejected.status, 401)
        self.assertTrue(rejected.key_checked)
        self.assertEqual(rejected.user_agent, UserAgentKind.DESCRIPTIVE)

    def test_missing_user_agent_is_not_the_verified_1010_block(self):
        """An empty agent is classified as missing and the key is still checked."""
        library = resolve_library_read(
            EndpointKind.JOBS_SESSION,
            HeaderKind.API_KEY,
            header_owner=ACCOUNT_A,
        )
        for agent in (None, "", "   "):
            self.assertEqual(classify_user_agent(agent), UserAgentKind.MISSING)
            response = client_response(agent, library)
            self.assertEqual(response.status, 200)
            self.assertTrue(response.key_checked)
            self.assertEqual(response.user_agent, UserAgentKind.MISSING)


if __name__ == "__main__":
    unittest.main()
