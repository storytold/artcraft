"""Who a library read lists, and when Cloudflare answers 403 first.

This is the decision table in artcraft-services#234
(``require_library_user_token``, ``require_any_session_or_key``, and
``list_session_jobs_handler``) plus the User-Agent rule from
storytold/artcraft#2676. The public spec describes these outcomes. It
does not reimplement the server.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class HeaderKind(Enum):
    """The Authorization header, if the request has one."""

    ABSENT = "absent"
    API_KEY = "api_key"
    MCP_SESSION = "mcp_session"
    MALFORMED = "malformed"
    UNKNOWN = "unknown"
    EXPIRED_OR_REVOKED = "expired_or_revoked"
    BANNED_OWNER = "banned_owner"


class EndpointKind(Enum):
    """The two library-read shapes #234 authenticates differently."""

    MEDIA_LIST = "media_list"
    JOBS_SESSION = "jobs_session"


class CallerKind(Enum):
    """Which credential owned the rows a successful read returns."""

    API_KEY_OWNER = "api_key_owner"
    MCP_OWNER = "mcp_owner"
    SESSION_USER = "session_user"
    ANONYMOUS_VISITOR = "anonymous_visitor"


class UserAgentKind(Enum):
    """How Cloudflare treats the User-Agent before the API key is checked."""

    DESCRIPTIVE = "descriptive"
    LIBRARY_DEFAULT = "library_default"
    MISSING = "missing"


@dataclass(frozen=True)
class LibraryReadResult:
    """The auth outcome after Cloudflare has already accepted the agent."""

    status: int
    caller: Optional[CallerKind]
    owner_id: Optional[str]
    cookie_consulted: bool


@dataclass(frozen=True)
class ClientResponse:
    """The status a client observes, including the edge User-Agent check."""

    status: int
    key_checked: bool
    user_agent: UserAgentKind
    library: Optional[LibraryReadResult]


MEDIA_LIST_PATHS = (
    "/v1/media_files/project/list",
    "/v1/media_files/mesh/list",
    "/v1/media_files/splat/list",
)

JOBS_SESSION_PATH = "/v1/jobs/session"

LIBRARY_READ_PATHS = MEDIA_LIST_PATHS + (JOBS_SESSION_PATH,)


def endpoint_kind(path: str) -> EndpointKind:
    """Map a public library path to the auth shape #234 implements."""
    if path in MEDIA_LIST_PATHS:
        return EndpointKind.MEDIA_LIST
    if path == JOBS_SESSION_PATH:
        return EndpointKind.JOBS_SESSION
    raise ValueError(f"not a library read: {path}")


def classify_user_agent(user_agent: Optional[str]) -> UserAgentKind:
    """Classify the agent Cloudflare sees in front of api.storyteller.ai.

    The verified 1010 block is a library-default agent. Python urllib's
    default (``Python-urllib/...``) is the one named in
    storytold/artcraft#2676. A missing or empty value is not that block.
    """
    if user_agent is None or user_agent.strip() == "":
        return UserAgentKind.MISSING
    if "python-urllib/" in user_agent.lower():
        return UserAgentKind.LIBRARY_DEFAULT
    return UserAgentKind.DESCRIPTIVE


def resolve_library_read(
    endpoint: EndpointKind,
    header: HeaderKind,
    header_owner: Optional[str] = None,
    session_owner: Optional[str] = None,
    visitor_id: Optional[str] = None,
) -> LibraryReadResult:
    """Resolve whose rows a library read may return.

    A present Authorization header is the only credential. A bad header
    is 401 and neither the session cookie nor the visitor cookie is
    consulted. With no header, the project, mesh, and splat lists require
    the website session. The job list uses that session, then the
    anonymous visitor cookie, then 401.
    """
    if header is not HeaderKind.ABSENT:
        return _resolve_header(header, header_owner)

    if session_owner is not None:
        return LibraryReadResult(
            status=200,
            caller=CallerKind.SESSION_USER,
            owner_id=session_owner,
            cookie_consulted=True,
        )
    if endpoint is EndpointKind.JOBS_SESSION and visitor_id is not None:
        return LibraryReadResult(
            status=200,
            caller=CallerKind.ANONYMOUS_VISITOR,
            owner_id=visitor_id,
            cookie_consulted=True,
        )
    return LibraryReadResult(
        status=401,
        caller=None,
        owner_id=None,
        cookie_consulted=True,
    )


def client_response(
    user_agent: Optional[str],
    library: LibraryReadResult,
) -> ClientResponse:
    """Apply the edge User-Agent rule before the library auth result.

    A library-default agent is 403 and the key is not checked. Any other
    agent, including a missing one, reaches the auth result.
    """
    kind = classify_user_agent(user_agent)
    if kind is UserAgentKind.LIBRARY_DEFAULT:
        return ClientResponse(
            status=403,
            key_checked=False,
            user_agent=kind,
            library=None,
        )
    return ClientResponse(
        status=library.status,
        key_checked=True,
        user_agent=kind,
        library=library,
    )


def _resolve_header(header: HeaderKind, header_owner: Optional[str]) -> LibraryReadResult:
    """Resolve a present Authorization header. Cookies are not consulted."""
    if header is HeaderKind.API_KEY:
        return LibraryReadResult(
            status=200,
            caller=CallerKind.API_KEY_OWNER,
            owner_id=header_owner,
            cookie_consulted=False,
        )
    if header is HeaderKind.MCP_SESSION:
        return LibraryReadResult(
            status=200,
            caller=CallerKind.MCP_OWNER,
            owner_id=header_owner,
            cookie_consulted=False,
        )
    return LibraryReadResult(
        status=401,
        caller=None,
        owner_id=None,
        cookie_consulted=False,
    )
