import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCountryFromIP } from "@/hooks/useCountryFromIP";
import { hasFlag } from "country-flag-icons";
import * as Flags from "country-flag-icons/react/3x2";
import {
  ModerationApi,
  type ModeratorUserLookupResponse,
  type ModeratorStripeCustomerIdSource,
  type ModeratorUserStripeCustomerIdEntry,
} from "@/api/ModerationApi";
import { formatNamespace, stripeCustomerDashboardUrl } from "@/lib/stripe";
import { MediaApi, type MediaInfo } from "@/api/MediaApi";
import { MediaCard } from "@/components/MediaCard";
import type { Wallet, UserJob } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getIdenticonUrl } from "@/lib/identicon";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconExternalLink,
  IconPhoto,
  IconInfoCircle,
  IconCopy,
  IconCheck,
  IconMail,
  IconUser,
  IconShieldLock,
  IconCoin,
  IconEye,
  IconEyeOff,
  IconCreditCard,
  IconCalendar,
  IconHistory,
  IconBriefcase,
  IconWallet,
  IconKey,
  IconBan,
  IconShieldCheck,
  IconFlag,
  IconShare,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GiveCreditsDialog } from "@/components/GiveCreditsDialog";
import { ImpersonateUserDialog } from "@/components/ImpersonateUserDialog";
import { BanUserDialog } from "@/components/BanUserDialog";
import { UserFeatureFlagsDialog } from "@/components/UserFeatureFlagsDialog";
import { getJobStatusBadgeProps } from "@/components/JobsTable";
import { usePageTitle } from "@/hooks/usePageTitle";

const STRIPE_SOURCE_LABELS: Record<ModeratorStripeCustomerIdSource, string> = {
  customer_link: "Customer Link",
  subscription: "Subscription",
};

