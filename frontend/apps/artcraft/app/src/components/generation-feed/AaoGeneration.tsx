import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { downloadMediaFileToDisk } from "./desktopMediaActions";
import {
  AAO_IMPORT_CHANGED,
  getAaoLibraryImport,
  getArtCraftLibraryOwner,
  getArtCraftMediaUrl,
  MediaHttpError,
  queueAaoLibraryImport,
  requestAaoMedia as request,
  type AaoMediaJob,
  type AaoMediaKind,
} from "./aaoLibraryImports";

interface Provider {
  id: string;
  label: string;
  kind: AaoMediaKind;
  available: boolean;
  detail: string;
}

export function useAaoGeneration(kind: AaoMediaKind) {
  const [providers, setProviders] = useState<Provider[] | undefined>();
  const [selected, setSelected] = useState<string>();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await request("/providers", {
          signal: controller.signal,
        });
        const catalog: Provider[] = await response.json();
        setProviders(catalog.filter((provider) => provider.kind === kind));
        setOnline(true);
      } catch {
        if (!controller.signal.aborted) setOnline(false);
      }
    };
    void refresh();
    const interval = setInterval(refresh, 10000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [kind]);

  return {
    provider: providers?.find(
      (provider) => provider.id === selected && provider.available,
    ),
    online,
    items: providers?.map((provider) => ({
      action: `aao:${provider.id}`,
      label: provider.label,
      description: online ? provider.detail : "AAO media service is offline",
      selected: provider.id === selected && provider.available,
      disabled: !online || !provider.available,
    })) ?? [
      {
        label: "AAO providers",
        description: "Start AAO locally with aao media-serve",
        selected: false,
        disabled: true,
      },
    ],
    onSelect: ({ action }: { action?: string }) => {
      setSelected(action?.startsWith("aao:") ? action.slice(4) : undefined);
    },
  };
}

export function AaoGeneration({
  provider,
  selector,
  online,
}: {
  provider: Provider;
  selector: ReactNode;
  online: boolean;
}) {
  const storageKey = `aao-media-job:${provider.kind}:${provider.id}`;
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState<string | undefined>(
    () => localStorage.getItem(storageKey) ?? undefined,
  );
  const [job, setJob] = useState<AaoMediaJob>();
  const [busy, setBusy] = useState(false);
  const [libraryImport, setLibraryImport] = useState(() =>
    getAaoLibraryImport(jobId),
  );
  const [error, setError] = useState<string>();

  useEffect(() => {
    const updateImport = () => setLibraryImport(getAaoLibraryImport(jobId));
    window.addEventListener(AAO_IMPORT_CHANGED, updateImport);
    updateImport();
    return () => window.removeEventListener(AAO_IMPORT_CHANGED, updateImport);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await request(`/jobs/${jobId}`, {
          signal: controller.signal,
        });
        const update: AaoMediaJob = await response.json();
        if (controller.signal.aborted) return;
        setJob(update);
        setError(undefined);
        if (update.state === "pending") timer = setTimeout(poll, 1200);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(String(err));
          if (err instanceof MediaHttpError && err.status === 404) {
            setJob(undefined);
            setJobId(undefined);
            localStorage.removeItem(storageKey);
          } else {
            timer = setTimeout(poll, 3000);
          }
        }
      }
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [jobId, storageKey]);

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const owner = await getArtCraftLibraryOwner().catch(() => null);
      const response = await request("/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          kind: provider.kind,
          prompt,
        }),
      });
      const result = (await response.json()) as { id: string };
      localStorage.setItem(storageKey, result.id);
      setJob({ state: "pending", files: [] });
      setJobId(result.id);
      queueAaoLibraryImport(result.id, provider.kind, provider.id, owner);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const download = async (name: string, index: number) => {
    try {
      const token = libraryImport?.files[index]?.token;
      if (token) {
        const url = await getArtCraftMediaUrl(token);
        if (url) {
          await downloadMediaFileToDisk(url, provider.kind, provider.id);
          return;
        }
      }
      const response = await request(`/jobs/${jobId}/files/${index}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      setError(String(err));
    }
  };

  const retryImport = async () => {
    if (!jobId) return;
    setError(undefined);
    try {
      const owner = await getArtCraftLibraryOwner();
      if (!owner)
        throw new Error("Sign in to ArtCraft to import into My Library.");
      queueAaoLibraryImport(jobId, provider.kind, provider.id, owner);
    } catch (err) {
      setError(String(err));
    }
  };

  const pending = Boolean(jobId && (!job || job.state === "pending"));
  const savedToLibrary =
    job?.state === "succeeded" &&
    job.files.every((_, index) => !!libraryImport?.files[index]?.token);
  return (
    <form
      onSubmit={generate}
      className="rounded-lg border border-ui-controls-border bg-ui-background p-4"
    >
      <textarea
        aria-label={`Describe the ${provider.kind} to generate with AAO`}
        placeholder={`Describe the ${provider.kind} to generate…`}
        className="mb-3 w-full resize-y bg-transparent"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        maxLength={10000}
        rows={3}
      />
      <div className="flex items-center justify-between gap-3">
        {selector}
        <button
          type="submit"
          disabled={!online || busy || pending || !prompt.trim()}
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-40"
        >
          {pending ? "Generating…" : `Generate ${provider.kind}`}
        </button>
      </div>
      {!online && (
        <p role="status" className="mt-2 text-sm">
          AAO media service is offline.
        </p>
      )}
      {(error || job?.error) && (
        <p role="alert" className="mt-2 text-sm">
          {error || job?.error}
        </p>
      )}
      {job?.state === "succeeded" && (
        <div
          className="mt-2 flex flex-wrap gap-3 text-sm"
          aria-label="AAO results"
        >
          {job.files.map((name, index) => (
            <button
              key={index}
              type="button"
              className="underline"
              onClick={() => void download(name, index)}
            >
              Download {name}
            </button>
          ))}
          {savedToLibrary && <span role="status">Saved to My Library</span>}
          {libraryImport && !libraryImport.error && !savedToLibrary && (
            <span role="status">Saving to My Library…</span>
          )}
          {(!libraryImport || libraryImport.error) && (
            <button
              type="button"
              className="underline"
              onClick={() => void retryImport()}
            >
              {savedToLibrary
                ? "Retry auto-download"
                : libraryImport?.error
                  ? "Retry library import"
                  : "Import to My Library"}
            </button>
          )}
          {libraryImport?.error && (
            <span role="alert">{libraryImport.error}</span>
          )}
        </div>
      )}
    </form>
  );
}
