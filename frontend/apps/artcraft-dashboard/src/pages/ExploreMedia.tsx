import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
  MediaApi,
  type ExploreMediaFile,
  type CursorPagination,
} from "@/api/MediaApi";
import { MediaCard } from "@/components/MediaCard";
import { MediaDetailModal } from "@/components/MediaDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  IconAlertCircle,
  IconCompass,
  IconRefresh,
  IconLoader2,
  IconPhoto,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const MEDIA_CLASS_OPTIONS = [
  { value: "", label: "All" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "dimensional", label: "3D" },
] as const;

const PAGE_SIZE = 24;

export function ExploreMedia() {
  usePageTitle("Explore Media");
  const { mediaToken } = useParams<{ mediaToken?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const filterMediaClasses = searchParams.get("filter_media_classes") || "";
  const filterMediaType = searchParams.get("filter_media_type") || "";
  const includeUserUploads =
    searchParams.get("include_user_uploads") === "true";

  const [items, setItems] = useState<ExploreMediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CursorPagination | null>(null);
  const [selectedItem, setSelectedItem] = useState<ExploreMediaFile | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Stable filter key to detect changes
  const filterKey = useMemo(
    () => `${filterMediaClasses}|${filterMediaType}|${includeUserUploads}`,
    [filterMediaClasses, filterMediaType, includeUserUploads],
  );

  const loadData = useCallback(
    async (cursor?: string, append = false) => {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const api = new MediaApi();
        const resp = await api.ListMediaFiles({
          page_size: PAGE_SIZE,
          cursor,
          filter_media_classes: filterMediaClasses || "image,video,dimensional",
          filter_media_type: filterMediaType || undefined,
          include_user_uploads: includeUserUploads || undefined,
        });

        if (cancelledRef.current) return;

        if (resp.success && resp.data) {
          setItems((prev) => (append ? [...prev, ...resp.data!] : resp.data!));
          setPagination(resp.pagination ?? null);
        } else {
          setError(resp.errorMessage || "Failed to load media");
        }
      } catch (err: any) {
        if (!cancelledRef.current)
          setError(err.message || "Failed to load media");
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [filterMediaClasses, filterMediaType, includeUserUploads],
  );

  // Reset and load when filters change
  useEffect(() => {
    cancelledRef.current = false;
    setItems([]);
    setPagination(null);
    loadData();
    return () => {
      cancelledRef.current = true;
    };
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextCursor = pagination?.maybe_next ?? null;

  const loadMore = useCallback(() => {
    if (!isLoadingMore && nextCursor) {
      loadData(nextCursor, true);
    }
  }, [nextCursor, isLoadingMore, loadData]);

  // IntersectionObserver for infinite scroll
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

  // Sync URL mediaToken → selectedItem
  useEffect(() => {
    if (!mediaToken) {
      setSelectedItem(null);
      return;
    }
    // Try to find in already-loaded items
    const found = items.find((i) => i.token === mediaToken);
    if (found) {
      setSelectedItem(found);
    } else {
      // Fetch single media file for direct URL access
      const api = new MediaApi();
      api.GetMediaFile(mediaToken).then((res) => {
        if (res.success && res.data) {
          setSelectedItem(res.data as unknown as ExploreMediaFile);
        }
      });
    }
  }, [mediaToken, items]);

  const handleMediaSelect = useCallback(
    (item: ExploreMediaFile) => {
      setSelectedItem(item);
      navigate(`/explore/media/${item.token}`, { replace: false });
    },
    [navigate],
  );

  const handleModalClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedItem(null);
        navigate("/explore/media", { replace: true });
      }
    },
    [navigate],
  );

  const handleRefresh = () => {
    setItems([]);
    setPagination(null);
    loadData();
  };

  const updateFilter = (key: string, value: string | boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (
        value === "" ||
        value === false ||
        value === undefined ||
        value === null
      ) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconCompass className="size-6 text-muted-foreground" />
            Explore Media
          </h1>
          <p className="text-muted-foreground">
            Browse all latest media files across all users
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

      {/* Sticky filters bar */}
      <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-background/80 backdrop-blur-md border-b">
        <div className="flex flex-wrap items-center gap-3">
          {/* Media class toggles */}
          <div className="flex items-center gap-1.5">
            {MEDIA_CLASS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={
                  filterMediaClasses === opt.value ? "default" : "outline"
                }
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => updateFilter("filter_media_classes", opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Media type filter (text input for comma-separated values) */}
          {filterMediaType && (
            <div className="flex items-center gap-1.5">
              {filterMediaType.split(",").map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-[10px] cursor-pointer hover:bg-destructive/20"
                  onClick={() => {
                    const remaining = filterMediaType
                      .split(",")
                      .filter((t) => t !== type)
                      .join(",");
                    updateFilter("filter_media_type", remaining);
                  }}
                >
                  {type} &times;
                </Badge>
              ))}
            </div>
          )}

          {/* Include user uploads toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="include-uploads"
              checked={includeUserUploads}
              onCheckedChange={(checked) =>
                updateFilter("include_user_uploads", checked)
              }
            />
            <Label htmlFor="include-uploads" className="text-xs cursor-pointer">
              User uploads
            </Label>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <IconPhoto className="size-10 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">No media files found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <MediaCard key={item.token} item={item} showCreator onSelect={() => handleMediaSelect(item)} />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          {nextCursor && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconLoader2 className="size-4 animate-spin" />
                  Loading more...
                </div>
              ) : (
                <span className="text-muted-foreground/50 text-sm">
                  Scroll for more
                </span>
              )}
            </div>
          )}
        </>
      )}
      <MediaDetailModal
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
