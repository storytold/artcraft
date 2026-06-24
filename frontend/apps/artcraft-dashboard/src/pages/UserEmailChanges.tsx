import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ModerationApi,
  type ModeratorUserLookupResponse,
} from "@/api/ModerationApi";
import type { UserEmailChange, UserEmailChangeUserSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { UserLookupPanel } from "@/components/UserLookupPanel";
import { ChangeUserEmailDialog } from "@/components/ChangeUserEmailDialog";
import { getIdenticonUrl } from "@/lib/identicon";
import { useTableHeight } from "@/hooks/useTableHeight";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  IconMail,
  IconAlertCircle,
  IconArrowNarrowRight,
  IconRefresh,
  IconLoader2,
  IconPencil,
} from "@tabler/icons-react";

function gravatarUrl(hash?: string): string | undefined {
  return hash ? `https://gravatar.com/avatar/${hash}?s=48&d=404` : undefined;
}

function UserSummaryCell({ user }: { user: UserEmailChangeUserSummary }) {
  return (
    <Link
      to={`/user/profile/${user.username}`}
      className="flex items-center gap-2 group/user w-fit"
    >
      <Avatar className="size-6 rounded-md shrink-0">
        <AvatarImage src={gravatarUrl(user.gravatar_hash)} draggable={false} />
        <AvatarFallback className="rounded-md p-0">
          <img
            src={getIdenticonUrl(user.username)}
            alt={user.username}
            className="size-full"
            draggable={false}
          />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="text-xs font-medium truncate group-hover/user:underline">
          {user.display_name || user.username}
        </span>
        <span className="text-[10px] text-muted-foreground truncate">
          @{user.username}
        </span>
      </div>
    </Link>
  );
}

export function UserEmailChanges() {
  usePageTitle("Email Changes");

  const [user, setUser] = useState<ModeratorUserLookupResponse | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [changes, setChanges] = useState<UserEmailChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadHistory = async (
    username: string,
    cursor?: string | null,
    append = false,
  ) => {
    if (!append) {
      setIsLoading(true);
      setHistoryError(null);
    } else {
      setIsLoadingMore(true);
    }

    const modApi = new ModerationApi();
    const resp = await modApi.ListUserEmailChanges(username, cursor);

    if (cancelledRef.current) return;

    if (resp.success && resp.data) {
      setChanges((prev) =>
        append ? [...prev, ...resp.data!.changes] : resp.data!.changes,
      );
      setNextCursor(resp.data.next_cursor);
    } else {
      setHistoryError(resp.errorMessage || "Failed to load email changes");
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  };

  // Guard against state updates after unmount.
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (user && !isLoadingMore && nextCursor != null) {
      loadHistory(user.username, nextCursor, true);
    }
  }, [user, nextCursor, isLoadingMore]);

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

  const handleSelect = (next: ModeratorUserLookupResponse | null) => {
    setUser(next);
    setCurrentEmail(next?.email_address ?? null);
    setChanges([]);
    setNextCursor(null);
    if (next) loadHistory(next.username);
  };

  const handleChangeSuccess = (newEmail: string) => {
    setCurrentEmail(newEmail);
    setUser((prev) => (prev ? { ...prev, email_address: newEmail } : prev));
    toast.success("Email address changed");
    if (user) loadHistory(user.username);
  };

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
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconMail className="size-6 text-muted-foreground" />
          Email Changes
        </h1>
        <p className="text-muted-foreground">
          Look up a user to change their email address and review the full
          history of email changes.
        </p>
      </div>

      <UserLookupPanel
        user={user}
        displayEmail={currentEmail}
        onSelect={handleSelect}
        actions={() => (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <IconPencil className="size-3.5" />
            Change Email
          </Button>
        )}
      />

      {user && (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex items-center gap-4">
            <h4 className="flex-1 text-sm font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
              <IconMail className="size-4" />
              Email Change History
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHistory(user.username)}
              disabled={isLoading}
            >
              <IconRefresh
                className={`size-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {historyError && (
            <Alert variant="destructive" className="max-w-xl">
              <IconAlertCircle className="size-4" />
              <AlertDescription>{historyError}</AlertDescription>
            </Alert>
          )}

          <div ref={tableRef}>
            {isLoading ? (
              <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="text-xs">When</TableHead>
                    <TableHead className="text-xs">Old Email</TableHead>
                    <TableHead className="text-xs">New Email</TableHead>
                    <TableHead className="text-xs">Changed By</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : changes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
                <IconMail className="size-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground">
                  No recorded email changes for this user.
                </p>
              </div>
            ) : (
              <Table
                containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
                containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
              >
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="text-xs">When</TableHead>
                    <TableHead className="text-xs">Old Email</TableHead>
                    <TableHead className="text-xs">New Email</TableHead>
                    <TableHead className="text-xs">Changed By</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changes.map((change) => (
                    <TableRow key={change.id} className="group">
                      <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(change.created_at)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground break-all max-w-[220px]">
                        {change.old_email}
                      </TableCell>
                      <TableCell className="text-xs font-mono break-all max-w-[220px]">
                        <span className="inline-flex items-center gap-1.5">
                          <IconArrowNarrowRight className="size-3.5 text-muted-foreground/50 shrink-0" />
                          {change.new_email}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {change.maybe_changed_by_user ? (
                          <UserSummaryCell user={change.maybe_changed_by_user} />
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground"
                          >
                            Self / system
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {change.ip_address}
                      </TableCell>
                    </TableRow>
                  ))}
                  {nextCursor != null && (
                    <TableRow ref={sentinelRef}>
                      <TableCell colSpan={5} className="text-center py-4">
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
      )}

      {user && (
        <ChangeUserEmailDialog
          userToken={user.token}
          username={user.username}
          displayName={user.display_name || user.username}
          currentEmail={currentEmail ?? undefined}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleChangeSuccess}
        />
      )}
    </div>
  );
}
