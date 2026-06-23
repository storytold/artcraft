import { useState } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getIdenticonUrl } from "@/lib/identicon";
import { formatNamespace, stripeCustomerDashboardUrl } from "@/lib/stripe";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  IconAlertCircle,
  IconBrandStripe,
  IconSearch,
  IconArrowRight,
  IconExternalLink,
} from "@tabler/icons-react";

interface StripeUser {
  display_name: string;
  email_address: string;
  maybe_stripe_subscription_id?: string | null;
  subscription_namespace: string;
  token: string;
  username: string;
}

export function StripeLookup() {
  usePageTitle("Stripe Lookup");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<StripeUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const api = new ModerationApi();
      const resp = await api.LookupByStripeCustomerId(q);

      if (resp.success && resp.data) {
        setResults(resp.data.users);
      } else {
        setError(resp.errorMessage || "Lookup failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconBrandStripe className="size-6 text-muted-foreground" />
          Stripe Customer Lookup
        </h1>
        <p className="text-muted-foreground">
          Find users by their Stripe Customer ID. Useful when a user's email is
          unlinked due to billing or signup issues.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="pb-0">
          <form onSubmit={handleLookup} className="flex gap-2">
            <Input
              type="text"
              placeholder="cus_XXXXXXXXXX"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 font-mono text-sm"
            />
            <Button type="submit" disabled={isSearching || !query.trim()}>
              <IconSearch className="size-4" />
              {isSearching ? "Searching..." : "Lookup"}
            </Button>
          </form>
          {query.trim() && (
            <a
              href={stripeCustomerDashboardUrl(query.trim())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              <IconExternalLink className="size-3.5" />
              View in Stripe Dashboard
            </a>
          )}
        </CardHeader>
        <Separator />
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <IconAlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSearching && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Skeleton className="size-10 rounded-lg shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-md shrink-0" />
                </div>
              ))}
            </div>
          )}

          {results !== null && !isSearching && (
            <>
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No users found for this Stripe Customer ID.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    {results.length} user{results.length !== 1 && "s"} found
                  </p>
                  {results.map((user) => (
                    <div
                      key={user.token}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/30 transition-colors"
                    >
                      <Avatar className="size-10 rounded-lg shrink-0">
                        <AvatarFallback className="rounded-lg p-0">
                          <img
                            src={getIdenticonUrl(user.username)}
                            alt={user.username}
                            className="h-full w-full"
                          />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {user.display_name || user.username}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] shrink-0"
                          >
                            {formatNamespace(user.subscription_namespace)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </span>
                          {user.email_address && (
                            <>
                              <span className="text-muted-foreground/30 text-xs">
                                &middot;
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {user.email_address}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="shrink-0"
                      >
                        <Link to={`/user/profile/${user.username}`}>
                          View Profile
                          <IconArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {results === null && !isSearching && !error && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Enter a Stripe Customer ID above to find linked users.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
