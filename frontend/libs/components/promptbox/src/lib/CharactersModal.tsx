import { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "@storyteller/ui-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faArrowLeft,
  faUpload,
  faUserGroup,
  faSpinnerThird,
  faImages,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import {
  CharactersApi,
  Character,
  MediaUploadApi,
  downloadFileFromUrl,
} from "@storyteller/api";
import { toast } from "@storyteller/ui-toaster";
import { v4 as uuidv4 } from "uuid";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { useCharactersStore } from "./promptStore";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { Label } from "@storyteller/ui-label";

interface CharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter?: (character: Character) => void;
}

type ModalView = "list" | "create";

interface UploadedImage {
  file: File;
  url: string;
  mediaToken?: string;
}

export const CharactersModal = ({
  isOpen,
  onClose,
  onSelectCharacter,
}: CharactersModalProps) => {
  const [view, setView] = useState<ModalView>("list");

  const handleClose = () => {
    setView("list");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={view === "list" ? "Characters" : undefined}
      className="max-w-[800px] min-h-[600px] max-h-[60vh] flex flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "list" ? (
          <CharacterListView
            onCreateClick={() => setView("create")}
            onSelectCharacter={onSelectCharacter}
          />
        ) : (
          <NewCharacterView
            onBack={() => setView("list")}
            onCreated={() => setView("list")}
          />
        )}
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Character List View
// ---------------------------------------------------------------------------

