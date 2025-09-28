import { Modal } from "@storyteller/ui-modal";
import { LightboxModal } from "@storyteller/ui-lightbox-modal";
import { Button } from "@storyteller/ui-button";
import { CloseButton } from "@storyteller/ui-close-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  FilterMediaClasses,
  FilterMediaType,
  GalleryModalApi,
  UsersApi,
} from "@storyteller/api";
import { twMerge } from "tailwind-merge";
import { GalleryDraggableItem } from "./GalleryDraggableItem";
import { useSignals } from "@preact/signals-react/runtime";
import {
  galleryModalVisibleDuringDrag,
  galleryReopenAfterDragSignal,
  galleryModalVisibleViewMode,
  galleryModalLightboxMediaId,
  galleryModalLightboxImage,
  galleryModalLightboxVisible,
} from "./galleryModalSignals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faBorderAll,
  faImage,
  faVideo,
  faCube,
  faUpload,
  faExpand,
  faCompress,
  faArrowsRotate,
} from "@fortawesome/pro-solid-svg-icons";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { Tooltip } from "@storyteller/ui-tooltip";

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
  assetType?: string;
}

interface GroupedItems {
  [date: string]: GalleryItem[];
}

type ModalMode = "select" | "view";

interface GalleryModalProps {
  onClose?: () => void;
  mode: ModalMode;
  selectedItemIds?: string[];
  onSelectItem?: (id: string) => void;
  maxSelections?: number;
  onUseSelected?: (selectedItems: GalleryItem[]) => void;
  onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined
  ) => Promise<void>;
  isOpen?: boolean;
  forceFilter?: string;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
}

