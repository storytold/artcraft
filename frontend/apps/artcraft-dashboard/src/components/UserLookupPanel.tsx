import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ModerationApi,
  type ModeratorUserLookupResponse,
} from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getIdenticonUrl } from "@/lib/identicon";
import {
  IconSearch,
  IconAlertCircle,
  IconArrowRight,
  IconUser,
} from "@tabler/icons-react";

function gravatarUrl(hash?: string): string | undefined {
  return hash ? `https://gravatar.com/avatar/${hash}?s=60&d=404` : undefined;
}

interface UserLookupPanelProps {
  title?: string;
  user: ModeratorUserLookupResponse | null;
  /** Override the email shown on the result card (e.g. after a change). */
  displayEmail?: string | null;
  onSelect: (user: ModeratorUserLookupResponse | null) => void;
  /** Extra action buttons rendered on the result card, before the profile link. */
  actions?: (user: ModeratorUserLookupResponse) => React.ReactNode;
}

export function UserLookupPanel({
  title = "Find User",
  user,
  displayEmail,
  onSelect,
  actions,
}: UserLookupPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    setSearchError(null);

    const api = new ModerationApi();
    const resp = await api.UserLookup(query);
    setIsSearching(false);

    if (resp.success && resp.data?.maybe_user) {
      onSelect(resp.data.maybe_user);
    } else {
      onSelect(null);
      setSearchError(resp.errorMessage || "User not found");
    }
  };

  const email = displayEmail ?? user?.email_address;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5 max-w-2xl">
      <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-[45px]">
        <IconUser className="size-4" />
        {title}
      </h4>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
        <Input
          type="text"
          placeholder="Username, email, or token..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
          <IconSearch className="size-4" />
          {isSearching ? "Searching..." : "Find"}
        </Button>
      </form>

      {isSearching && (
        <div className="rounded-lg border bg-muted/20 p-3 flex items-center gap-3">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
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

      {user && !isSearching && (
        <div className="rounded-lg border bg-muted/20 p-3 flex items-center gap-3">
          <Avatar className="size-12 rounded-md shrink-0">
            <AvatarImage
              src={gravatarUrl(user.email_gravatar_hash)}
              draggable={false}
            />
            <AvatarFallback className="rounded-md p-0">
              <img
                src={getIdenticonUrl(user.username)}
                alt={user.username}
                className="size-full"
                draggable={false}
              />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold leading-tight font-outfit truncate">
                {user.display_name || user.username}
              </span>
              {user.is_banned && (
                <Badge variant="destructive" className="text-[10px]">
                  Banned
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">
              @{user.username}
            </span>
            {email && (
              <span className="text-xs text-muted-foreground/80 font-mono truncate">
                {email}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {actions?.(user)}
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link to={`/user/profile/${user.username}`} title="View profile">
                <IconArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