const CharacterListView = ({
  onCreateClick,
  onSelectCharacter,
}: {
  onCreateClick: () => void;
  onSelectCharacter?: (character: Character) => void;
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const storeSetCharacters = useCharactersStore((s) => s.setCharacters);
  const storeSetLoaded = useCharactersStore((s) => s.setLoaded);

  const fetchCharacters = useCallback(
    async (nextCursor?: number) => {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;

      try {
        const api = new CharactersApi();
        const res = await api.ListCharacters({
          cursor: nextCursor,
        });

        if (res.success && res.data) {
          setCharacters((prev) => {
            const updated = nextCursor ? [...prev, ...res.data!] : res.data!;
            // Sync to global store for @-mention system
            storeSetCharacters(
              updated.map((c) => ({
                character_token: c.token,
                name: c.name,
                avatar_image_url: c.maybe_avatar?.cdn_url,
              })),
            );
            storeSetLoaded(true);
            return updated;
          });
          const nextPage = res.pagination?.next_cursor;
          setCursor(nextPage ?? undefined);
          setHasMore(!!nextPage);
        }
      } catch {
        // API not available yet - expected during development
        storeSetLoaded(true);
      } finally {
        setLoading(false);
        loadingMoreRef.current = false;
      }
    },
    [storeSetCharacters, storeSetLoaded],
  );

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && cursor) {
          fetchCharacters(cursor);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, cursor, fetchCharacters]);

  return (
    <div className="flex flex-col">
      {loading && characters.length === 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-transparent">
              <div className="aspect-square w-full overflow-hidden">
                <div
                  className="h-full w-full bg-white/[0.06]"
                  style={{
                    animation: `charPulse 1.8s ease-in-out ${i * 0.07}s infinite`,
                  }}
                />
              </div>
              <div className="px-2 py-1.5 flex justify-center">
                <div
                  className="h-3 w-2/3 rounded bg-white/[0.06]"
                  style={{
                    animation: `charPulse 1.8s ease-in-out ${i * 0.07 + 0.1}s infinite`,
                  }}
                />
              </div>
            </div>
          ))}
          <style>{`
            @keyframes charPulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {/* Create New card */}
          <button
            onClick={onCreateClick}
            className="flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-white/10 bg-white/5 text-white/60 transition-colors hover:border-white/25 hover:text-white/80"
          >
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="text-lg" />
              <span className="text-sm font-medium">Create New</span>
            </div>
          </button>

          {characters.map((character) => (
            <button
              key={character.token}
              onClick={() => onSelectCharacter?.(character)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-transparent bg-white/5 transition-colors hover:border-white/25 hover:bg-white/10"
            >
              <div className="aspect-square w-full overflow-hidden bg-white/5">
                {character.maybe_avatar?.cdn_url ? (
                  <img
                    src={character.maybe_avatar.cdn_url}
                    alt={character.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <FontAwesomeIcon icon={faUserGroup} className="text-2xl" />
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium text-white/80">
                  {character.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="text-white/30 animate-spin"
          />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// New Character View
// ---------------------------------------------------------------------------

const NewCharacterView = ({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) => {
  const addCharacterToStore = useCharactersStore((s) => s.addCharacter);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (imageFiles.length === 0) {
        toast.error("Please upload image files");
        return;
      }

      // Only keep the first file (single image)
      const file = imageFiles[0]!;
      const newImages: UploadedImage[] = [
        { file, url: URL.createObjectURL(file) },
      ];

      // Replace any existing image
      setImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.url));
        return newImages;
      });

      // Upload each image to get media tokens
      setUploading(true);
      const uploadApi = new MediaUploadApi();
      const updatedImages: UploadedImage[] = [];

      for (const img of newImages) {
        try {
          const res = await uploadApi.UploadImage({
            uuid: uuidv4(),
            blob: img.file,
            fileName: img.file.name,
            maybe_title: `character_ref_${name || "unnamed"}`,
          });

          if (res.success && res.data) {
            updatedImages.push({ ...img, mediaToken: res.data });
          } else {
            toast.error(`Failed to upload ${img.file.name}`);
            updatedImages.push(img);
          }
        } catch {
          toast.error(`Failed to upload ${img.file.name}`);
          updatedImages.push(img);
        }
      }

      setImages((prev) =>
        prev.map((existing) => {
          const updated = updatedImages.find((u) => u.url === existing.url);
          return updated || existing;
        }),
      );
      setUploading(false);
    },
    [name],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    },
    [isDragging],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a character name");
      return;
    }

    const uploadedImages = images.filter((img) => img.mediaToken);
    if (uploadedImages.length < 1) {
      toast.error("Please upload a reference image");
      return;
    }

    setCreating(true);
    try {
      const api = new CharactersApi();
      const res = await api.CreateCharacter({
        image_media_token: uploadedImages[0]!.mediaToken!,
        model: "seedance_2p0",
        uuid_idempotency_token: uuidv4(),
      });

      if (res.success && res.data) {
        toast.success(`Character "${name.trim()}" created!`);
        // Add to global store so it appears in @-mentions immediately
        addCharacterToStore({
          character_token: res.data.inference_job_token,
          name: name.trim(),
          avatar_image_url: uploadedImages[0]!.url,
        });
        // Cleanup object URLs
        images.forEach((img) => URL.revokeObjectURL(img.url));
        onCreated();
      } else {
        toast.error(res.errorMessage || "Failed to create character");
      }
    } catch {
      toast.error("Failed to create character");
    } finally {
      setCreating(false);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3 pb-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center text-base-fg/60 transition-colors hover:text-base-fg"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2 className="text-xl font-bold text-base-fg">New Character</h2>
      </div>

      {/* Image upload area */}
      <div
        ref={dropZoneRef}
        className={twMerge(
          "flex h-56 max-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition-colors overflow-hidden",
          isDragging && "border-blue-400 bg-blue-500/10",
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {images.length > 0 ? (
          <div
            className="group relative flex h-full w-full items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[0]!.url}
              alt="Reference"
              className="max-h-full max-w-full object-contain"
            />
            {!images[0]!.mediaToken && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  className="text-white animate-spin"
                />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage(0);
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500"
            >
              <FontAwesomeIcon icon={faXmark} className="text-sm" />
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-white/60">
            <FontAwesomeIcon
              icon={faUpload}
              className="mb-2 text-xl text-white/40"
            />
            <p className="text-sm">Upload reference image</p>
            <p className="mb-3 text-xs text-white/40">
              Click or drag an image here
            </p>
            <div
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20"
              >
                <FontAwesomeIcon icon={faImages} className="text-xs" />
                Choose from Library
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20"
              >
                <FontAwesomeIcon icon={faUpload} className="text-xs" />
                Upload Image
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Name input */}
      <div className="flex flex-col">
        <Label htmlFor="character-name">Name</Label>
        <Input
          id="character-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name"
          inputClassName="bg-white/[0.07] hover:border-ui-panel-border"
        />
      </div>

      {/* Description input */}
      <div className="flex flex-col">
        <Label htmlFor="character-description">
          Description{" "}
          <span className="font-normal text-base-fg/40">(optional)</span>
        </Label>
        <textarea
          id="character-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this character..."
          rows={3}
          className="w-full resize-none rounded-lg px-3 py-2 outline-none bg-white/[0.07] text-base-fg placeholder-base-fg/50 border border-ui-panel-border transition-all duration-150 ease-in-out focus:border-primary focus:!outline-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="border-none" onClick={onBack}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          loading={creating}
          disabled={
            creating ||
            uploading ||
            !name.trim() ||
            images.filter((i) => i.mediaToken).length < 1
          }
        >
          Create
        </Button>
      </div>

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setSelectedGalleryImages([]);
        }}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={(id) => {
          setSelectedGalleryImages((prev) => (prev.includes(id) ? [] : [id]));
        }}
        maxSelections={1}
        onUseSelected={(selectedItems: GalleryItem[]) => {
          const item = selectedItems[0];
          if (item && item.fullImage) {
            // Clean up previous image
            images.forEach((img) => URL.revokeObjectURL(img.url));
            setImages([
              {
                file: new File([], "library-image"),
                url: item.fullImage,
                mediaToken: item.id,
              },
            ]);
          }
          setIsGalleryOpen(false);
          setSelectedGalleryImages([]);
        }}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </div>
  );
};
