import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import {
  UsersApi,
  GalleryModalApi,
  FilterMediaClasses,
} from "@storyteller/api";
import { getThumbnailUrl, THUMBNAIL_SIZES } from "@storyteller/common";

interface LibraryImage {
  token: string;
  url: string;
  thumbnailUrl: string;
}

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: LibraryImage[]) => void;
  maxSelect: number;
}

const PAGE_SIZE = 60;

export const ImagePickerModal = ({
  isOpen,
  onClose,
  onSelect,
  maxSelect,
}: ImagePickerModalProps) => {
  const [username, setUsername] = useState<string | null>(null);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const api = useMemo(() => new GalleryModalApi(), []);

  // Auth check
  useEffect(() => {
    if (!isOpen) return;
    const checkSession = async () => {
      const usersApi = new UsersApi();
      const response = await usersApi.GetSession();
      if (response.success && response.data?.loggedIn && response.data.user) {
        setUsername(response.data.user.username);
      }
    };
    checkSession();
  }, [isOpen]);

  // Load images
  const loadImages = useCallback(
    async (reset = false) => {
      if (!username || isLoadingRef.current) return;
      isLoadingRef.current = true;
      setLoading(true);

      try {
        const response = await api.listUserMediaFiles({
          username,
          filter_media_classes: [FilterMediaClasses.IMAGE],
          include_user_uploads: true,
          page_index: reset ? 0 : pageIndex,
          page_size: PAGE_SIZE,
        });

        if (response.success && response.data) {
          const newImages: LibraryImage[] = response.data
            .filter((item: any) => item.media_class === "image")
            .map((item: any) => ({
              token: item.token,
              url: item.media_links?.cdn_url ?? "",
              thumbnailUrl:
                getThumbnailUrl(item.media_links?.maybe_thumbnail_template, {
                  width: THUMBNAIL_SIZES.MEDIUM,
                }) ??
                item.media_links?.cdn_url ??
                "",
            }))
            .filter((img: LibraryImage) => img.url);

          if (reset) {
            setImages(newImages);
          } else {
            setImages((prev) => [...prev, ...newImages]);
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
      isLoadingRef.current = false;
    },
    [username, pageIndex, api],
  );

  // Initial load when opened
  useEffect(() => {
    if (!username || !isOpen) return;
    setImages([]);
    setSelected(new Set());
    setPageIndex(0);
    setHasMore(true);
    isLoadingRef.current = false;
    loadImages(true);
  }, [username, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (scrollBottom < 300 && hasMore && !isLoadingRef.current) {
        loadImages();
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadImages]);

  const toggleSelect = (token: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(token)) {
        next.delete(token);
      } else if (next.size < maxSelect) {
        next.add(token);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedImages = images.filter((img) => selected.has(img.token));
    onSelect(selectedImages);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pick from Library"
      showClose
      className="max-w-7xl"
    >
      <div className="flex flex-col" style={{ height: "min(80vh, 800px)" }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {images.length === 0 && loading ? (
            <div className="flex h-full items-center justify-center">
              <FontAwesomeIcon
                icon={faSpinnerThird}
                className="animate-spin text-2xl text-white/40"
              />
            </div>
          ) : images.length === 0 ? (
            <div className="flex h-full items-center justify-center text-white/40 text-sm">
              No images found
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {images.map((img) => {
                const isSelected = selected.has(img.token);
                return (
                  <button
                    key={img.token}
                    onClick={() => toggleSelect(img.token)}
                    className={`group relative aspect-square overflow-hidden rounded-lg transition-all ${
                      isSelected
                        ? "ring-2 ring-primary-400 ring-offset-2 ring-offset-[#1a1a20]"
                        : "hover:ring-2 hover:ring-white/30"
                    }`}
                  >
                    <img
                      src={img.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary-400/20">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-400 text-white">
                          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {loading && images.length > 0 && (
            <div className="flex justify-center py-4">
              <FontAwesomeIcon
                icon={faSpinnerThird}
                className="animate-spin text-lg text-white/40"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <span className="text-sm text-white/50">
            {selected.size} of {maxSelect} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-4 py-1.5 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-4 py-1.5 text-sm"
            >
              Use selected
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
