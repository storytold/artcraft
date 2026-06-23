import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { DebugLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { humanize } from "@/lib/utils";
import { RawTag } from "@/components/RawTag";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBug,
  IconCheck,
  IconCopy,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

function formatDateTime(iso: string): string {
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

const DEFAULT_LIMIT = 100;

export function DebugLogs() {
  const { eventToken } = useParams<{ eventToken: string }>();
  usePageTitle(eventToken ? `Debug ${eventToken.slice(0, 8)}…` : "Debug Logs");
  const navigate = useNavigate();

  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const copy = (value: string, id: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    });
  };

  const loadLogs = async () => {
    if (!eventToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const api = new ModerationApi();
      const resp = await api.ListDebugLogs(eventToken, DEFAULT_LIMIT);
      if (resp.success && resp.data) {
        setLogs(resp.data.debug_logs);
      } else {
        setError(resp.errorMessage || "Failed to load debug logs");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load debug logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [eventToken]);

  const filteredLogs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(q) ||
        log.debug_log_type.toLowerCase().includes(q),
    );
  }, [logs, filter]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="p-0! h-auto w-auto hover:bg-transparent! text-foreground/70 hover:text-foreground/50"
        >
          <IconArrowLeft className="size-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconBug className="size-6 text-muted-foreground" />
            Debug Logs
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({logs.length})
              </span>
            )}
          </h1>
          {eventToken && (
            <p className="text-muted-foreground text-sm font-mono mt-1 truncate">
              Event {eventToken}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
          >
            <IconRefresh className="size-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(window.location.href, "page_link")}
          >
            {copiedId === "page_link" ? (
              <IconCheck className="size-4 text-emerald-400" />
            ) : (
              <IconCopy className="size-4" />
            )}
            Copy Link
          </Button>
        </div>
      </div>

      {error && !isLoading && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filter */}
      {logs.length > 0 && (
        <div className="relative max-w-md">
          <IconSearch className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card shadow-sm flex flex-col p-4 gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && logs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <IconBug className="size-10 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">
            No debug logs found for this event token.
          </p>
        </div>
      )}

      {!isLoading && filteredLogs.length === 0 && logs.length > 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <p className="text-muted-foreground text-sm">
            No logs match your filter.
          </p>
        </div>
      )}

      {!isLoading && filteredLogs.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredLogs.map((log) => (
            <DebugLogCard
              key={log.id}
              log={log}
              copiedId={copiedId}
              onCopy={copy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DebugLogCardProps {
  log: DebugLog;
  copiedId: string | null;
  onCopy: (value: string, id: string) => void;
}

function DebugLogCard({ log, copiedId, onCopy }: DebugLogCardProps) {
  const [expanded, setExpanded] = useState(true);
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
        <RawTag value={log.debug_log_type} />
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {formatDateTime(log.created_at)}
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
          {log.maybe_creator_user_token && (
            <div className="text-xs text-muted-foreground">
              <span className="uppercase tracking-wider font-medium">
                User Token:
              </span>{" "}
              <span className="font-mono text-foreground/80">
                {log.maybe_creator_user_token}
              </span>
            </div>
          )}
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

function PrettyPayload({ raw }: { raw: string }) {
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
