import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { Modal } from "@storyteller/ui-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinnerThird,
  faCopy,
  faCheck,
  faKey,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import {
  UserApiKeysApi,
  type ApiKeyInfo,
  type CreatedApiKey,
  type UserInfo,
} from "@storyteller/api";
import { toast } from "../toast/toast";

const NAME_MAX = 255;
const DESCRIPTION_MAX = 512;
const PAGE_SIZE = 20;

const INPUT_CLASS =
  "w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none";

interface ApiKeySectionProps {
  user: UserInfo;
}

export function ApiKeySection(_props: ApiKeySectionProps) {
  const [api] = useState(() => new UserApiKeysApi());

  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  // Rows fetched so far (including deleted ones we hide), drives the next
  // offset. The backend returns no total count, so we offer "Load more" while
  // the last page came back full.
  const [fetchedCount, setFetchedCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [creating, setCreating] = useState(false);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApiKeyInfo | null>(null);
  // The full secret, shown exactly once right after a key is created.
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);

  // `reset` reloads from offset 0; otherwise appends the next page.
  const load = async (reset: boolean) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    const offset = reset ? 0 : fetchedCount;
    const response = await api.ListApiKeys({ limit: PAGE_SIZE, offset });
    setLoading(false);
    setLoadingMore(false);
    if (response.success && response.data) {
      const fetched = response.data.api_keys;
      // The list includes soft-deleted keys; only show live ones.
      const live = fetched.filter((k) => k.maybe_deleted_at === null);
      setKeys((prev) => (reset ? live : [...prev, ...live]));
      setFetchedCount((prev) =>
        reset ? fetched.length : prev + fetched.length,
      );
      setHasMore(fetched.length === PAGE_SIZE);
    } else {
      toast.error(response.errorMessage ?? "Could not load API keys.");
    }
  };

  useEffect(() => {
    load(true);
    // Load once on mount; pagination drives subsequent loads explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (created: CreatedApiKey) => {
    setCreating(false);
    // Reveal the full secret once; the truncated key then appears in the list.
    setCreatedKey(created);
    load(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    const response = await api.DeleteApiKey({ token: target.token });
    if (response.success) {
      toast.success("API key deleted.");
      // Drop it locally so the list updates without a full reload.
      setKeys((prev) => prev.filter((k) => k.token !== target.token));
    } else {
      toast.error(response.errorMessage ?? "Could not delete API key.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">API keys</p>
          <p className="text-xs opacity-70">
            Create and manage keys to access the API programmatically.
          </p>
        </div>
        {!creating && (
          <Button
            type="button"
            variant="primary"
            className="h-9 px-3 shrink-0"
            onClick={() => setCreating(true)}
          >
            Create key
          </Button>
        )}
      </div>

      {createdKey && (
        <NewKeyReveal
          created={createdKey}
          onDismiss={() => setCreatedKey(null)}
        />
      )}

      {creating && (
        <CreateKeyForm
          api={api}
          onCreated={handleCreated}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading ? (
        <div className="py-6 text-center text-xs opacity-60">
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <div className="py-6 text-center text-xs opacity-60">
          You don't have any API keys yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {keys.map((item) => (
            <ApiKeyRow
              key={item.token}
              api={api}
              item={item}
              isEditing={editingToken === item.token}
              onOpenEdit={() => setEditingToken(item.token)}
              onCloseEdit={() => setEditingToken(null)}
              onUpdated={(updated) => {
                setEditingToken(null);
                setKeys((prev) =>
                  prev.map((k) => (k.token === updated.token ? updated : k)),
                );
              }}
              onRequestDelete={() => setPendingDelete(item)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-3"
            disabled={loadingMore}
            onClick={() => load(false)}
          >
            {loadingMore ? (
              <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}

      <DeleteConfirmModal
        item={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}

function CreateKeyForm({
  api,
  onCreated,
  onCancel,
}: {
  api: UserApiKeysApi;
  onCreated: (created: CreatedApiKey) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Enter a name for the key.");
      return;
    }

    setSubmitting(true);
    const trimmedDescription = description.trim();
    const response = await api.CreateApiKey({
      name: trimmedName,
      maybeDescription:
        trimmedDescription.length > 0 ? trimmedDescription : undefined,
    });
    setSubmitting(false);

    if (response.success && response.data) {
      toast.success("API key created.");
      onCreated(response.data);
    } else {
      setError(response.errorMessage ?? "Could not create API key.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (required)"
        maxLength={NAME_MAX}
        autoFocus
        inputClassName={INPUT_CLASS}
      />
      <Input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        maxLength={DESCRIPTION_MAX}
        inputClassName={INPUT_CLASS}
      />
      {error && <FormError message={error} />}
      <FormActions
        onCancel={onCancel}
        submitting={submitting}
        disabled={!canSubmit}
        submitLabel="Create"
      />
    </form>
  );
}

function NewKeyReveal({
  created,
  onDismiss,
}: {
  created: CreatedApiKey;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(created.api_key);
      setCopied(true);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Could not copy. Select and copy it manually.");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <FontAwesomeIcon icon={faKey} className="opacity-80" />
        <span>API key created</span>
      </div>
      <p className="text-xs opacity-80">
        Copy your key now. For security, you won't be able to see it again.
      </p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md bg-black/40 px-3 py-2 font-mono text-xs text-white">
          {created.api_key}
        </code>
        <Button
          type="button"
          variant="primary"
          className="h-8 px-3 shrink-0"
          onClick={handleCopy}
        >
          <FontAwesomeIcon
            icon={copied ? faCheck : faCopy}
            className="mr-1.5"
          />
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-8 px-3 shrink-0"
          onClick={onDismiss}
        >
          Done
        </Button>
      </div>
    </div>
  );
}

function ApiKeyRow({
  api,
  item,
  isEditing,
  onOpenEdit,
  onCloseEdit,
  onUpdated,
  onRequestDelete,
}: {
  api: UserApiKeysApi;
  item: ApiKeyInfo;
  isEditing: boolean;
  onOpenEdit: () => void;
  onCloseEdit: () => void;
  onUpdated: (updated: ApiKeyInfo) => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/[0.14]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-medium">{item.name}</p>
          {item.maybe_description && (
            <p className="truncate text-xs opacity-70">
              {item.maybe_description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            {/* Truncated prefix, display-only — the full secret is only shown on
                create. The trailing ellipsis signals it's not the whole value. */}
            <code className="min-w-0 truncate rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-white/70">
              {item.truncated_api_key}…
            </code>
            <span className="text-[10px] uppercase tracking-wider text-white/40">
              {formatDate(item.created_at)}
            </span>
          </div>
        </div>
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-3"
              onClick={onOpenEdit}
              title="Edit description"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-2.5 text-red-400"
              onClick={onRequestDelete}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        )}
      </div>
      {isEditing && (
        <EditDescriptionForm
          api={api}
          item={item}
          onUpdated={onUpdated}
          onCancel={onCloseEdit}
        />
      )}
    </div>
  );
}

function EditDescriptionForm({
  api,
  item,
  onUpdated,
  onCancel,
}: {
  api: UserApiKeysApi;
  item: ApiKeyInfo;
  onUpdated: (updated: ApiKeyInfo) => void;
  onCancel: () => void;
}) {
  const initial = item.maybe_description ?? "";
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const isDirty = trimmed !== initial.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isDirty) {
      onCancel();
      return;
    }

    setSubmitting(true);
    const nextDescription = trimmed.length > 0 ? trimmed : null;
    const response = await api.UpdateApiKey({
      token: item.token,
      maybeDescription: nextDescription,
    });
    setSubmitting(false);

    if (response.success) {
      toast.success("API key updated.");
      // Update endpoint returns only { success }; merge the new description in.
      onUpdated({ ...item, maybe_description: nextDescription });
    } else {
      setError(response.errorMessage ?? "Could not update API key.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1">
      <p className="text-xs opacity-70">
        Edit the description for "{item.name}". The key's name can't be changed.
      </p>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Description (optional)"
        maxLength={DESCRIPTION_MAX}
        autoFocus
        inputClassName={INPUT_CLASS}
      />
      {error && <FormError message={error} />}
      <FormActions
        onCancel={onCancel}
        submitting={submitting}
        disabled={!isDirty}
        submitLabel="Save"
      />
    </form>
  );
}

function DeleteConfirmModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: ApiKeyInfo | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <Modal isOpen={item !== null} onClose={onCancel} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold">Delete API key</h3>
          <p className="text-sm opacity-70">
            Delete "{item?.name}"? Any application using this key will stop
            working. This can't be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="h-9 px-4 bg-red-500 hover:bg-red-600"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FormActions({
  onCancel,
  submitting,
  disabled,
  submitLabel,
}: {
  onCancel: () => void;
  submitting: boolean;
  disabled: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <Button
        type="button"
        variant="secondary"
        className="h-9 px-3"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        className="h-9 px-4"
        disabled={submitting || disabled}
      >
        {submitting ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return <p className="text-xs text-red-400 leading-tight">{message}</p>;
}

function formatDate(raw: string): string {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
