import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { DebugLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DebugLogCard } from "@/components/DebugLogCard";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBug,
  IconLoader2,
  IconRefresh,
  IconUser,
} from "@tabler/icons-react";

const PAGE_SIZE = 50;

interface UserHeaderInfo {
  display_name: string;
  username: string;
}

export function UserDebugLogs() {
  const { userToken } = useParams<{ userToken: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserHeaderInfo | null>(null);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  usePageTitle(
    user ? `Debug Logs · ${user.display_name}` : "User Debug Logs",
  );

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const copy = (value: string, id: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    });
  };

  const loadLogs = useCallback(
    async (cursor: number | null, append: boolean) => {
      if (!userToken || loadingRef.current) return;
      loadingRef.current = true;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const api = new ModerationApi();
        const resp = await api.ListUserDebugLogs(
          userToken,
          cursor ?? undefined,
          PAGE_SIZE,
        );
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
    [userToken],
  );

  // Load logs + basic user info (for the header) on mount.
  useEffect(() => {
    setLogs([]);
    setNextCursor(null);
    setUser(null);
    loadLogs(null, false);

    if (userToken) {
      const api = new ModerationApi();
      api.UserLookup(userToken).then((resp) => {
        if (resp.success && resp.data?.maybe_user) {
          setUser({
            display_name: resp.data.maybe_user.display_name,
            username: resp.data.maybe_user.username,
          });
        }
      });
    }
  }, [userToken, loadLogs]);

  // Infinite scroll sentinel.
  useEffect(() => {
    observerRef.current?.disconnect();
    if (nextCursor === null) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadLogs(nextCursor, true);
        }
      },
      { threshold: 0.1 },
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [nextCursor, loadLogs]);

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
            User Debug Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2 min-w-0">
            {user ? (
              <>
                <IconUser className="size-4 shrink-0" />
                <Link
                  to={`/user/profile/${encodeURIComponent(user.username)}`}
                  className="hover:underline text-foreground/80 truncate"
                  title="View profile"
                >
                  {user.display_name}
                </Link>
                <span className="font-mono text-muted-foreground/70 truncate">
                  {userToken}
                </span>
              </>
            ) : (
              <span className="font-mono truncate">{userToken}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {user && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/user/profile/${encodeURIComponent(user.username)}`}>
                <IconUser className="size-4" />
                Profile
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLogs(null, false)}
            disabled={isLoading}
          >
            <IconRefresh className="size-4" />
            Refresh
          </Button>
        </div>
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
            No debug logs found for this user.
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
              showEventLink
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
