import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ModerationApi,
  type FeatureFlagDescriptor,
  type ModeratorUserLookupResponse,
} from "@/api/ModerationApi";
import { usePageTitle } from "@/hooks/usePageTitle";
import { UserFeatureFlagsDialog } from "@/components/UserFeatureFlagsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getIdenticonUrl } from "@/lib/identicon";
import { getFeatureFlagIcon } from "@/lib/feature-flag-icon";
import {
  IconFlag,
  IconSearch,
  IconAlertCircle,
  IconArrowRight,
  IconUser,
} from "@tabler/icons-react";

function getAvatarSrc(user: ModeratorUserLookupResponse): string | undefined {
  if (user.email_gravatar_hash) {
    return `https://gravatar.com/avatar/${user.email_gravatar_hash}?s=60&d=404`;
  }
  return undefined;
}

export function FeatureFlags() {
  usePageTitle("Feature Flags");

  const [availableFlags, setAvailableFlags] = useState<FeatureFlagDescriptor[]>(
    [],
  );
  const [isLoadingFlags, setIsLoadingFlags] = useState(true);
  const [flagsError, setFlagsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] =
    useState<ModeratorUserLookupResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const api = new ModerationApi();
    api
      .ListAvailableFeatureFlags()
      .then((resp) => {
        if (cancelled) return;
        if (resp.success && resp.data) {
          setAvailableFlags(
            [...resp.data.feature_flags].sort((a, b) =>
              a.key.localeCompare(b.key),
            ),
          );
        } else {
          setFlagsError(resp.errorMessage || "Failed to load feature flags");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFlags(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    const api = new ModerationApi();
    const resp = await api.UserLookup(query);
    setIsSearching(false);

    if (resp.success && resp.data?.maybe_user) {
      setSearchResult(resp.data.maybe_user);
    } else {
      setSearchError(resp.errorMessage || "User not found");
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconFlag className="size-6 text-muted-foreground" />
          Feature Flags
        </h1>
        <p className="text-muted-foreground">
          View all available feature flags and manage which ones are enabled for
          individual users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl lg:items-start">
        {/* Available Flags */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
          <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-[45px] shrink-0">
            <IconFlag className="size-4" />
            Available Flags
            {!isLoadingFlags && !flagsError && (
              <span className="text-sm font-normal text-muted-foreground normal-case tracking-normal ml-1">
                ({availableFlags.length})
              </span>
            )}
          </h4>

          {isLoadingFlags ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 pb-3 border-b border-dashed border-border/50"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : flagsError ? (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription>{flagsError}</AlertDescription>
            </Alert>
          ) : availableFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No feature flags are currently defined.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-dashed divide-border/50 lg:max-h-[calc(100svh-320px)] lg:overflow-y-auto -mr-2 pr-2">
              {availableFlags.map((flag) => {
                const Icon = getFeatureFlagIcon(flag);
                return (
                  <li
                    key={flag.key}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0 gap-1 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {flag.full_name && (
                          <span className="text-sm font-semibold leading-tight">
                            {flag.full_name}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground break-all">
                          {flag.key}
                        </span>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {flag.description}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* User Search */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
          <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-[45px]">
            <IconUser className="size-4" />
            Manage User Flags
          </h4>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 mb-3"
          >
            <Input
              type="text"
              placeholder="Username, email, or token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
            >
              <IconSearch className="size-4" />
              {isSearching ? "Searching..." : "Find"}
            </Button>
          </form>

          {isSearching && (
            <div className="rounded-lg border bg-muted/20 p-3 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          )}

          {searchError && !isSearching && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription>
                {searchError.charAt(0).toUpperCase() + searchError.slice(1)}
              </AlertDescription>
            </Alert>
          )}

          {searchResult && !isSearching && (
            <div className="rounded-lg border bg-muted/20 p-3 flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-md shrink-0">
                <AvatarImage
                  src={getAvatarSrc(searchResult)}
                  draggable={false}
                />
                <AvatarFallback className="rounded-md p-0">
                  <img
                    src={getIdenticonUrl(searchResult.username)}
                    alt={searchResult.username}
                    className="h-full w-full"
                    draggable={false}
                  />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold leading-tight font-outfit truncate">
                    {searchResult.display_name || searchResult.username}
                  </span>
                  {searchResult.is_banned && (
                    <Badge variant="destructive" className="text-[10px]">
                      Banned
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  @{searchResult.username}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <IconFlag className="size-3.5" />
                  Manage Flags
                </Button>
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link
                    to={`/user/profile/${searchResult.username}`}
                    title="View profile"
                  >
                    <IconArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {searchResult && (
        <UserFeatureFlagsDialog
          usernameOrToken={searchResult.username}
          username={searchResult.username}
          displayName={searchResult.display_name || searchResult.username}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
