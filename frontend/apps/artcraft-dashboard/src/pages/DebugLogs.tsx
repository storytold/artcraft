import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { DebugLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DebugLogCard } from "@/components/DebugLogCard";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBug,
  IconCheck,
  IconCopy,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";

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
