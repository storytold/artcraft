import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { FileVideo, FolderOpen, Loader2, UploadCloud } from 'lucide-react';

interface UploadBoxProps {
  busy: boolean;
  busyFileName: string | null;
  onFile: (file: File) => void;
}

export function UploadBox({ busy, busyFileName, onFile }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    // Allow re-selecting the same file later.
    event.target.value = '';
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        'glass relative flex flex-col items-center justify-center gap-5 px-8 py-14 text-center transition-all duration-300',
        dragging
          ? 'scale-[1.02] border-fuchsia-400/80 ring-4 ring-fuchsia-400/30'
          : 'hover:border-violet-400/60',
        busy ? 'pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Animated ring icon */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-violet-500/40 via-fuchsia-500/40 to-cyan-400/40 blur-2xl animate-pulse-glow" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/30">
          {busy ? (
            <Loader2 className="h-9 w-9 animate-spin-slow" />
          ) : (
            <UploadCloud className="h-9 w-9 animate-float" />
          )}
        </div>
      </div>

      {busy ? (
        <div className="w-full max-w-sm space-y-3">
          <p className="flex items-center justify-center gap-2 text-lg font-semibold">
            <FileVideo className="h-5 w-5 text-fuchsia-400" />
            <span className="truncate">{busyFileName ?? 'Analyzing…'}</span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scanning provenance metadata…
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="scan-shimmer h-full w-full rounded-full" />
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-xl font-semibold">
              {dragging ? 'Drop it!' : 'Drag & drop your video here'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              MP4 / MOV — we read it, we don't keep it.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 hover:shadow-fuchsia-500/40 active:scale-95"
          >
            <FolderOpen className="h-5 w-5" />
            Open video
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="video/*,.mp4,.mov,.webm,.mkv"
            className="hidden"
            onChange={handleSelect}
          />
        </>
      )}
    </div>
  );
}