export const GalleryModal = React.memo(
  ({
    onClose,
    mode = "view",
    selectedItemIds = [],
    onSelectItem,
    maxSelections = 4,
    onUseSelected,
    onDownloadClicked,
    onAddToSceneClicked,
    isOpen,
    forceFilter,
    onEditClicked,
  }: GalleryModalProps) => {
    const [loading, setLoading] = useState(false);
    // Lightbox state is now handled via signals
    const lightboxImageSignal = galleryModalLightboxImage;
    const lightboxVisibleSignal = galleryModalLightboxVisible;
    const [failedImageUrls] = useState<Set<string>>(new Set());
    const [username, setUsername] = useState<string>("");
    const forceFilterRef = useRef(forceFilter);
    const [activeFilter, setActiveFilter] = useState(forceFilter || "all");

    // If forceFilter is provided, always use it
    useEffect(() => {
      if (forceFilterRef.current) {
        setActiveFilter(forceFilterRef.current);
      }
    }, [forceFilterRef]);
    const minColumns = 3;
    const maxColumns = 12;
    // Default gridColumns to 5
    const defaultGridColumns = 5;
    const [sliderValue, setSliderValue] = useState(
      maxColumns - (defaultGridColumns - minColumns)
    );
    const gridColumns = maxColumns - (sliderValue - minColumns);
    const [imageFit, setImageFit] = useState<"cover" | "contain">("contain");
    const [allItems, setAllItems] = useState<GalleryItem[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // NB: We've got some kind of cursoring issue where subsequent pages are not requested.
    // For now, let's set the pagination limit really high.
    const pageSize = 100;

    const imageUrl = lightboxImageSignal.value?.fullImage || "";

    const api = useMemo(() => new GalleryModalApi(), []);
    const usersApi = useMemo(() => new UsersApi(), []);

    const formatDate = useCallback((date: string) => {
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }, []);

    const groupItemsByDate = useCallback(
      (items: GalleryItem[]) => {
        const grouped = items.reduce((acc: GroupedItems, item) => {
          const dateKey = formatDate(item.createdAt);
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(item);
          return acc;
        }, {});

        // Sort dates in descending order
        return Object.fromEntries(
          Object.entries(grouped).sort(
            (a, b) =>
              new Date(b[1][0].createdAt).getTime() -
              new Date(a[1][0].createdAt).getTime()
          )
        );
      },
      [formatDate]
    );

    const handleImageError = useCallback(
      (url: string) => {
        console.error(`Failed to load gallery modal image: ${url}`);
        failedImageUrls.add(url);
      },
      [failedImageUrls]
    );

    useEffect(() => {
      const getUsername = async () => {
        const session = await usersApi.GetSession();
        if (session.success && session.data?.user) {
          setUsername(session.data.user.username);
        }
      };
      if (isOpen || (mode === "view" && galleryModalVisibleViewMode.value)) {
        getUsername();
      }
    }, [usersApi, mode, galleryModalVisibleViewMode.value, isOpen]);

    // filter state
    const FILTERS = [
      { id: "all", label: "All", icon: <FontAwesomeIcon icon={faBorderAll} /> },
      { id: "image", label: "Image", icon: <FontAwesomeIcon icon={faImage} /> },
      { id: "video", label: "Video", icon: <FontAwesomeIcon icon={faVideo} /> },
      { id: "3d", label: "3D Object", icon: <FontAwesomeIcon icon={faCube} /> },
      {
        id: "uploaded",
        label: "Uploaded",
        icon: <FontAwesomeIcon icon={faUpload} />,
      },
    ];

    // Map filter to API/media class
    const getFilterMediaClass = (filter: string) => {
      switch (filter) {
        case "image":
          return [FilterMediaClasses.IMAGE];
        case "video":
          return [FilterMediaClasses.VIDEO];
        case "3d":
          return [FilterMediaClasses.DIMENSIONAL];
        case "uploaded":
          return [
            FilterMediaClasses.IMAGE,
            FilterMediaClasses.VIDEO,
            FilterMediaClasses.DIMENSIONAL,
          ];
        default:
          return undefined;
      }
    };

    const loadItems = async (reset = false) => {
      if (!username) return;
      setLoading(true);
      try {
        let response = null;
        const filterMediaClasses = getFilterMediaClass(activeFilter);
        const query = {
          filter_media_classes: filterMediaClasses,
          username: username,
          include_user_uploads:
            activeFilter === "uploaded" ||
            activeFilter === "all" ||
            activeFilter === "3d" ||
            activeFilter === "image",
          user_uploads_only: activeFilter === "uploaded",
          page_index: reset ? 0 : pageIndex,
          page_size: pageSize,
        };
        response = await api.listUserMediaFiles(query);

        if (response.success && response.data) {
          const thumbnail_size = 250;
          const newItems = response.data
            .filter(
              (item: any) => item.media_type !== FilterMediaType.SCENE_JSON
            )
            .map((item: any) => ({
              id: item.token,
              label: item.maybe_title || "Image Generation",
              thumbnail:
                item.media_class === "video"
                  ? item.media_links.maybe_video_previews.animated
                  : item.media_class === "dimensional"
                  ? item.cover_image?.maybe_cover_image_public_bucket_url
                  : item.media_links.maybe_thumbnail_template?.replace(
                      "{WIDTH}",
                      thumbnail_size.toString()
                    ),
              fullImage: item.media_links.cdn_url,
              createdAt: item.created_at,
              mediaClass:
                item.media_class ||
                (item.filter_media_classes
                  ? item.filter_media_classes[0]
                  : "image"),
              // assetType for 3D assets so drop handlers can decide between character vs object
              assetType:
                item.media_class === "dimensional"
                  ? item.maybe_animation_type ||
                    item.origin_product_category === "character" ||
                    (item.origin &&
                      item.origin.product_category === "character")
                    ? "character"
                    : "object"
                  : undefined,
            }));
          setAllItems((prev) => (reset ? newItems : [...prev, ...newItems]));
          // Pagination logic
          const current = response.pagination?.current ?? 0;
          const total = response.pagination?.total_page_count ?? 1;
          setPageIndex(current + 1);
          setHasMore(current + 1 < total);
        }
      } catch (error) {
        console.error("Failed to fetch library items:", error);
      }
      setLoading(false);
    };

    // refresh logic
    const refreshGallery = useCallback(() => {
      setAllItems([]);
      setPageIndex(0);
      setHasMore(true);
      loadItems(true);
    }, [setAllItems, setPageIndex, setHasMore, loadItems]);

    useEffect(() => {
      // Refresh every time the modal is opened
      const modalIsOpen =
        mode === "view"
          ? galleryModalVisibleViewMode.value
          : typeof isOpen === "boolean"
          ? isOpen
          : true;
      if (modalIsOpen && username) {
        refreshGallery();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      mode,
      isOpen,
      galleryModalVisibleViewMode.value,
      username,
      activeFilter,
    ]);

    const handleItemClick = useCallback(
      (item: GalleryItem) => {
        if (mode === "select" && onSelectItem) {
          onSelectItem(item.id);
        } else {
          lightboxImageSignal.value = item;
          lightboxVisibleSignal.value = true;
          galleryModalLightboxMediaId.value = item.id;
        }
      },
      [mode, onSelectItem]
    );

    const handleCloseLightbox = useCallback(() => {
      lightboxVisibleSignal.value = false;
      lightboxImageSignal.value = null;
      galleryModalLightboxMediaId.value = null;
    }, []);

    const handleDeselectAll = useCallback(() => {
      selectedItemIds.forEach((id: any) => onSelectItem?.(id));
    }, [selectedItemIds, onSelectItem]);

    const handleUseSelected = useCallback(() => {
      const selectedItems = Object.values(groupItemsByDate(allItems))
        .flat()
        .filter((item) => selectedItemIds.includes(item.id));
      onUseSelected?.(selectedItems);
    }, [groupItemsByDate, selectedItemIds, onUseSelected]);

    const handleItemDeleted = useCallback((id: string) => {
      setAllItems((prev) => prev.filter((it) => it.id !== id));
    }, []);

    useSignals();

    // Synchronize lightbox image when external media id signal is set
    useEffect(() => {
      if (galleryModalLightboxMediaId.value && allItems.length > 0) {
        const target = allItems.find(
          (it) => it.id === galleryModalLightboxMediaId.value
        );
        if (target) {
          lightboxImageSignal.value = target;
        }
      }
    }, [galleryModalLightboxMediaId.value, allItems]);

    // Compute gap class based on gridColumns
    let gapClass = "gap-0.5";
    if (gridColumns <= 4) gapClass = "gap-1.5";
    else if (gridColumns <= 7) gapClass = "gap-1";

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        hasMore &&
        !loading
      ) {
        loadItems();
      }
    };

    return (
      <>
        <Modal
          resizable={mode === "view"}
          isOpen={
            mode === "view"
              ? galleryModalVisibleViewMode.value &&
                galleryModalVisibleDuringDrag.value
              : typeof isOpen === "boolean"
              ? isOpen
              : true
          }
          onClose={() => {
            if (mode === "view") {
              onClose?.() || (galleryModalVisibleViewMode.value = false);
            } else {
              onClose?.();
            }
          }}
          className={twMerge(
            "h-[620px] max-w-4xl rounded-xl",
            mode === "view" &&
              "h-[640px] min-h-[640px] min-w-[56rem] w-[56rem] max-w-none"
          )}
          childPadding={false}
          showClose={false}
          draggable={mode === "view"}
          allowBackgroundInteraction={mode === "view" ? true : false}
          closeOnOutsideClick={mode === "view" ? false : true}
        >
          {mode === "view" && (
            <Modal.DragHandle>
              <div className="absolute left-0 top-0 z-[50] h-[60px] w-full cursor-move" />
            </Modal.DragHandle>
          )}
          <div className="flex h-full flex-col">
            <div className="border-b border-ui-panel-border p-4 py-3 bg-ui-panel rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">
                    {mode === "select" ? "Select Images" : "My Library"}
                  </h2>
                  {mode === "view" && (
                    <div className="flex items-center relative z-[51]">
                      <input
                        type="checkbox"
                        id="gallery-reopen-after-drag"
                        checked={galleryReopenAfterDragSignal.value}
                        onChange={(e) =>
                          (galleryReopenAfterDragSignal.value =
                            e.target.checked)
                        }
                        className="h-4 w-4 cursor-pointer rounded-lg border-gray-300 bg-gray-700 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="gallery-reopen-after-drag"
                        className="ml-2 cursor-pointer select-none text-sm text-base-fg/70"
                      >
                        Reopen after adding
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 items-center">
                  {/* Refresh button */}
                  <Tooltip
                    position="top"
                    content="Refresh list"
                    closeOnClick={true}
                  >
                    <Button
                      variant="action"
                      onClick={refreshGallery}
                      className="relative z-[51] h-9 w-9 bg-ui-controls/60 hover:bg-ui-controls/90"
                      disabled={loading}
                      aria-label="Refresh list"
                    >
                      <FontAwesomeIcon
                        icon={faArrowsRotate}
                        className="text-lg text-base-fg"
                      />
                    </Button>
                  </Tooltip>
                  {/* Image fit toggle button */}
                  <Tooltip
                    position="top"
                    content="Toggle image fit"
                    closeOnClick={true}
                  >
                    <Button
                      variant="action"
                      onClick={() =>
                        setImageFit((fit) =>
                          fit === "cover" ? "contain" : "cover"
                        )
                      }
                      className="relative z-[51] h-9 w-9 bg-ui-controls/60 hover:bg-ui-controls/90"
                    >
                      <FontAwesomeIcon
                        icon={imageFit === "cover" ? faExpand : faCompress}
                        className="text-lg text-base-fg"
                      />
                    </Button>
                  </Tooltip>

                  {/* Slider */}
                  <div className="w-48 mx-3 relative z-[51] flex items-center gap-2">
                    <SliderV2
                      min={minColumns}
                      max={maxColumns}
                      value={sliderValue}
                      onChange={setSliderValue}
                      step={1}
                      variant="classic"
                      showTooltip={false}
                      className="w-full"
                      showProgressBar={false}
                      tooltipContent={`${
                        maxColumns - (sliderValue - minColumns)
                      } columns`}
                    />
                  </div>
                  {/* Filter popover */}
                  <Tooltip
                    position="top"
                    content={
                      forceFilterRef.current ? "Filter locked" : "Filter"
                    }
                    closeOnClick={true}
                  >
                    <PopoverMenu
                      panelTitle="Filter"
                      position="bottom"
                      align="end"
                      buttonClassName={`relative z-[51] mr-3 ${
                        forceFilterRef.current
                          ? "opacity-70 pointer-events-none"
                          : ""
                      }`}
                      panelClassName="min-w-36"
                      items={FILTERS.map((f) => ({
                        label: f.label,
                        selected: activeFilter === f.id,
                        icon: f.icon,
                        // Use a custom property that will be passed through but not cause type errors
                        customProps: {
                          disabled: forceFilterRef.current !== undefined,
                        },
                      }))}
                      onSelect={(item) => {
                        // Only allow filter changes if no forceFilter was provided
                        if (!forceFilterRef.current) {
                          const filter = FILTERS.find(
                            (f) => f.label === item.label
                          );
                          if (filter) setActiveFilter(filter.id);
                        }
                      }}
                      triggerIcon={<FontAwesomeIcon icon={faFilter} />}
                      triggerLabel={
                        FILTERS.find((f) => f.id === activeFilter)?.label
                      }
                      mode="toggle"
                      showIconsInList={true}
                    />
                  </Tooltip>
                  {mode === "view" && <Modal.ExpandButton />}
                  <CloseButton
                    onClick={() => {
                      if (mode === "view") {
                        galleryModalVisibleViewMode.value = false;
                      } else {
                        onClose?.();
                      }
                    }}
                    className="relative z-[51]"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto bg-ui-panel"
              onScroll={handleScroll}
            >
              {loading && allItems.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-base-fg/60">
                    <LoadingSpinner className="h-12 w-12" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-4">
                  {Object.entries(groupItemsByDate(allItems)).map(
                    ([date, dateItems]) => {
                      const filteredItems = dateItems.filter((item) => {
                        if ((item as any).mediaType === "scene_json")
                          return false;
                        if (activeFilter === "3d") {
                          return item.mediaClass === "dimensional";
                        }
                        if (activeFilter === "image") {
                          return item.mediaClass === "image";
                        }
                        if (activeFilter === "video") {
                          return item.mediaClass === "video";
                        }
                        if (activeFilter === "all") {
                          return (
                            item.mediaClass !== "audio" &&
                            (item as any).mediaType !== "scene_json"
                          );
                        }
                        return true;
                      });
                      if (filteredItems.length === 0) return null;
                      return (
                        <div key={date}>
                          <h3 className="text-md mb-2 font-medium text-base-fg/60">
                            {date}
                          </h3>
                          <div
                            className={twMerge("grid", gapClass)}
                            style={{
                              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                            }}
                          >
                            {filteredItems.map((item) => (
                              <GalleryDraggableItem
                                key={item.id}
                                item={item}
                                mode={mode}
                                activeFilter={activeFilter}
                                selected={selectedItemIds.includes(item.id)}
                                onClick={() => handleItemClick(item)}
                                onImageError={() =>
                                  handleImageError(item.thumbnail!)
                                }
                                disableTooltipAndBadge={mode === "select"}
                                imageFit={imageFit}
                                onDeleted={handleItemDeleted}
                                onEditClicked={onEditClicked}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                  {loading && allItems.length > 0 && (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner className="h-8 w-8" />
                    </div>
                  )}
                  {!hasMore && allItems.length > 0 && (
                    <div className="flex justify-center py-4 text-base-fg/40 text-xs">
                      No more items
                    </div>
                  )}
                </div>
              )}
            </div>

            {mode === "select" && (
              <div className="flex items-center justify-between border-t border-ui-panel-border bg-ui-panel p-4 rounded-b-xl">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-base-fg/80">
                    {selectedItemIds.length}/{maxSelections} selected
                  </div>
                  {selectedItemIds.length > 0 && (
                    <span className="text-base-fg/10">|</span>
                  )}
                  {selectedItemIds.length > 0 && (
                    <button
                      onClick={handleDeselectAll}
                      className="text-sm text-base-fg/60 hover:text-base-fg"
                    >
                      Deselect All
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleUseSelected}
                  disabled={selectedItemIds.length === 0}
                >
                  Use selected
                </Button>
              </div>
            )}
          </div>
        </Modal>

        {mode === "view" && (
          <LightboxModal
            isOpen={lightboxVisibleSignal.value}
            onClose={handleCloseLightbox}
            onCloseGallery={() => (galleryModalVisibleViewMode.value = false)}
            imageUrl={imageUrl}
            imageAlt={lightboxImageSignal.value?.label || ""}
            onImageError={() => imageUrl && handleImageError(imageUrl)}
            title={lightboxImageSignal.value?.label}
            createdAt={lightboxImageSignal.value?.createdAt}
            downloadUrl={imageUrl}
            mediaId={lightboxImageSignal.value?.id}
            onDownloadClicked={onDownloadClicked}
            onAddToSceneClicked={onAddToSceneClicked}
            mediaClass={lightboxImageSignal.value?.mediaClass}
            onEditClicked={onEditClicked}
          />
        )}
      </>
    );
  }
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;
