"""Sentences the public spec and the Omni API guide must share.

artcraft-services#234 is the auth behavior. These sentences are the
contract between that behavior, ``frontend/api.json``, and
``_docs/artcraft_omni_api.md``. Keep each sentence contiguous in both
places.
"""

MCP_WARNING = (
    "An MCP session token is a full account-read credential. "
    "Store it securely and revoke it or let it expire."
)

HEADER_WINS = (
    "When an Authorization header and a session or visitor cookie are both present, "
    "the header wins and the cookie is ignored."
)

BAD_HEADER = "A bad Authorization header is 401 and does not fall back to a cookie."

CLOUDFLARE_1010 = (
    "Cloudflare answers 403 error 1010 before the API key is checked when the "
    "User-Agent is a library default. Python urllib's default is one. "
    "The body is not the JSON error envelope."
)

MISSING_USER_AGENT = (
    "A missing or empty User-Agent is not the verified 1010 block. "
    "Send a descriptive User-Agent on every request."
)

USER_AGENT_SCOPE = (
    "The rule applies to image generation, uploads, job status, and library reads."
)

JOB_WINDOW = "GET /v1/jobs/session lists at most 100 jobs from the last 36 hours."

JOB_POLL = "Poll GET /v1/jobs/session about every 5 seconds."

JOB_DOWNSAMPLE = (
    "Jobs the caller has dismissed are omitted. "
    "Non-audio complete_success rows are then limited to three so an uncleared "
    "success list stays short. Audio successes are kept."
)

MEDIA_REJECTS_VISITOR = (
    "The project, mesh, and splat lists do not accept the visitor cookie."
)

ANONYMOUS_JOBS = (
    "With no Authorization header, GET /v1/jobs/session still lists an anonymous "
    "visitor's own jobs from the visitor cookie."
)

OWN_ROWS = "The rows are the caller's own. A key does not read another account."

OMNI_IGNORES_COOKIE = "A session cookie is ignored on this route."

HEADER_FORMS = (
    "Accepted Authorization forms are Bearer, Key, and the bare credential."
)

GUIDE_SENTENCES = (
    MCP_WARNING,
    HEADER_WINS,
    BAD_HEADER,
    CLOUDFLARE_1010,
    MISSING_USER_AGENT,
    USER_AGENT_SCOPE,
    JOB_WINDOW,
    JOB_POLL,
    JOB_DOWNSAMPLE,
    MEDIA_REJECTS_VISITOR,
    ANONYMOUS_JOBS,
    OWN_ROWS,
    OMNI_IGNORES_COOKIE,
    HEADER_FORMS,
)
