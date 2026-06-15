import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { Modal } from "@storyteller/ui-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinnerThird,
  faCopy,
  faCheck,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import {
  UserApiKeysApi,
  type ApiKeyItem,
  type UserInfo,
} from "@storyteller/api";
import { toast } from "../toast/toast";

const NAME_MAX = 255;
const DESCRIPTION_MAX = 512;
const PAGE_SIZE = 10;

const INPUT_CLASS =
  "w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none";

interface ApiKeySectionProps {
  user: UserInfo;
}

export function ApiKeySection(_props: ApiKeySectionProps) {
  const [api] = useState(() => new UserApiKeysApi());

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApiKeyItem | null>(null);

  const load = async (pageIndex: number) => {
    setLoading(true);
    const response = await api.ListApiKeys({
      pageSize: PAGE_SIZE,
      pageIndex,
    });
    setLoading(false);
    if (response.success && response.data) {
      setKeys(response.data.api_keys);
      setPage(response.pagination?.current ?? pageIndex);
      setTotalPages(Math.max(1, response.pagination?.total_page_count ?? 1));
    } else {
      toast.error(response.errorMessage ?? "Could not load API keys.");
    }
  };

  useEffect(() => {
    load(0);
    // Load once on mount; pagination drives subsequent loads explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = () => {
    setCreating(false);
    // The new key shows up at the top of the first page.
    load(0);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    const response = await api.DeleteApiKey({ token: target.token });
    if (response.success) {
      toast.success("API key deleted.");
      // Reload the current page; step back if we just emptied it.
      const nextPage = keys.length === 1 && page > 0 ? page - 1 : page;
      load(nextPage);
    } else {
      toast.error(response.errorMessage ?? "Could not delete API key.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
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

      {creating && (
        <CreateKeyForm
          api={api}
          onCreated={handleCreated}
          onCancel={() => setCreating(false)}
        />
      )}

      <hr className="border-ui-panel-border" />

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
              onUpdated={() => {
                setEditingToken(null);
                load(page);
              }}
              onRequestDelete={() => setPendingDelete(item)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-3"
            disabled={page <= 0 || loading}
            onClick={() => load(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs opacity-60">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-3"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => load(page + 1)}
          >
            Next
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
  onCreated: () => void;
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

    if (response.success) {
      toast.success("API key created.");
      onCreated();
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
  item: ApiKeyItem;
  isEditing: boolean;
  onOpenEdit: () => void;
  onCloseEdit: () => void;
  onUpdated: () => void;
  onRequestDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.api_key);
      setCopied(true);
      toast.success("Copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Select and copy it manually.");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ui-panel-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-medium">{item.name}</p>
          {item.maybe_description && (
            <p className="truncate text-xs opacity-70">
              {item.maybe_description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <code className="min-w-0 flex-1 truncate rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-white/80">
              {item.api_key}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy key"
              className="shrink-0 rounded p-1 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            </button>
          </div>
          <span className="pt-0.5 text-[10px] uppercase tracking-wider text-white/40">
            {formatDate(item.created_at)}
          </span>
        </div>
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 px-3"
              onClick={onOpenEdit}
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
  item: ApiKeyItem;
  onUpdated: () => void;
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
    const response = await api.UpdateApiKey({
      token: item.token,
      maybeDescription: trimmed.length > 0 ? trimmed : null,
    });
    setSubmitting(false);

    if (response.success) {
      toast.success("API key updated.");
      onUpdated();
    } else {
      setError(response.errorMessage ?? "Could not update API key.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1">
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
  item: ApiKeyItem | null;
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
