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
  faPen,
  faTrashAlt,
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

type ModalView = "list" | "create" | "edit";

interface UploadedImage {
  file: File;
  url: string;
  mediaToken?: string;
}

interface PendingCharacter {
  name: string;
  previewUrl?: string;
}

const POLL_INTERVAL_MS = 5000;

export const CharactersModal = ({
  isOpen,
  onClose,
  onSelectCharacter,
}: CharactersModalProps) => {
  const [view, setView] = useState<ModalView>("list");
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null,
  );
  const [pendingCharacters, setPendingCharacters] = useState<
    PendingCharacter[]
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClose = () => {
    setView("list");
    setEditingCharacter(null);
    onClose();
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setView("edit");
  };

  const handleEditDone = () => {
    setEditingCharacter(null);
    setView("list");
    setRefreshKey((k) => k + 1);
  };

  const handleCreated = (pending: PendingCharacter) => {
    setPendingCharacters((prev) => [pending, ...prev]);
    setView("list");
    setRefreshKey((k) => k + 1);
  };

  const removePending = useCallback((name: string) => {
    setPendingCharacters((prev) => prev.filter((p) => p.name !== name));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={view === "list" ? "Characters" : undefined}
      className="max-w-[800px] h-[60vh] max-h-[600px] flex flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "list" ? (
          <CharacterListView
            key={refreshKey}
            onCreateClick={() => setView("create")}
            onSelectCharacter={onSelectCharacter}
            onEditCharacter={handleEdit}
            pendingCharacters={pendingCharacters}
            onPendingResolved={removePending}
          />
        ) : view === "create" ? (
          <NewCharacterView
            onBack={() => setView("list")}
            onCreated={handleCreated}
          />
        ) : editingCharacter ? (
          <EditCharacterView
            character={editingCharacter}
            onBack={() => {
              setEditingCharacter(null);
              setView("list");
            }}
            onSaved={handleEditDone}
          />
        ) : null}
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
  onEditCharacter,
  pendingCharacters,
  onPendingResolved,
}: {
  onCreateClick: () => void;
  onSelectCharacter?: (character: Character) => void;
  onEditCharacter: (character: Character) => void;
  pendingCharacters: PendingCharacter[];
  onPendingResolved: (name: string) => void;
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const storeSetCharacters = useCharactersStore((s) => s.setCharacters);
  const storeSetLoaded = useCharactersStore((s) => s.setLoaded);
  const storeRemoveCharacter = useCharactersStore((s) => s.removeCharacter);

  const syncToStore = useCallback(
    (chars: Character[]) => {
      storeSetCharacters(
        chars.map((c) => ({
          character_token: c.token,
          name: c.name,
          avatar_image_url: c.maybe_avatar?.cdn_url,
        })),
      );
      storeSetLoaded(true);
    },
    [storeSetCharacters, storeSetLoaded],
  );

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
            syncToStore(updated);
            return updated;
          });
          const nextPage = res.pagination?.next_cursor;
          setCursor(nextPage ?? undefined);
          setHasMore(!!nextPage);
        }
      } catch {
        storeSetLoaded(true);
      } finally {
        setLoading(false);
        loadingMoreRef.current = false;
      }
    },
    [syncToStore, storeSetLoaded],
  );

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Poll for pending characters becoming active
  useEffect(() => {
    if (pendingCharacters.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const api = new CharactersApi();
        const res = await api.ListCharacters({});
        if (res.success && res.data) {
          const serverNames = new Set(res.data.map((c) => c.name));
          // Resolve any pending characters that now appear in the server list
          for (const pending of pendingCharacters) {
            if (serverNames.has(pending.name)) {
              onPendingResolved(pending.name);
            }
          }
          // Update the list with fresh server data
          setCharacters(res.data);
          syncToStore(res.data);
        }
      } catch {
        // Silently retry on next interval
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pendingCharacters, onPendingResolved, syncToStore]);

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

  const handleDelete = async (character: Character) => {
    setDeletingToken(character.token);
    try {
      const api = new CharactersApi();
      const res = await api.DeleteCharacter({
        characterToken: character.token,
      });

      if (res.success) {
        setCharacters((prev) =>
          prev.filter((c) => c.token !== character.token),
        );
        storeRemoveCharacter(character.token);
        toast.success(`Character "${character.name}" deleted`);
      } else {
        toast.error(res.errorMessage || "Failed to delete character");
      }
    } catch {
      toast.error("Failed to delete character");
    } finally {
      setDeletingToken(null);
    }
  };

  return (
    <div className="flex max-h-[50vh] flex-col overflow-y-auto">
      {loading && characters.length === 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-lg border border-transparent bg-base-fg/[0.05]"
            >
              <div className="aspect-square w-full overflow-hidden">
                <div
                  className="h-full w-full bg-base-fg/[0.06]"
                  style={{
                    animation: `charPulse 1.8s ease-in-out ${i * 0.07}s infinite`,
                  }}
                />
              </div>
              <div className="px-2 py-1.5 flex justify-center bg-base-fg/[0.04]">
                <div
                  className="h-3 w-2/3 rounded bg-base-fg/[0.08]"
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
            className="flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-base-fg/10 bg-base-fg/[0.05] text-base-fg/60 transition-colors hover:border-base-fg/25 hover:text-base-fg/80"
          >
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="text-lg" />
              <span className="text-sm font-medium">Create New</span>
            </div>
          </button>

          {/* Pending (creating) characters */}
          {pendingCharacters.map((pending) => (
            <div
              key={`pending-${pending.name}`}
              className="relative flex flex-col overflow-hidden rounded-lg border border-transparent bg-base-fg/[0.05]"
            >
              <div className="aspect-square w-full overflow-hidden bg-base-fg/[0.05]">
                {pending.previewUrl ? (
                  <img
                    src={pending.previewUrl}
                    alt={pending.name}
                    className="h-full w-full object-cover object-top opacity-50"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base-fg/20">
                    <FontAwesomeIcon icon={faUserGroup} className="text-2xl" />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="text-lg text-white/80 animate-spin"
                  />
                  <span className="text-xs font-medium text-white/80">
                    Creating...
                  </span>
                </div>
              </div>
              <div className="px-2 py-1.5 text-center">
                <p className="truncate text-xs font-medium text-base-fg/50">
                  {pending.name}
                </p>
              </div>
            </div>
          ))}

          {characters.map((character) => {
            const isUserCreated = character.is_user_created !== false;
            const isDeleting = deletingToken === character.token;

            return (
              <div
                key={character.token}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-transparent bg-base-fg/[0.05] transition-colors hover:border-base-fg/25 hover:bg-base-fg/10"
              >
                <button
                  onClick={() => onSelectCharacter?.(character)}
                  className="flex flex-1 flex-col"
                >
                  <div className="aspect-square w-full overflow-hidden bg-base-fg/[0.05]">
                    {character.maybe_avatar?.cdn_url ? (
                      <img
                        src={character.maybe_avatar.cdn_url}
                        alt={character.name}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-base-fg/20">
                        <FontAwesomeIcon
                          icon={faUserGroup}
                          className="text-2xl"
                        />
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="truncate text-xs font-medium text-base-fg/80">
                      {character.name}
                    </p>
                  </div>
                </button>

                {/* Edit / Delete overlay buttons (user-created only) */}
                {isUserCreated && (
                  <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCharacter(character);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 transition-colors hover:bg-black/80"
                    >
                      <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(character);
                      }}
                      disabled={isDeleting}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 transition-colors hover:bg-red-500"
                    >
                      {isDeleting ? (
                        <FontAwesomeIcon
                          icon={faSpinnerThird}
                          className="text-[10px] animate-spin"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faTrashAlt}
                          className="text-[10px]"
                        />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="text-base-fg/30 animate-spin"
          />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Edit Character View
// ---------------------------------------------------------------------------

const EditCharacterView = ({
  character,
  onBack,
  onSaved,
}: {
  character: Character;
  onBack: () => void;
  onSaved: () => void;
}) => {
  const updateCharacterInStore = useCharactersStore((s) => s.updateCharacter);
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(
    character.maybe_description ?? "",
  );
  const [saving, setSaving] = useState(false);

  const hasChanges =
    name.trim() !== character.name ||
    (description.trim() || "") !== (character.maybe_description ?? "");

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const api = new CharactersApi();
      const res = await api.EditCharacter({
        token: character.token,
        updated_name: name.trim() !== character.name ? name.trim() : undefined,
        updated_description:
          (description.trim() || "") !== (character.maybe_description ?? "")
            ? description.trim() || null
            : undefined,
      });

      if (res.success) {
        toast.success("Character updated");
        updateCharacterInStore(character.token, { name: name.trim() });
        onSaved();
      } else {
        toast.error(res.errorMessage || "Failed to update character");
      }
    } catch {
      toast.error("Failed to update character");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center text-base-fg/60 transition-colors hover:text-base-fg"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2 className="text-xl font-bold text-base-fg">Edit Character</h2>
      </div>

      {/* Avatar preview */}
      {character.maybe_avatar?.cdn_url && (
        <div className="flex h-56 max-h-56 items-center justify-center overflow-hidden rounded-lg bg-base-fg/[0.05]">
          <img
            src={character.maybe_avatar.cdn_url}
            alt={character.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {/* Name input */}
      <div className="flex flex-col">
        <Label htmlFor="edit-character-name">Name</Label>
        <Input
          id="edit-character-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name"
          autoComplete="off"
          inputClassName="bg-base-fg/[0.07] hover:border-ui-panel-border"
        />
      </div>

      {/* Description input */}
      <div className="flex flex-col">
        <Label htmlFor="edit-character-description">
          Description{" "}
          <span className="font-normal text-base-fg/40">(optional)</span>
        </Label>
        <textarea
          id="edit-character-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this character..."
          rows={3}
          autoComplete="off"
          className="w-full resize-none rounded-lg px-3 py-2 outline-none bg-base-fg/[0.07] text-base-fg placeholder-base-fg/50 border border-ui-panel-border transition-all duration-150 ease-in-out focus:border-primary focus:!outline-none"
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="border-none" onClick={onBack}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          disabled={saving || !name.trim() || !hasChanges}
        >
          Save
        </Button>
      </div>
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
  onCreated: (pending: PendingCharacter) => void;
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
        character_name: name.trim(),
        character_description: description.trim() || null,
      });

      if (res.success && res.data) {
        toast.success(`Character "${name.trim()}" is being created`);
        // Add to global store so it appears in @-mentions immediately
        addCharacterToStore({
          character_token: res.data.inference_job_token,
          name: name.trim(),
          avatar_image_url: uploadedImages[0]!.url,
        });
        // Pass pending info up so the list shows an optimistic card
        onCreated({
          name: name.trim(),
          previewUrl: uploadedImages[0]!.url,
        });
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
          "flex h-56 max-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-base-fg/20 bg-base-fg/[0.05] transition-colors overflow-hidden",
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
          <div className="flex h-full w-full flex-col items-center justify-center text-base-fg/60">
            <FontAwesomeIcon
              icon={faUpload}
              className="mb-2 text-xl text-base-fg/40"
            />
            <p className="text-sm">Upload reference image</p>
            <p className="mb-3 text-xs text-base-fg/40">
              Click or drag an image here
            </p>
            <div
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-base-fg/10 px-3 py-1.5 text-sm text-base-fg/80 transition-colors hover:bg-base-fg/20"
              >
                <FontAwesomeIcon icon={faImages} className="text-xs" />
                Choose from Library
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-base-fg/10 px-3 py-1.5 text-sm text-base-fg/80 transition-colors hover:bg-base-fg/20"
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
          autoComplete="off"
          inputClassName="bg-base-fg/[0.07] hover:border-ui-panel-border"
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
          autoComplete="off"
          className="w-full resize-none rounded-lg px-3 py-2 outline-none bg-base-fg/[0.07] text-base-fg placeholder-base-fg/50 border border-ui-panel-border transition-all duration-150 ease-in-out focus:border-primary focus:!outline-none"
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
