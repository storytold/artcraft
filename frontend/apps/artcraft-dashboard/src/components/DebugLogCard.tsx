import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { humanize } from "@/lib/utils";
import { RawTag } from "@/components/RawTag";
import type { DebugLog, DebugLogUser } from "@/types";
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconUser,
} from "@tabler/icons-react";

export function formatDebugLogDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getLogTypeBadgeProps(logType: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  switch (logType) {
    case "http_request":
      return {
        variant: "secondary",
        className: "bg-blue-500/10 text-blue-400 border-transparent",
      };
    case "fal_request":
      return {
        variant: "secondary",
        className: "bg-purple-500/10 text-purple-400 border-transparent",
      };
    case "fal_queue":
      return {
        variant: "secondary",
        className: "bg-fuchsia-500/10 text-fuchsia-400 border-transparent",
      };
    case "fal_webhook":
      return {
        variant: "secondary",
        className: "bg-amber-500/10 text-amber-400 border-transparent",
      };
    case "kinovi_request":
      return {
        variant: "secondary",
        className: "bg-cyan-500/10 text-cyan-400 border-transparent",
      };
    default:
      return { variant: "outline", className: "text-muted-foreground" };
  }
}

export function getLogLevelBadgeClassName(level: string): string {
  switch (level) {
    case "error":
      return "bg-red-500/10 text-red-400 border-transparent";
    case "warn":
      return "bg-amber-500/10 text-amber-400 border-transparent";
    case "info":
      return "bg-sky-500/10 text-sky-400 border-transparent";
    case "debug":
      return "bg-slate-500/10 text-slate-400 border-transparent";
    case "trace":
      return "bg-zinc-500/10 text-zinc-400 border-transparent";
    default:
      return "text-muted-foreground";
  }
}

export interface DebugLogCardProps {
  log: DebugLog;
  copiedId: string | null;
  onCopy: (value: string, id: string) => void;
  /** Joined creator user info (list-all page). */
  maybeUser?: DebugLogUser | null;
  /** Start expanded (defaults to true). */
  defaultExpanded?: boolean;
}

export function DebugLogCard({
  log,
  copiedId,
  onCopy,
  maybeUser,
  defaultExpanded = true,
}: DebugLogCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const badge = getLogTypeBadgeProps(log.debug_log_type);
  const copyId = `log_${log.id}`;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {expanded ? (
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <Badge variant={badge.variant} className={badge.className}>
          {humanize(log.debug_log_type)}
        </Badge>
        {log.maybe_log_level && (
          <Badge
            variant="secondary"
            className={getLogLevelBadgeClassName(log.maybe_log_level)}
          >
            {log.maybe_log_level.toUpperCase()}
          </Badge>
        )}
        <RawTag value={log.debug_log_type} />
        {maybeUser && (
          <span
            className="inline-flex items-center gap-1 text-xs text-muted-foreground min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <IconUser className="size-3.5 shrink-0" />
            <Link
              to={`/user/profile/${encodeURIComponent(maybeUser.username)}`}
              className="hover:underline text-foreground/80 truncate"
              title={maybeUser.username}
            >
              {maybeUser.display_name}
            </Link>
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {formatDebugLogDateTime(log.created_at)}
        </span>
        <span className="text-xs text-muted-foreground/60 font-mono ml-auto">
          #{log.id}
        </span>
        <span
          className="ml-2 inline-flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(log.message, copyId);
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Copy payload"
          >
            {copiedId === copyId ? (
              <IconCheck className="size-3.5 text-emerald-400" />
            ) : (
              <IconCopy className="size-3.5" />
            )}
          </Button>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <div>
              <span className="uppercase tracking-wider font-medium">
                Event:
              </span>{" "}
              <Link
                to={`/moderation/debug-logs/${encodeURIComponent(log.event_token)}`}
                className="font-mono text-foreground/80 hover:underline"
              >
                {log.event_token}
              </Link>
            </div>
            {log.maybe_creator_user_token && (
              <div>
                <span className="uppercase tracking-wider font-medium">
                  User Token:
                </span>{" "}
                <Link
                  to={`/debug_logs/user/${encodeURIComponent(log.maybe_creator_user_token)}`}
                  className="font-mono text-foreground/80 hover:underline"
                  title="View this user's debug logs"
                >
                  {log.maybe_creator_user_token}
                </Link>
              </div>
            )}
          </div>
          <PrettyPayload raw={log.message} />
        </div>
      )}
    </div>
  );
}

function tryParseJson(raw: string): unknown | undefined {
  const trimmed = raw.trim();
  if (
    !(
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    )
  ) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export function PrettyPayload({ raw }: { raw: string }) {
  const parsed = useMemo(() => tryParseJson(raw), [raw]);

  if (parsed !== undefined) {
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 p-4 rounded-lg max-h-[600px] overflow-auto text-foreground/90">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  }

  // Likely a Rust struct debug print or plain text. Re-indent loosely so it's readable.
  const formatted = formatRustyDebug(raw);
  return (
    <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 p-4 rounded-lg max-h-[600px] overflow-auto text-foreground/80">
      {formatted}
    </pre>
  );
}

// Lightweight reformatter for Rust's `Debug` output (e.g. `Foo { a: 1, b: Bar { c: 2 } }`).
// Adds line breaks and indentation around `{`, `}`, `[`, `]`, and top-level commas.
// Falls back gracefully for anything it doesn't understand.
function formatRustyDebug(raw: string): string {
  const looksRusty = /[{[].+[}\]]/s.test(raw);
  if (!looksRusty) return raw;

  let depth = 0;
  let out = "";
  let inString = false;
  let stringChar: '"' | "'" | null = null;

  const indent = () => "    ".repeat(depth);

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const prev = raw[i - 1];

    // String tracking (handle escapes)
    if (inString) {
      out += ch;
      if (ch === stringChar && prev !== "\\") {
        inString = false;
        stringChar = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      out += ch;
      continue;
    }

    if (ch === "{" || ch === "[") {
      depth++;
      out += ch + "\n" + indent();
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth = Math.max(0, depth - 1);
      out = out.replace(/[ \t]+$/, "");
      out += "\n" + indent() + ch;
      continue;
    }
    if (ch === "," && depth > 0) {
      out += ",\n" + indent();
      // Skip following whitespace
      while (i + 1 < raw.length && raw[i + 1] === " ") i++;
      continue;
    }

    out += ch;
  }

  return out.trim();
}
