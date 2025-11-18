import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { TabSelector } from "@storyteller/ui-tab-selector";
import { Tooltip } from "@storyteller/ui-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCube,
  faCubes,
  faGlobe,
  faImages,
  faPlus,
  faSparkles,
  faUpload,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type Mode = "image" | "text";
type Variant = "object" | "world";

interface ImageTo3DExperienceProps {
  title: string;
  subtitle: string;
  variant: Variant;
}

interface GeneratedResult {
  id: string;
  mode: Mode;
  timestamp: number;
  note?: string;
  previewUrl?: string;
  meshOnly?: boolean;
}

const MODE_TABS = [
  { id: "image", label: "Image to 3D" },
  { id: "text", label: "Text to 3D" },
] satisfies { id: Mode; label: string }[];

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const ImageTo3DExperience = ({
  title,
  subtitle,
  variant,
}: ImageTo3DExperienceProps) => {
  const [activeMode, setActiveMode] = useState<Mode>("image");
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [meshOnly, setMeshOnly] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (uploadedPreview && uploadedPreview.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedPreview);
      }
    },
    [uploadedPreview],
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  const handleFiles = (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    if (uploadedPreview && uploadedPreview.startsWith("blob:")) {
      URL.revokeObjectURL(uploadedPreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setUploadedPreview(objectUrl);
    setUploadedName(file.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleFiles(event.dataTransfer?.files);
  };

  const handlePickFromLibrary = () => {
    console.info("TODO: integrate gallery modal for ImageTo3DExperience");
  };

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    const snapshotPrompt = prompt.trim();
    const snapshotPreview = uploadedPreview || undefined;
    const newResult: GeneratedResult = {
      id: generateId(),
      mode: activeMode,
      timestamp: Date.now(),
      note: activeMode === "text" ? snapshotPrompt : uploadedName || undefined,
      previewUrl: snapshotPreview,
      meshOnly,
    };

    timeoutRef.current = window.setTimeout(() => {
      setResults((prev) => [newResult, ...prev]);
      setIsGenerating(false);
      if (activeMode === "text") {
        setPrompt("");
      }
    }, 1200);
  };

  const canGenerate = useMemo(() => {
    if (isGenerating) return false;
    if (activeMode === "image") {
      return Boolean(uploadedPreview);
    }
    if (activeMode === "text") {
      return prompt.trim().length > 3;
    }
    return true;
  }, [activeMode, uploadedPreview, prompt, isGenerating]);

  const resultTitle =
    variant === "object" ? "3D Object Preview" : "3D World Preview";

  const renderAddImageTile = () => (
    <Tooltip
      interactive
      position="top"
      delay={100}
      zIndex={50}
      content={
        <div className="flex flex-col gap-1.5 text-left">
          <Button
            variant="primary"
            icon={faUpload}
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Upload image
          </Button>
          <Button
            variant="action"
            icon={faImages}
            onClick={handlePickFromLibrary}
            className="w-full"
          >
            Pick from library
          </Button>
        </div>
      }
    >
      <div
        role="button"
        tabIndex={0}
        className={twMerge(
          "flex aspect-square w-48 flex-col items-center justify-center rounded-2xl border-[3px] border-dashed border-primary/40 bg-primary/5 text-center text-xs transition-colors hover:border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40",
          dragActive && "border-primary bg-primary/10",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragActive(false);
          }
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <FontAwesomeIcon
          icon={faPlus}
          className="text-4xl text-base-fg opacity-90 drop-shadow"
        />
        <span className="mt-3 text-[15px] font-medium text-base-fg opacity-60">
          Add Image
        </span>
      </div>
    </Tooltip>
  );

  const renderImageMode = () => (
    <div className="flex justify-center">
      {uploadedPreview ? (
        <div
          className="group relative aspect-square w-48 cursor-pointer overflow-hidden rounded-2xl border-[3px] border-primary/40 bg-black/30"
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={uploadedPreview}
            alt="Reference"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              if (uploadedPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(uploadedPreview);
              }
              setUploadedPreview(null);
              setUploadedName(null);
            }}
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        </div>
      ) : (
        renderAddImageTile()
      )}
    </div>
  );

  const promptInputId = `image-to-3d-${variant}-prompt`;

  const renderTextMode = () => (
    <div>
      <textarea
        ref={textareaRef}
        id={promptInputId}
        rows={1}
        className="text-md max-h-[5.5em] w-full resize-none overflow-y-auto rounded bg-transparent pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
        value={prompt}
        placeholder="Describe any object you want to generate from scratch..."
        onChange={(event) => setPrompt(event.target.value)}
      />
    </div>
  );

  const renderActiveMode = () => {
    if (activeMode === "text") return renderTextMode();
    return renderImageMode();
  };

  const renderResults = () => (
    <div className="mb-10 space-y-6">
      {results.map((result) => (
        <div
          key={result.id}
          className="bg-ui-background/80 rounded-3xl border border-ui-panel-border p-5 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold uppercase tracking-widest text-base-fg/50">
              {resultTitle}
            </div>
            <div className="text-xs text-base-fg/50">
              {formatTime(result.timestamp)}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-controls">
                {result.previewUrl ? (
                  <img
                    src={result.previewUrl}
                    alt="Result preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-base-fg/60">
                    <FontAwesomeIcon
                      icon={variant === "object" ? faCube : faGlobe}
                      className="text-2xl"
                    />
                    <span className="text-sm">Preview ready</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-ui-panel-border bg-ui-controls/60 p-3 text-sm text-base-fg">
                <p className="font-semibold capitalize">
                  {result.mode} input
                  {result.meshOnly ? " · Mesh only" : ""}
                </p>
                <p className="text-xs text-base-fg/70">
                  {result.note ?? "Configuration snapshot saved."}
                </p>
              </div>
              <Button variant="primary" className="w-full">
                Open in Studio
              </Button>
              <Button variant="action" className="w-full">
                Download GLB
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full items-center justify-center bg-ui-panel px-4 text-base-fg">
      <div className="flex w-full flex-col items-center gap-8 py-10">
        <div className="mb-6 space-y-3 text-center">
          <h1 className="text-7xl font-bold tracking-tight">{title}</h1>
          <p className="text-xl text-base-fg/70">{subtitle}</p>
        </div>

        {results.length > 0 && (
          <div className="max-h-[45vh] w-full overflow-y-auto pr-2">
            {renderResults()}
          </div>
        )}

        <div className="glass w-full max-w-md rounded-xl p-5">
          <div className="space-y-5">{renderActiveMode()}</div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <ToggleButton
              isActive={meshOnly}
              icon={faCubes}
              activeIcon={faCubes}
              label="Mesh only"
              onClick={() => setMeshOnly((prev) => !prev)}
            />
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                icon={faSparkles}
                disabled={!canGenerate}
                onClick={handleGenerate}
                loading={isGenerating}
              >
                {`Generate ${variant === "object" ? "Object" : "World"}`}
              </Button>
            </div>
          </div>
        </div>

        <div className="sticky top-6 mx-auto flex justify-center">
          <TabSelector
            tabs={MODE_TABS}
            activeTab={activeMode}
            onTabChange={(tabId) => setActiveMode(tabId as Mode)}
            className="w-full max-w-md"
            indicatorClassName="bg-primary/25"
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageTo3DExperience;
