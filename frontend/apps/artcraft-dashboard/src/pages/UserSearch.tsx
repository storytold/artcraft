import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCountryFromIP } from "@/hooks/useCountryFromIP";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  ModerationApi,
  type ModeratorUserLookupResponse,
} from "@/api/ModerationApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  IconAlertCircle,
  IconSearch,
  IconCopy,
  IconCheck,
  IconArrowRight,
  IconCoin,
  IconBriefcase,
  IconHistory,
  IconCalendar,
  IconUsers,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getIdenticonUrl } from "@/lib/identicon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GiveCreditsDialog } from "@/components/GiveCreditsDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Wallet } from "@/types";

function getAvatarSrc(user: ModeratorUserLookupResponse): string | undefined {
  if (user.email_gravatar_hash) {
    return `https://gravatar.com/avatar/${user.email_gravatar_hash}?s=60&d=404`;
  }
  return undefined;
}

export function UserSearch() {
  usePageTitle("User Search");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] =
    useState<ModeratorUserLookupResponse | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isWalletsLoading, setIsWalletsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [giveCreditsOpen, setGiveCreditsOpen] = useState(false);

  const { country: creationCountry, countryCode } = useCountryFromIP(
    searchResult?.ip_address_last_login,
  );

  const FlagIcon =
    countryCode && hasFlag(countryCode)
      ? (Flags as Record<string, Flags.FlagComponent>)[countryCode]
      : null;

  const customerBadge = isWalletsLoading ? (
    <Skeleton className="h-5 w-16 rounded-full" />
  ) : wallets.length > 0 ? (
    <Badge
      variant="secondary"
      className="bg-emerald-500/10 text-emerald-400 text-xs py-0.5 px-2"
    >
      Paying User
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="text-foreground/80 bg-muted text-xs py-0.5 px-2"
    >
      Free User
    </Badge>
  );

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResult(null);
    setWallets([]);

    try {
      const api = new ModerationApi();
      const response = await api.UserLookup(query.trim());

      if (response.success && response.data?.maybe_user) {
        const foundUser = response.data.maybe_user;
        setSearchResult(foundUser);

        setIsWalletsLoading(true);
        api.ListUserWallets(foundUser.token).then((walletResp) => {
          if (walletResp.success && walletResp.data) {
            setWallets(walletResp.data.wallets);
          }
          setIsWalletsLoading(false);
        });
      } else {
        setError(response.errorMessage || "User not found");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while searching");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchParams({ q: searchQuery.trim() });
    await performSearch(searchQuery.trim());
  };

  const copyProfileLink = () => {
    if (!searchResult) return;
    const profileUrl = `${window.location.origin}/user/profile/${searchResult.username}`;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconUsers className="size-6 text-muted-foreground" />
          User Search
        </h1>
        <p className="text-muted-foreground">
          Find and manage user accounts by username or email.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 max-w-2xl"
      >
        <Input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
          <IconSearch className="size-4" />
          <span>{isSearching ? "Searching..." : "Search"}</span>
        </Button>
      </form>

      <div className="max-w-2xl">
        {isSearching && (
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-4">
                <Skeleton className="h-18 w-18 rounded-lg" />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full sm:hidden" />
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div>
                  <Skeleton className="h-3 w-28 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        )}

        {error && !isSearching && (
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" />
            <AlertDescription>
              {error.charAt(0).toUpperCase() + error.slice(1)}
            </AlertDescription>
          </Alert>
        )}

        {searchResult && (
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-18 w-18 rounded-lg">
                  <AvatarImage
                    src={getAvatarSrc(searchResult)}
                    draggable={false}
                  />
                  <AvatarFallback className="rounded-lg p-0">
                    <img
                      src={getIdenticonUrl(searchResult.username)}
                      alt={searchResult.username}
                      className="h-full w-full"
                      draggable={false}
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold leading-tight font-outfit">
                      {searchResult.display_name || searchResult.username}
                    </span>
                    <div className="hidden sm:flex items-center gap-2">
                      {customerBadge}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    @{searchResult.username}
                  </span>
                  {searchResult.created_at && (
                    <span className="text-xs text-muted-foreground/90 font-medium flex items-center mt-1.5 gap-1">
                      <IconCalendar className="size-3.5" />
                      Joined {new Date(searchResult.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                    {customerBadge}
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User Token
                  </dt>
                  <dd className="mt-1 text-sm font-mono break-all">
                    {searchResult.token || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm break-all">
                    {searchResult.email_address || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Credits
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {isWalletsLoading ? (
                      <Skeleton className="h-4 w-12 inline-block" />
                    ) : (
                      wallets
                        .reduce(
                          (sum, w) =>
                            sum + w.monthly_credits + w.banked_credits,
                          0,
                        )
                        .toLocaleString()
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Country (From IP)
                  </dt>
                  <dd className="mt-1 text-sm font-medium flex items-center gap-1.5">
                    {FlagIcon && (
                      <FlagIcon className="size-4 rounded-[2px] shadow-sm" />
                    )}
                    {creationCountry || "Unknown"}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-2">
                <Button variant="default" size="sm" asChild>
                  <Link to={`/user/profile/${searchResult.username}`}>
                    View Profile
                    <IconArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/user/profile/${searchResult.username}/jobs`}>
                    <IconBriefcase className="size-3.5" />
                    View Jobs
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/user/profile/${searchResult.username}/wallet`}>
                    <IconHistory className="size-3.5" />
                    Credits History
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={wallets.length === 0}
                  onClick={() => setGiveCreditsOpen(true)}
                >
                  <IconCoin className="size-3.5" />
                  Give Credits
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={copyProfileLink}
                        className="px-2"
                      >
                        {isCopied ? (
                          <IconCheck className="size-4 text-green-500" />
                        ) : (
                          <IconCopy className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isCopied ? "Copied!" : "Copy profile link"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        )}

        {searchResult && wallets.length > 0 && (
          <GiveCreditsDialog
            walletToken={wallets[0].token}
            displayName={searchResult.display_name || searchResult.username}
            open={giveCreditsOpen}
            onOpenChange={setGiveCreditsOpen}
            onSuccess={() => {
              const api = new ModerationApi();
              api.ListUserWallets(searchResult.token).then((resp) => {
                if (resp.success && resp.data) {
                  setWallets(resp.data.wallets);
                }
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
