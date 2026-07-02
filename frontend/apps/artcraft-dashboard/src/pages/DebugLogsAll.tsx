import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { AllDebugLog, DebugLogLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  DebugLogCard,
  getLogLevelBadgeClassName,
} from "@/components/DebugLogCard";
import {
  IconAlertCircle,
  IconBug,
  IconLoader2,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

const PAGE_SIZE = 50;

const ALL_SEVERITIES: DebugLogLevel[] = [
  "error",
  "warn",
  "info",
  "debug",
  "trace",
];

export function DebugLogsAll() {
  usePageTitle("Debug Logs");

  const [logs, setLogs] = useState<AllDebugLog[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [severities, setSeverities] = useState<DebugLogLevel[]>([]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const copy = (value: string, id: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    });
  };

  const loadData = useCallback(
    async (cursor: number | null, append: boolean, levels: DebugLogLevel[]) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const api = new ModerationApi();
        const resp = await api.ListAllDebugLogs({
          severities: levels,
          cursor: cursor ?? undefined,
          limit: PAGE_SIZE,
        });
        if (resp.success && resp.data) {
          const page = resp.data.debug_logs;
          setLogs((prev) => (append ? [...prev, ...page] : page));
          setNextCursor(resp.data.next_cursor);
        } else {
          setError(resp.errorMessage || "Failed to load debug logs");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load debug logs");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [],
  );

  // Initial load + reload on severity filter change.
  useEffect(() => {
    setLogs([]);
    setNextCursor(null);
    loadData(null, false, severities);
  }, [severities, loadData]);

  // Infinite scroll sentinel.
  useEffect(() => {
    observerRef.current?.disconnect();
    if (nextCursor === null) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadData(nextCursor, true, severities);
        }
      },
      { threshold: 0.1 },
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [nextCursor, severities, loadData]);

  const toggleSeverity = (level: DebugLogLevel) => {
    setSeverities((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level],
    );
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconBug className="size-6 text-muted-foreground" />
            Debug Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            All debug logs across the system, most recent first.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/moderation/debug-logs-search"
              title="Search debug logs by event token"
            >
              <IconSearch className="size-4" />
              Search
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(null, false, severities)}
            disabled={isLoading}
          >
            <IconRefresh className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Severity filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Severity:
        </span>
        {ALL_SEVERITIES.map((level) => {
          const active = severities.includes(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleSeverity(level)}
              className="cursor-pointer"
            >
              <Badge
                variant={active ? "secondary" : "outline"}
                className={
                  active
                    ? getLogLevelBadgeClassName(level) + " ring-1 ring-current"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }
              >
                {level.toUpperCase()}
              </Badge>
            </button>
          );
        })}
        {severities.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => setSeverities([])}
          >
            Clear
          </Button>
        )}
      </div>

      {error && !isLoading && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card shadow-sm flex flex-col p-4 gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && logs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <IconBug className="size-10 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">
            {severities.length > 0
              ? "No debug logs match the selected severities."
              : "No debug logs found."}
          </p>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <DebugLogCard
              key={log.id}
              log={log}
              copiedId={copiedId}
              onCopy={copy}
              maybeUser={log.maybe_user}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {nextCursor !== null && !isLoading && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoadingMore && (
            <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
