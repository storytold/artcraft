import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { StaffAuditLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useTableHeight } from "@/hooks/useTableHeight";
import {
  IconAlertCircle,
  IconClipboardList,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export function StaffAuditLogs() {
  usePageTitle("Staff Audit Logs");
  const [logs, setLogs] = useState<StaffAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadData = async (cursor?: string | null, append = false) => {
    if (!append) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const modApi = new ModerationApi();
      const resp = await modApi.ListStaffAuditLogs(cursor);

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setLogs((prev) =>
          append ? [...prev, ...resp.data!.audit_logs] : resp.data!.audit_logs,
        );
        setNextCursor(resp.data.next_cursor);
      } else {
        setError(resp.errorMessage || "Failed to load audit logs");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load audit logs");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = () => {
    setLogs([]);
    setNextCursor(null);
    loadData();
  };

  useEffect(() => {
    cancelledRef.current = false;
    loadData();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && nextCursor != null) {
      loadData(nextCursor, true);
    }
  }, [nextCursor, isLoadingMore]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  const { ref: tableRef, height: tableHeight } = useTableHeight();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconClipboardList className="size-6 text-muted-foreground" />
            Staff Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Every moderator action, newest first
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <IconRefresh
            className={`size-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div ref={tableRef}>
          {isLoading ? (
            <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">Staff</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Target</TableHead>
                  <TableHead className="text-xs">Entity</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconClipboardList className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No audit logs yet.</p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">Staff</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Target</TableHead>
                  <TableHead className="text-xs">Entity</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.token} className="group">
                    <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {log.staff_username ? (
                        <Link
                          to={`/user/profile/${log.staff_username}`}
                          className="hover:underline text-foreground"
                        >
                          @{log.staff_username}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/30">
                          &mdash;
                        </span>
                      )}
                      {log.staff_display_name && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {log.staff_display_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border-transparent"
                      >
                        {log.audit_action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.maybe_target_username ? (
                        <Link
                          to={`/user/profile/${log.maybe_target_username}`}
                          className="hover:underline text-foreground font-medium"
                        >
                          @{log.maybe_target_username}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/30">
                          &mdash;
                        </span>
                      )}
                      {log.maybe_target_display_name && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {log.maybe_target_display_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.maybe_entity_type ? (
                        <div className="flex flex-col gap-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground w-fit"
                          >
                            {log.maybe_entity_type}
                          </Badge>
                          {log.maybe_entity_token && (
                            <span className="font-mono text-[10px] text-muted-foreground/60 truncate max-w-[140px]">
                              {log.maybe_entity_token}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30">
                          &mdash;
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.staff_ip_address}
                    </TableCell>
                  </TableRow>
                ))}
                {nextCursor != null && (
                  <TableRow ref={sentinelRef}>
                    <TableCell colSpan={6} className="text-center py-4">
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <IconLoader2 className="size-4 animate-spin" />
                          Loading more...
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">
                          Scroll for more
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
