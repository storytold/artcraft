import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { MediaApi, type MediaInfo } from "@/api/MediaApi";
import { ModerationApi } from "@/api/ModerationApi";
import { MediaCard } from "@/components/MediaCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  IconArrowLeft,
  IconAlertCircle,
  IconPhoto,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const PAGE_SIZE = 32;

export function UserCreations() {
  const { username } = useParams<{ username: string }>();
  usePageTitle(username ? `@${username} — Creations` : "Creations");

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [gravatarHash, setGravatarHash] = useState<string | null>(null);
  const [items, setItems] = useState<MediaInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);
  // Refs track loading state and next page index without causing observer recreation
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const nextPageRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (!username || isFetchingRef.current || !hasMoreRef.current) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    const pageIndex = nextPageRef.current;
    try {
      const mediaApi = new MediaApi();
      const resp = await mediaApi.ListUserMediaFiles(username, {
        page_index: pageIndex,
        page_size: PAGE_SIZE,
        filter_media_classes: ["image", "video", "dimensional"],
      });

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setItems((prev) => [...prev, ...resp.data!]);
        nextPageRef.current = pageIndex + 1;
        if (resp.pagination) {
          const more = pageIndex + 1 < resp.pagination.total_pages;
          hasMoreRef.current = more;
          setHasMore(more);
        }
      } else {
        setError(resp.errorMessage || "Failed to load creations");
      }
    } finally {
      isFetchingRef.current = false;
      if (!cancelledRef.current) setIsLoadingMore(false);
    }
  }, [username]);

  useEffect(() => {
    cancelledRef.current = false;
    nextPageRef.current = 0;
    hasMoreRef.current = true;

    async function init() {
      if (!username) return;

      const modApi = new ModerationApi();
      const mediaApi = new MediaApi();

      const [userResp, mediaResp] = await Promise.all([
        modApi.UserLookup(username),
        mediaApi.ListUserMediaFiles(username, {
          page_index: 0,
          page_size: PAGE_SIZE,
          filter_media_classes: ["image", "video", "dimensional"],
        }),
      ]);

      if (cancelledRef.current) return;

      if (userResp.success && userResp.data?.maybe_user) {
        setDisplayName(userResp.data.maybe_user.display_name || null);
        setGravatarHash(userResp.data.maybe_user.email_gravatar_hash || null);
      }

      if (mediaResp.success && mediaResp.data) {
        setItems(mediaResp.data);
        nextPageRef.current = 1;
        if (mediaResp.pagination) {
          const more = 1 < mediaResp.pagination.total_pages;
          hasMoreRef.current = more;
          setHasMore(more);
        }
      } else {
        setError(mediaResp.errorMessage || "Failed to load creations");
      }

      setIsLoading(false);
    }

    init();
    return () => {
      cancelledRef.current = true;
    };
  }, [username]);

  // Set up observer once after initial load — uses refs so it never needs rebuilding
  useEffect(() => {
    if (isLoading || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoading, loadMore]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="p-0! h-auto w-auto hover:bg-transparent! text-foreground/70 hover:text-foreground/50"
          asChild
        >
          <Link to={`/user/profile/${username}`}>
            <IconArrowLeft className="size-6" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconPhoto className="size-6 text-muted-foreground" />
          Creations
          {username && (
            <span className="text-muted-foreground font-normal text-2xl">
              @{username}
            </span>
          )}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <IconPhoto className="size-10 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">This user has no creations yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-5">
            {items.map((item) => (
              <MediaCard
                key={item.token}
                item={item}
                showCreator
                creator={{
                  username: username!,
                  display_name: displayName ?? undefined,
                  gravatar_hash: gravatarHash ?? undefined,
                }}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isLoadingMore ? (
              <Spinner className="size-6 opacity-50" />
            ) : !hasMore ? (
              <p className="text-muted-foreground text-sm">All creations loaded</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