export function UserProfile() {
  const { username } = useParams<{ username: string }>();
  usePageTitle(username ? `@${username}` : undefined);
  const navigate = useNavigate();

  const goBack = () => {
    navigate(`/user/search?q=${encodeURIComponent(username || "")}`);
  };
  const [user, setUser] = useState<ModeratorUserLookupResponse | null>(null);
  const [media, setMedia] = useState<MediaInfo[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isWalletsLoading, setIsWalletsLoading] = useState(false);
  const [stripeCustomerIds, setStripeCustomerIds] = useState<
    ModeratorUserStripeCustomerIdEntry[]
  >([]);
  const [isStripeIdsLoading, setIsStripeIdsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIPs, setShowIPs] = useState<boolean>(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [giveCreditsOpen, setGiveCreditsOpen] = useState(false);
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateConfirmOpen, setImpersonateConfirmOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [featureFlagsOpen, setFeatureFlagsOpen] = useState(false);
  const [jobs, setJobs] = useState<UserJob[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const totalMonthly = wallets.reduce((sum, w) => sum + w.monthly_credits, 0);
  const totalBanked = wallets.reduce((sum, w) => sum + w.banked_credits, 0);
  const totalCredits = totalMonthly + totalBanked;

  // One row per unique customer id, with all the (namespace, source) pairs
  // it was found under.
  const stripeCustomers = stripeCustomerIds.reduce<
    { id: string; entries: ModeratorUserStripeCustomerIdEntry[] }[]
  >((acc, entry) => {
    const group = acc.find((g) => g.id === entry.stripe_customer_id);
    if (group) {
      group.entries.push(entry);
    } else {
      acc.push({ id: entry.stripe_customer_id, entries: [entry] });
    }
    return acc;
  }, []);

  // A namespace mapping to more than one distinct customer id means the
  // subscription and credits customer drifted apart — worth flagging.
  const namespaceIdSets = stripeCustomerIds.reduce<Map<string, Set<string>>>(
    (map, entry) => {
      const ids = map.get(entry.payments_namespace) ?? new Set<string>();
      ids.add(entry.stripe_customer_id);
      return map.set(entry.payments_namespace, ids);
    },
    new Map(),
  );
  const mismatchedNamespaces = [...namespaceIdSets.entries()]
    .filter(([, ids]) => ids.size > 1)
    .map(([ns]) => ns);

  const createWallet = async () => {
    if (!user || isCreatingWallet) return;
    setIsCreatingWallet(true);
    try {
      const modApi = new ModerationApi();
      const resp = await modApi.CreateWalletForUser(user.token);
      if (resp.success) {
        await refreshWallets();
      }
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const refreshUser = async () => {
    if (!username) return;
    const modApi = new ModerationApi();
    const resp = await modApi.UserLookup(username);
    if (resp.success && resp.data?.maybe_user) {
      setUser(resp.data.maybe_user);
    }
  };

  const refreshWallets = async () => {
    if (!user) return;
    const modApi = new ModerationApi();
    const walletsResp = await modApi.ListUserWallets(user.token);
    if (walletsResp.success && walletsResp.data) {
      setWallets(walletsResp.data.wallets);
    }
  };

  const { country: creationCountry, countryCode } = useCountryFromIP(
    user?.ip_address_last_login,
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!username) return;
      setIsLoading(true);
      setError(null);

      try {
        const modApi = new ModerationApi();
        const mediaApi = new MediaApi();

        const [userResp, mediaResp] = await Promise.all([
          modApi.UserLookup(username),
          mediaApi.ListUserMediaFiles(username, {
            page_size: 24,
            filter_media_classes: ["image", "video", "dimensional"],
          }),
        ]);

        if (cancelled) return;

        if (userResp.success && userResp.data?.maybe_user) {
          const fetchedUser = userResp.data.maybe_user;
          setUser(fetchedUser);

          setIsWalletsLoading(true);
          modApi.ListUserWallets(fetchedUser.token).then((resp) => {
            if (cancelled) return;
            if (resp.success && resp.data) {
              setWallets(resp.data.wallets);
            }
            setIsWalletsLoading(false);
          });

          setIsJobsLoading(true);
          modApi.ListUserJobs(fetchedUser.token).then((resp) => {
            if (cancelled) return;
            if (resp.success && resp.data) {
              setJobs(resp.data.jobs);
            }
            setIsJobsLoading(false);
          });

          setIsStripeIdsLoading(true);
          modApi.GetUserStripeCustomerIds(fetchedUser.token).then((resp) => {
            if (cancelled) return;
            if (resp.success && resp.data) {
              setStripeCustomerIds(resp.data.customer_ids);
            }
            setIsStripeIdsLoading(false);
          });
        } else {
          setError(userResp.errorMessage || "User not found");
        }

        if (mediaResp.success && mediaResp.data) {
          setMedia(mediaResp.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Skeleton className="size-6 rounded" />
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Profile Header Skeleton */}
        <div className="relative rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-end">
            <Skeleton className="h-28 w-28 rounded-xl" />
            <div className="flex flex-col flex-1 gap-1 pb-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-20 rounded-full hidden md:block" />
              </div>
              <Skeleton className="h-5 w-32 mt-1" />
              <Skeleton className="h-5 w-20 rounded-full md:hidden mt-1" />
              <div className="flex gap-x-6 mt-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="md:ml-auto flex gap-2">
              <Skeleton className="h-9 w-36 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          </div>
        </div>

        {/* Account Details Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Identity */}
            <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-20 rounded-full mt-1" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              </div>
            </div>

            {/* Credits */}
            <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-3 border-dashed border-border/50"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <div className="flex gap-2 mt-auto">
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 flex-1 rounded-md" />
                </div>
              </div>
            </div>

            {/* Jobs Preview */}
            <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-3 border-dashed border-border/50"
                  >
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
                <Skeleton className="h-8 w-full rounded-md mt-auto" />
              </div>
            </div>

            {/* Billing */}
            <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-3 border-dashed border-border/50"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
                <Skeleton className="h-8 w-full rounded-md mt-auto" />
              </div>
            </div>

            {/* Configuration */}
            <div className="rounded-xl border bg-card shadow-sm flex flex-col p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-28" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Creations Grid Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="h-7 w-40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-4 max-w-xl">
        <Button variant="ghost" className="w-fit" onClick={goBack}>
          <IconArrowLeft className="size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <IconAlertCircle className="size-4" />
          <AlertDescription>
            {error || "Unknown error occurred"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="p-0! h-auto w-auto hover:bg-transparent! text-foreground/70 hover:text-foreground/50"
        >
          <IconArrowLeft className="size-6" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconUser className="size-6 text-muted-foreground" />
          User Profile
        </h1>
      </div>

      {/* Profile Header With Banner */}
      <div className="relative rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 relative flex flex-col md:flex-row gap-6 items-start md:items-end">
          <Avatar className="h-28 w-28 rounded-xl shadow-lg bg-card text-4xl">
            <AvatarImage
              src={
                user.email_gravatar_hash
                  ? `https://gravatar.com/avatar/${user.email_gravatar_hash}?s=200&d=404`
                  : undefined
              }
              draggable={false}
            />
            <AvatarFallback className="rounded-none p-0">
              <img
                src={getIdenticonUrl(user.username)}
                alt={user.username}
                className="h-full w-full"
                draggable={false}
              />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col flex-1 gap-1 pb-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {user.display_name || user.username}
              </h2>
              <div className="hidden md:flex items-center gap-2">
                {user.is_banned && (
                  <Badge variant="destructive" className="py-0.5 px-2 text-xs">
                    <IconBan className="size-3" />
                    Banned
                  </Badge>
                )}
                {user.is_temporary && (
                  <Badge
                    variant="destructive"
                    className="py-0.5 px-2 text-xs bg-destructive/40! text-foreground/90"
                  >
                    Temporary
                  </Badge>
                )}
                {customerBadge}
              </div>
            </div>
            <p className="text-muted-foreground font-medium">
              @{user.username}
            </p>
            <div className="flex items-center gap-2 mt-1 md:hidden">
              {user.is_banned && (
                <Badge variant="destructive" className="py-0.5 px-2 text-xs">
                  <IconBan className="size-3" />
                  Banned
                </Badge>
              )}
              {user.is_temporary && (
                <Badge
                  variant="destructive"
                  className="py-0.5 px-2 text-xs bg-destructive/40! text-foreground/90"
                >
                  Temporary
                </Badge>
              )}
              {customerBadge}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconMail className="size-4" />
                <span>{user.email_address || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconCalendar className="size-4" />
                <span>
                  Joined{" "}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {/* <IconMapPin className="size-4" /> */}
                {FlagIcon && (
                  <FlagIcon className="size-4 rounded-[2px] shadow-sm" />
                )}
                <span className="font-medium">
                  {creationCountry || "Unknown Country"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="md:ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFeatureFlagsOpen(true)}
            >
              <IconFlag className="size-4" />
              Feature Flags
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/user/profile/${username}/referrals`}>
                <IconShare className="size-4" />
                Referrals
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/user/spend-summary/${username}`}>
                <IconCoin className="size-4" />
                Spend Summary
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/user/spend-history/${username}`}>
                <IconHistory className="size-4" />
                Spend History
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImpersonateConfirmOpen(true)}
            >
              <IconKey className="size-4" />
              Impersonate User
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBanOpen(true)}
              className={
                user.is_banned
                  ? "text-emerald-400 hover:text-emerald-400"
                  : "text-destructive hover:text-destructive"
              }
            >
              {user.is_banned ? (
                <IconShieldCheck className="size-4" />
              ) : (
                <IconBan className="size-4" />
              )}
              {user.is_banned ? "Unban User" : "Ban User"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copyToClipboard(window.location.href, "profile_link")
              }
            >
              {copiedStates["profile_link"] ? (
                <IconCheck className="size-4 text-green-500" />
              ) : (
                <IconCopy className="size-4" />
              )}
              Copy Profile Link
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <IconInfoCircle className="size-6 text-muted-foreground" />
          Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Identity & Contact Group */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
              <IconMail className="size-4" />
              Identity
            </h4>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email Account
                </span>
                <span className="text-sm font-medium break-all">
                  {user.email_address || "N/A"}
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.email_confirmed ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    >
                      Confirmed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Unconfirmed
                    </Badge>
                  )}
                  {user.email_is_synthetic && (
                    <Badge variant="outline" className="opacity-70">
                      Synthetic
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gravatar Hash
                </span>
                <span className="text-xs font-mono text-muted-foreground break-all">
                  {user.email_gravatar_hash || "None"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  User Token
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 justify-start text-xs font-mono px-2 overflow-hidden"
                  onClick={() => copyToClipboard(user.token, "token2")}
                >
                  {copiedStates["token2"] ? (
                    <IconCheck className="size-3 shrink-0 text-green-500" />
                  ) : (
                    <IconCopy className="size-3 shrink-0" />
                  )}
                  <span className="truncate">{user.token}</span>
                </Button>
                {user.maybe_avatar_media_file_token && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-xs font-mono px-2 overflow-hidden bg-muted/30"
                    onClick={() =>
                      copyToClipboard(
                        user.maybe_avatar_media_file_token!,
                        "avatar_token",
                      )
                    }
                  >
                    {copiedStates["avatar_token"] ? (
                      <IconCheck className="size-3 shrink-0 text-green-500" />
                    ) : (
                      <IconPhoto className="size-3 shrink-0" />
                    )}
                    <span className="truncate">
                      {user.maybe_avatar_media_file_token}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Credits & Balances Group */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
              <IconCoin className="size-4" />
              Credits Balance
              <Button
                variant="secondary"
                className="ml-auto h-auto text-xs px-2 normal-case tracking-normal font-medium"
                disabled={
                  wallets.length > 0 || isWalletsLoading || isCreatingWallet
                }
                onClick={createWallet}
              >
                {isCreatingWallet ? (
                  <Spinner className="size-3" />
                ) : (
                  <IconWallet className="size-3" />
                )}
                Create Wallet
              </Button>
            </h4>
            <div className="flex flex-col gap-3 text-sm flex-1">
              {isWalletsLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-3 border-dashed border-border/50"
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b pb-3 border-dashed border-border/50">
                    <span className="text-muted-foreground text-sm">
                      Monthly
                    </span>
                    <span className="font-bold text-sm">
                      {totalMonthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3 border-dashed border-border/50">
                    <span className="text-muted-foreground text-sm">
                      Banked
                    </span>
                    <span className="font-bold text-sm">
                      {totalBanked.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3 border-dashed border-border/50">
                    <span className="text-muted-foreground text-sm font-semibold">
                      Total Remaining
                    </span>
                    <span className="font-bold text-sm flex items-center gap-1">
                      <IconCoin className="size-3.5" />
                      {totalCredits.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="mt-auto pt-1 flex gap-3 flex-wrap items-center">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  disabled={wallets.length === 0}
                  onClick={() => setGiveCreditsOpen(true)}
                >
                  <IconCoin className="size-3.5" />
                  Give Credits
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  asChild
                >
                  <Link to={`/user/profile/${username}/wallet`}>
                    <IconHistory className="size-3.5" />
                    History
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Jobs Preview */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
              <IconBriefcase className="size-4" />
              Jobs
              {!isJobsLoading && (
                <span className="text-sm font-normal text-muted-foreground normal-case tracking-normal">
                  ({jobs.length})
                </span>
              )}
            </h4>
            <div className="flex flex-col gap-3 text-sm flex-1">
              {isJobsLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-3 border-dashed border-border/50"
                    >
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {jobs.slice(0, 3).map((job) => {
                    const badge = getJobStatusBadgeProps(job.job_status);
                    return (
                      <div
                        key={job.job_token}
                        className="flex items-center justify-between gap-2 border-b pb-3 border-dashed border-border/50"
                      >
                        <Badge
                          variant={badge.variant}
                          className={`${badge.className} text-[10px]`}
                        >
                          {badge.label}
                        </Badge>
                        {job.credits_delta != null ? (
                          <span
                            className={`font-mono text-xs tabular-nums ${
                              job.credits_delta > 0
                                ? "text-emerald-400"
                                : job.credits_delta < 0
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {job.credits_delta > 0 ? "+" : ""}
                            {job.credits_delta.toLocaleString()} credits
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">
                            &mdash;
                          </span>
                        )}
                        <div className="inline-flex items-center gap-1 ml-auto">
                          <Link
                            to={`/moderation/job/${encodeURIComponent(job.job_token)}`}
                            className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors truncate max-w-25 inline-block align-middle"
                            title="Open job info"
                          >
                            {job.job_token}
                          </Link>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
                            onClick={() =>
                              copyToClipboard(
                                job.job_token,
                                `job_${job.job_token}`,
                              )
                            }
                            title="Copy job token"
                          >
                            {copiedStates[`job_${job.job_token}`] ? (
                              <IconCheck className="size-3 text-emerald-400" />
                            ) : (
                              <IconCopy className="size-3 opacity-50" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {jobs.length === 0 && (
                    <p className="text-muted-foreground text-xs italic">
                      No jobs found.
                    </p>
                  )}
                </>
              )}
              <div className="mt-auto pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs h-8"
                  asChild
                >
                  <Link to={`/user/profile/${username}/jobs`}>
                    <IconBriefcase className="size-3.5" />
                    View All Jobs
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Billing & Subscription Group */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
              <IconCreditCard className="size-4" />
              Billing
            </h4>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stripe Customers
                </span>
                {isStripeIdsLoading ? (
                  <Skeleton className="h-12 w-full rounded-lg" />
                ) : stripeCustomers.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {stripeCustomers.map(({ id, entries }) => (
                      <div
                        key={id}
                        className="flex flex-col gap-1.5 p-2 bg-secondary/30 rounded-lg"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <a
                            href={stripeCustomerDashboardUrl(id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 min-w-0 font-mono text-xs hover:underline"
                            title="Open in Stripe Dashboard"
                          >
                            <span className="truncate">{id}</span>
                            <IconExternalLink className="size-3 shrink-0 text-muted-foreground" />
                          </a>
                          <button
                            type="button"
                            className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
                            onClick={() => copyToClipboard(id, `stripe_${id}`)}
                            title="Copy customer ID"
                          >
                            {copiedStates[`stripe_${id}`] ? (
                              <IconCheck className="size-3 text-emerald-400" />
                            ) : (
                              <IconCopy className="size-3 opacity-50" />
                            )}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {entries.map((entry) => (
                            <Badge
                              key={`${entry.payments_namespace}_${entry.source}`}
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5"
                            >
                              {formatNamespace(entry.payments_namespace)}
                              {" · "}
                              {STRIPE_SOURCE_LABELS[entry.source]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {mismatchedNamespaces.length > 0 && (
                      <p className="flex items-center gap-1 text-[11px] text-amber-400">
                        <IconAlertTriangle className="size-3 shrink-0" />
                        Multiple customer IDs in{" "}
                        {mismatchedNamespaces.map(formatNamespace).join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Not Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Security & System Identifiers Group */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
              <IconShieldLock className="size-4" />
              Security
            </h4>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between border-b pb-3 border-dashed border-border/50">
                <span className="text-muted-foreground text-sm">
                  Country (Known)
                </span>
                <span className="font-medium text-sm flex items-center gap-1.5">
                  {FlagIcon && (
                    <FlagIcon className="size-3.5 rounded-[2px] shadow-sm" />
                  )}
                  {creationCountry || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-3 border-dashed border-border/50">
                <span className="text-muted-foreground text-sm">
                  Creation IP
                </span>
                <span className="font-mono text-sm">
                  {showIPs ? user.ip_address_creation || "N/A" : "••••••••••••"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-3 border-dashed border-border/50">
                <span className="text-muted-foreground text-sm">
                  Last Login IP
                </span>
                <span className="font-mono text-sm">
                  {showIPs
                    ? user.ip_address_last_login || "N/A"
                    : "••••••••••••"}
                </span>
              </div>
              <div className="mt-auto pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => setShowIPs(!showIPs)}
                >
                  {showIPs ? (
                    <IconEyeOff className="size-3.5" />
                  ) : (
                    <IconEye className="size-3.5" />
                  )}
                  {showIPs ? "Hide IPs" : "Show IPs"}
                </Button>
              </div>
            </div>
          </div>

          {/* Account Settings Group */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
            <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
              <IconUser className="size-4" />
              Configuration
            </h4>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Account State
                </span>
                <div className="flex flex-wrap gap-2">
                  {user.is_without_password && (
                    <Badge variant="secondary">No Password</Badge>
                  )}
                  {!user.is_without_password && !user.is_temporary && (
                    <Badge variant="outline">Standard</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Username Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {user.username_is_generated ? (
                    <Badge variant="secondary">Generated</Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                  {user.username_is_not_customized && (
                    <Badge variant="outline" className="opacity-70">
                      Unchanged
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <IconPhoto className="size-6 text-muted-foreground" />
            Latest Creations
          </h3>
          <Button variant="secondary" size="sm" className="text-xs h-8" asChild>
            <Link to={`/user/profile/${username}/creations`}>
              <IconPhoto className="size-3.5" />
              View All Creations
            </Link>
          </Button>
        </div>

        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
            <IconPhoto className="size-10 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">
              This user has no creations yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-5">
            {media.map((item) => (
              <MediaCard
                key={item.token}
                item={item}
                showCreator
                creator={{
                  username: user.username,
                  display_name: user.display_name,
                  gravatar_hash: user.email_gravatar_hash,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <GiveCreditsDialog
        walletToken={wallets[0]?.token ?? ""}
        displayName={user.display_name || user.username}
        open={giveCreditsOpen}
        onOpenChange={setGiveCreditsOpen}
        onSuccess={refreshWallets}
      />

      <AlertDialog
        open={impersonateConfirmOpen}
        onOpenChange={setImpersonateConfirmOpen}
      >
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Impersonate this user?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to generate an impersonation token for{" "}
              <span className="font-semibold text-foreground">
                {user.display_name || user.username}
              </span>{" "}
              (@{user.username}). This action is recorded in the staff audit
              log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setImpersonateConfirmOpen(false);
                setImpersonateOpen(true);
              }}
            >
              <IconKey className="size-3.5" />
              Impersonate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImpersonateUserDialog
        userToken={user.token}
        username={user.username}
        displayName={user.display_name || user.username}
        open={impersonateOpen}
        onOpenChange={setImpersonateOpen}
      />

      <BanUserDialog
        username={user.username}
        displayName={user.display_name || user.username}
        isBanned={user.is_banned}
        open={banOpen}
        onOpenChange={setBanOpen}
        onSuccess={refreshUser}
      />

      <UserFeatureFlagsDialog
        usernameOrToken={user.username}
        username={user.username}
        displayName={user.display_name || user.username}
        open={featureFlagsOpen}
        onOpenChange={setFeatureFlagsOpen}
      />
    </div>
  );
}
