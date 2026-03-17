import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@storyteller/ui-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import {
  UsersApi,
  GalleryModalApi,
  FilterMediaClasses,
  FilterMediaType,
} from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBorderAll,
  faImage,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import {
  getThumbnailUrl,
  THUMBNAIL_SIZES,
  PLACEHOLDER_IMAGES,
} from "@storyteller/common";
import { Lightbox } from "../../components/lightbox/lightbox";

// ── Types ──────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage: string | null;
  createdAt: string;
  mediaClass: string;
  batchImageToken?: string;
}

const PAGE_SIZE = 60;

const FILTERS = [
  { id: "all", label: "All", icon: faBorderAll },
  { id: "image", label: "Images", icon: faImage },
  { id: "video", label: "Videos", icon: faVideo },
];

const getFilterMediaClass = (filter: string): FilterMediaClasses[] | undefined => {
  switch (filter) {
    case "image":
      return [FilterMediaClasses.IMAGE];
    case "video":
      return [FilterMediaClasses.VIDEO];
    default:
      return [FilterMediaClasses.IMAGE, FilterMediaClasses.VIDEO];
  }
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const getLabel = (item: any) => {
  if (item.maybe_title) return item.maybe_title;
  switch (item.media_class) {
    case "image":
      return "Image Generation";
    case "video":
      return "Video Generation";
    default:
      return "Generation";
  }
};

// ── Component ──────────────────────────────────────────────────────────────

export default function Library() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const isLoadingRef = useRef(false);

  // Lightbox state
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const api = useMemo(() => new GalleryModalApi(), []);

  // Auth check
  useEffect(() => {
    const checkSession = async () => {
      const usersApi = new UsersApi();
      const response = await usersApi.GetSession();
      if (
        response.success &&
        response.data?.loggedIn &&
        response.data.user
      ) {
        setUsername(response.data.user.username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  // Map API item to GalleryItem
  const mapApiItem = useCallback((item: any): GalleryItem => {
    const isVideo = item.media_class === "video";
    // Video thumbnails are broken — use null so we show a video icon instead
    const thumbnail = isVideo
      ? null
      : getThumbnailUrl(item.media_links?.maybe_thumbnail_template, {
        width: THUMBNAIL_SIZES.MEDIUM,
      }) || item.media_links?.cdn_url || null;

    return {
      id: item.token,
      label: getLabel(item),
      thumbnail,
      fullImage: item.media_links?.cdn_url || null,
      createdAt: item.created_at,
      mediaClass: item.media_class || "image",
      batchImageToken: item.maybe_batch_token,
    };
  }, []);

  // Load items
  const loadItems = useCallback(
    async (reset = false) => {
      if (!username) return;
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);

      try {
        const filterMediaClasses = getFilterMediaClass(activeFilter);
        const response = await api.listUserMediaFiles({
          username,
          filter_media_classes: filterMediaClasses,
          include_user_uploads: true,
          page_index: reset ? 0 : pageIndex,
          page_size: PAGE_SIZE,
        });

        if (response.success && response.data) {
          const newItems = response.data
            .filter((item: any) => item.media_type !== FilterMediaType.SCENE_JSON)
            .map(mapApiItem);

          if (reset) {
            setAllItems(newItems);
          } else {
            setAllItems((prev) => [...prev, ...newItems]);
          }

          const current = response.pagination?.current ?? 0;
          const total = response.pagination?.total_page_count ?? 1;
          setPageIndex(current + 1);
          setHasMore(current + 1 < total);
        }
      } catch {
        // ignore
      }

      setLoading(false);
      setInitialLoading(false);
      isLoadingRef.current = false;
    },
    [username, activeFilter, pageIndex, api, mapApiItem],
  );

  // Initial load + filter change
  useEffect(() => {
    if (!username) return;
    setAllItems([]);
    setPageIndex(0);
    setHasMore(true);
    setInitialLoading(true);
    // Need to reset loading ref since we're starting fresh
    isLoadingRef.current = false;
    loadItems(true);
  }, [username, activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll via window scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollBottom =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      if (scrollBottom < 400 && hasMore && !isLoadingRef.current) {
        loadItems();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadItems]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const grouped: Record<string, GalleryItem[]> = {};
    for (const item of allItems) {
      const dateKey = formatDate(item.createdAt);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    }
    return Object.entries(grouped).sort(
      (a, b) =>
        new Date(b[1][0].createdAt).getTime() -
        new Date(a[1][0].createdAt).getTime(),
    );
  }, [allItems]);

  // Flat list for navigation
  const flatItems = useMemo(
    () => groupedItems.flatMap(([, items]) => items),
    [groupedItems],
  );

  // Lightbox navigation
  const currentIndex = lightboxItem
    ? flatItems.findIndex((i) => i.id === lightboxItem.id)
    : -1;

  const navigatePrev =
    currentIndex > 0
      ? () => {
        const prev = flatItems[currentIndex - 1];
        setLightboxItem(prev);
      }
      : undefined;

  const navigateNext =
    currentIndex >= 0 && currentIndex < flatItems.length - 1
      ? () => {
        const next = flatItems[currentIndex + 1];
        setLightboxItem(next);
      }
      : undefined;

  const handleItemDeleted = useCallback((id: string) => {
    setAllItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Not logged in
  if (isLoggedIn === false) {
    return (
      <div className="relative min-h-screen w-full bg-dots flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">My Library</h1>
          <p className="text-white/60 text-lg max-w-md mx-auto">
            Sign in to view your generated images and videos.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/login">
              <Button
                variant="primary"
                className="bg-white text-black hover:bg-white/90 text-sm font-semibold px-6 py-2.5 rounded-lg"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="primary"
                className="text-sm font-semibold px-6 py-2.5 rounded-lg"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading auth
  if (isLoggedIn === null) {
    return (
      <div className="relative min-h-screen w-full bg-dots flex items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-white/60" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-dots pt-20 pb-8 px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        {/* Header — sticky below navbar */}
        <div className="sticky top-16 z-10 -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12 pb-4 pt-4 bg-[#101014]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">My Library</h1>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-ui-controls/40 rounded-lg p-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFilter === filter.id
                      ? "bg-ui-controls text-white"
                      : "text-white/60 hover:text-white"
                    }`}
                >
                  <FontAwesomeIcon icon={filter.icon} className="text-xs" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div>
          {initialLoading && allItems.length === 0 ? (
            // Skeleton grid
            <div className="space-y-6">
              <div>
                <div className="h-4 w-24 rounded bg-white/[0.06] mb-3" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <div
                        className="h-full w-full bg-white/[0.06]"
                        style={{
                          animation: `pulse 1.8s ease-in-out ${i * 0.07}s infinite`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 0.8; }
                }
              `}</style>
            </div>
          ) : allItems.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-white/40 text-sm mb-4">
                No items yet. Start generating!
              </p>
              <div className="flex gap-3">
                <Link to="/create-image">
                  <Button variant="primary" className="text-sm px-4 py-2">
                    Create Image
                  </Button>
                </Link>
                <Link to="/create-video">
                  <Button
                    variant="secondary"
                    className="text-sm px-4 py-2 border border-ui-panel-border"
                  >
                    Create Video
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedItems.map(([date, dateItems]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-white/50 mb-2">
                    {date}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {dateItems.map((item) => (
                      <button
                        key={item.id}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-ui-controls/40 transition-all hover:ring-2 hover:ring-primary-400/60 focus:outline-none focus:ring-2 focus:ring-primary-400"
                        onClick={() => {
                          setLightboxItem(item);
                          setLightboxOpen(true);
                        }}
                      >
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.label}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.dataset.fallback) return;
                              target.dataset.fallback = "1";
                              target.src = PLACEHOLDER_IMAGES.DEFAULT;
                              target.style.opacity = "0.3";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FontAwesomeIcon
                              icon={
                                item.mediaClass === "video" ? faVideo : faImage
                              }
                              className="text-xl text-white/20"
                            />
                          </div>
                        )}
                        {/* Video badge */}
                        {item.mediaClass === "video" && (
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
                            <FontAwesomeIcon
                              icon={faVideo}
                              className="text-[8px]"
                            />
                            Video
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {loading && allItems.length > 0 && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner className="h-8 w-8 text-white/60" />
                </div>
              )}
              {!hasMore && allItems.length > 0 && (
                <div className="flex justify-center py-4 text-white/40 text-xs">
                  No more items
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxItem(null);
        }}
        mediaToken={lightboxItem?.id}
        cdnUrl={lightboxItem?.fullImage}
        mediaClass={lightboxItem?.mediaClass}
        batchImageToken={lightboxItem?.batchImageToken}
        onNavigatePrev={navigatePrev}
        onNavigateNext={navigateNext}
        onDeleted={handleItemDeleted}
      />
    </div>
  );
}
