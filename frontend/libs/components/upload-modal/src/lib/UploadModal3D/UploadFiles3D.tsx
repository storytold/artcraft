// The picker screen inside the "Upload 3D object" and "Upload animation" dialogs (UploadModal3D.tsx renders this while
// the dialog is in its `ready` state). It lets the person choose one or many model files (GLB, and FBX which it
// converts to GLB first), shows a live 3D preview (with an animation-clip chooser and a skeleton toggle for rigged
// models), takes a picture of the preview to use as the library cover, uploads the files, and reports the outcome to
// the dialog through `onUploadProgress`. A multi-file upload stays on this screen and shows per-row status.
import { useCallback, useEffect, useRef, useState } from "react";
// A resizable two-column layout (file list on the left, preview on the right) used only when several files are chosen.
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
// The drop-down used to pick one of several file subtypes (only drawn when there is more than one choice).
import { ListDropdown } from "@storyteller/ui-list-dropdown";
// The select box used for the animation-clip chooser on top of the preview.
import { Select } from "@storyteller/ui-select";
// The app's shared button component.
import { Button } from "@storyteller/ui-button";
// The shared drag-and-drop / click-to-browse file chooser (it wraps react-drag-drop-files).
import { FileUploader } from "@storyteller/ui-file-uploader";
// Small icons: the bone (skeleton toggle), the cube for "no model yet", row status marks (loader / check / alert), the
// Retry arrow, the Remove cross, and the preview arrows.
import { BoneIcon, BoxIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, LoaderIcon, RotateCwIcon, XIcon } from "lucide-react";
// three.js, used here only for the renderer and camera TYPES the preview loader hands back.
import * as THREE from "three";
import {
  // Turns an FBX file into a GLB file in the browser (the preview and the API only understand GLB).
  convertFbxToGlb,
  // Starts drawing a file on a canvas and reports its status, its animation clips and what kind of model it is.
  loadPreviewOnCanvas,
  // Reads the length of the first animation clip in a GLB, in milliseconds (animation uploads must send it).
  readGlbAnimationDurationMillis,
  // Turns the canvas into an image Blob, used as the library cover.
  snapshotCanvasAsThumbnail,
} from "./utilities";
// Uploads ONE file through the API flow (asset, then cover image) and reports progress as an UploaderState.
import { upload3DObjects } from "./utilities/upload3DObjects";
// Uploads several files at the same time (Promise.all) and reports per-file status instead of an UploaderState.
import { upload3DObjectsBatch } from "./utilities/upload3DObjectsBatch";
// Shared types: the per-row status words, the engine category sent to the API, the animation subtype, the dialog's
// state object, and its numeric state enum.
import {
  FileEntryStatus,
  FilterEngineCategories,
  MediaFileAnimationType,
  UploaderState,
  UploaderStates,
} from "../Types";

// One row of the file list: the file itself, where it is in its upload, and the error text if it failed.
interface FileEntry {
  file: File;
  status: FileEntryStatus;
  errorMessage?: string;
}

// What the dialog hands to this picker.
interface Props {
  // Passed in by the dialog but not used here (the dialog's shell draws the title itself).
  title: string;
  // Extensions the file chooser accepts, such as ["glb", "fbx"].
  fileTypes: string[];
  // The category the API files the upload under. ANIMATION switches on the clip-duration checks below.
  engineCategory: FilterEngineCategories;
  // Files to start with (for example files dropped on the app window before the dialog opened). Read on mount only.
  initialFiles?: File[];
  // Optional extras from the dialog. Only `fileSubtypes` is read here; `hasLength` and `hasThumbnailUpload` are part
  // of the shared options shape but this picker ignores them.
  options?: {
    fileSubtypes?: { [key: string]: string }[];
    hasLength?: boolean;
    hasThumbnailUpload?: boolean;
  };
  // Closes the dialog (the Cancel button).
  onClose: () => void;
  // Tells the dialog how the upload went. The dialog swaps screens on `success` and on the error states.
  onUploadProgress: (newState: UploaderState) => void;
  // Fired when a previewed model turns out to be a mesh-less skeleton
  // (animation-only export) — the modal preselects "Upload as Animation".
  onMeshlessDetected?: () => void;
}

export const UploadFiles3D = ({
  fileTypes,
  engineCategory,
  initialFiles,
  options,
  onClose,
  onUploadProgress,
  onMeshlessDetected,
}: Props) => {
  // The <canvas> element the preview is drawn on. Written by `canvasCallbackRef`, read by the effects below.
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined);
  // The three.js renderer and camera of the CURRENT preview (set after each load, cleared when it is disposed).
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  // The observer that keeps the renderer the same size as the canvas on screen.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // A "callback ref": React calls it with the canvas when it appears and with null when it goes away. The canvas is
  // drawn in two places below (single-file layout and multi-file layout), so it gets replaced when the layout changes.
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
    // Stop watching the old canvas (if any) before doing anything else.
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    // A new canvas has appeared: remember it and start watching its size.
    if (node !== null) {
      canvasRef.current = node;
      const observer = new ResizeObserver(() => {
        // No preview running yet (or it was disposed): nothing to resize.
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return;
        // The canvas's size on screen, in CSS pixels. Zero means it is hidden; skip rather than make a 0x0 renderer.
        const w = node.clientWidth;
        const h = node.clientHeight;
        if (w === 0 || h === 0) return;
        // `false` = resize the drawing buffer only, leave the canvas's CSS size to the layout classes.
        renderer.setSize(w, h, false);
        // Keep the picture from stretching: match the camera's width/height ratio to the canvas.
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    }
  }, []);

  // The list of subtype choices from the dialog (for example animation kinds), or undefined when there are none.
  const fileSubtypes = options?.fileSubtypes;

  // The chosen subtype, sent with every upload. Starts as the first choice's value (each choice is a one-entry object,
  // so `Object.values(choice)[0]` is its value), or undefined when there are no choices.
  const [subtype, setSubtype] = useState<MediaFileAnimationType | undefined>(
    fileSubtypes
      ? (Object.values(fileSubtypes[0])[0] as MediaFileAnimationType)
      : undefined,
  );

  // `initialFiles` may be undefined; treat that as an empty list.
  const seedFiles = initialFiles ?? [];

  // FBX files are accepted at the picker but normalized to GLB in the
  // browser (convertFbxToGlb) before they can be previewed or uploaded —
  // they enter as "converting" and swap to the converted GLB when done.
  const isFbx = (file: File) => file.name.toLowerCase().endsWith(".fbx");

  // The list of chosen files with their upload status. It is seeded from `initialFiles` on the first render only;
  // after that the file chooser (handleFilesChange) is the only thing that replaces the list. An FBX starts as
  // "converting", anything else as "idle".
  const [fileEntries, setFileEntries] = useState<FileEntry[]>(
    seedFiles.map((f) => ({
      file: f,
      status: isFbx(f) ? "converting" : "idle",
    })),
  );
  // Fresh mirrors for async completions (conversion callbacks outlive
  // renders): the live entry list, and the File the preview effect is
  // currently showing (the converting ORIGINAL while an FBX converts).
  const fileEntriesRef = useRef(fileEntries);
  // Re-pointed on every render so the ref always holds the newest list.
  fileEntriesRef.current = fileEntries;
  const currentPreviewFileRef = useRef<File | null>(null);
  // Which row is shown in the preview.
  const [previewIndex, setPreviewIndex] = useState(0);
  // Incremented on every handleFilesChange so useEffect re-runs even when count stays the same
  const [filesVersion, setFilesVersion] = useState(0);
  // What the preview loader last reported: "init" while loading, "OK" once the model is ready, or a status whose type
  // contains "Error" (drawn on top of the canvas as a message).
  const [previewStatus, setPreviewStatus] = useState<{
    type: string;
    message?: string;
  }>({ type: "init" });
  // The cover pictures taken from the preview, keyed by the File object. A file only has one if it was previewed.
  const [thumbnails, setThumbnails] = useState<Map<File, Blob>>(new Map());
  // True while a batch (Upload or Retry Failed) is running. A single-row Retry does not set this; it only marks its row.
  const [isUploading, setIsUploading] = useState(false);
  // The "Uploading n / total..." counter, or null before the first batch.
  const [overallProgress, setOverallProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  // The red message shown above the list when Upload cannot start (nothing chosen, still converting, and so on).
  const [selectionError, setSelectionError] = useState<string | undefined>();
  // In-flight submission guard (see handleSubmit): the state drives the
  // Upload button, the ref blocks same-tick re-entry before the disabled
  // state has re-rendered.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Baked-animation preview: clip names reported by the loader (empty for
  // still models — the picker only renders when there are clips), the
  // selected clip (-1 = none/T-pose; the first clip autoplays), and the
  // loader's switch function for the current preview.
  const [previewAnimations, setPreviewAnimations] = useState<string[]>([]);
  const [previewClip, setPreviewClip] = useState(0);
  const selectAnimationRef = useRef<((index: number) => void) | null>(null);

  // Skeleton overlay: offered for any rigged model — real bones OR a
  // mesh-less node hierarchy (converted animation exports lose bone-ness;
  // see NodeHierarchyHelper) — on by default for mesh-less ones, where
  // there'd otherwise be nothing to see.
  const [previewHasRig, setPreviewHasRig] = useState(false);
  const [previewSkeletonVisible, setPreviewSkeletonVisible] = useState(false);
  const setSkeletonVisibleRef = useRef<((visible: boolean) => void) | null>(
    null,
  );

  // The clip chooser changed: remember the choice for the drop-down and tell the loader's scene to play that clip.
  const handlePreviewClipChange = (value: string | number) => {
    // The Select hands back a string or a number; the clip index is a number (-1 means "T-pose, no clip").
    const index = Number(value);
    setPreviewClip(index);
    selectAnimationRef.current?.(index);
  };

  // The bone button: show or hide the skeleton overlay in the preview.
  const handleSkeletonToggle = () => {
    setPreviewSkeletonVisible((visible) => {
      const next = !visible;
      // Tell the loader's scene. Setting the same visibility twice does nothing, so a repeated updater call is harmless.
      setSkeletonVisibleRef.current?.(next);
      return next;
    });
  };

  // Tears down the current preview: stops its loop, cancels in-flight
  // loads and frees its scene and renderer (see loadPreviewOnCanvas).
  const disposePreviewRef = useRef<(() => void) | null>(null);
  const disposeRenderer = () => {
    // Run the loader's own cleanup (if a preview is running) and forget it so it cannot run twice.
    disposePreviewRef.current?.();
    disposePreviewRef.current = null;
    // The renderer is gone with it; the resize observer must not touch it any more.
    rendererRef.current = null;
  };

  // Normalize an FBX to GLB in the background. Completion swaps the entry's
  // File by identity, so it's naturally a no-op if the user re-picked or
  // removed the file mid-conversion.
  const beginFbxConversion = (original: File) => {
    convertFbxToGlb(original)
      .then((converted) => {
        // Discarded pick (re-picked/removed mid-conversion): nothing to
        // swap, and no reason to reload anyone's preview.
        if (!fileEntriesRef.current.some((e) => e.file === original)) return;
        // Replace the FBX row with the converted GLB file and make it ready to upload.
        setFileEntries((prev) =>
          prev.map((entry) =>
            entry.file === original
              ? { file: converted, status: "idle" as FileEntryStatus }
              : entry,
          ),
        );
        // Re-run the preview effect ONLY when the converted entry is the
        // one being previewed — a blanket bump reloaded the current
        // preview once per completed conversion in a multi-FBX pick.
        if (currentPreviewFileRef.current === original) {
          setFilesVersion((v) => v + 1);
        }
      })
      .catch((error) => {
        // Conversion failed: mark the row red and keep the reason. The raw FBX stays in the list but is never uploaded.
        setFileEntries((prev) =>
          prev.map((entry) =>
            entry.file === original
              ? {
                  ...entry,
                  status: "error" as FileEntryStatus,
                  errorMessage: `FBX conversion failed: ${String(error)}`,
                }
              : entry,
          ),
        );
      });
  };

  // Kick off conversions for any FBX files seeded via initialFiles.
  useEffect(() => {
    seedFiles.filter(isFbx).forEach(beginFbxConversion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start (or restart) the preview whenever the previewed row changes or the list is replaced.
  useEffect(() => {
    // The row being previewed and its file.
    const currentEntry = fileEntries[previewIndex];
    const currentFile = currentEntry?.file;
    // Remember which file is on screen, so a finished FBX conversion knows whether to reload the preview.
    currentPreviewFileRef.current = currentFile ?? null;
    // No canvas on screen yet, or nothing to preview: leave things as they are.
    if (!canvasRef.current || !currentFile) return;

    // Every preview transition starts from a clean slate — including the
    // early return below: leaving the previous model's clip dropdown and
    // bone toggle rendered over the "Converting FBX…" overlay had them
    // operating on the disposed previous scene.
    disposeRenderer();
    setPreviewStatus({ type: "init" });
    setPreviewAnimations([]);
    setPreviewClip(0);
    setPreviewHasRig(false);
    setPreviewSkeletonVisible(false);
    selectAnimationRef.current = null;
    setSkeletonVisibleRef.current = null;

    // Nothing to preview until an FBX has been converted (the loader can't
    // parse FBX; a failed conversion also stays un-previewed).
    if (currentEntry.status === "converting" || isFbx(currentFile)) {
      return;
    }

    // Begin drawing the file on the canvas. The loader reports through the callbacks and returns the three.js objects,
    // two control functions (play a clip, show the skeleton) and a `dispose` function that stops everything it started.
    const { renderer, camera, selectAnimation, setSkeletonVisible, dispose } =
      loadPreviewOnCanvas({
        file: currentFile,
        canvas: canvasRef.current,
        statusCallback: setPreviewStatus,
        // The names of the animation clips baked into the model (drives the clip chooser).
        onAnimationsAvailable: setPreviewAnimations,
        // What kind of model it is: with or without a mesh, with or without bones.
        onModelInfo: (info) => {
          // A skeleton with no mesh is an animation-only export: tell the dialog so it can offer "Upload as Animation".
          if (!info.hasMesh) onMeshlessDetected?.();
          // Offer the skeleton toggle for bones, or for a mesh-less hierarchy (which has no bones but is still a rig).
          setPreviewHasRig(info.hasBones || !info.hasMesh);
          // Show the skeleton by default when there is no mesh, because there would be nothing else to see.
          setPreviewSkeletonVisible(!info.hasMesh);
        },
      });
    rendererRef.current = renderer;
    disposePreviewRef.current = dispose;
    cameraRef.current = camera;
    selectAnimationRef.current = selectAnimation;
    setSkeletonVisibleRef.current = setSkeletonVisible;

    // dispose() cancels first: an in-flight load's callbacks must not
    // render on the disposed renderer or write into the next preview's
    // status/animation/rig state (or its thumbnail).
    return disposeRenderer;
    // `fileEntries` is left out of the list on purpose: status changes (uploading, success, error) must not restart
    // the preview. Replacing the list always bumps `filesVersion` instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIndex, filesVersion]);

  // Deliberately keyed on previewStatus ONLY: each load produces its own
  // init→OK transition, so this fires exactly once per successful load. A
  // previewIndex dep would also fire it on a bare index switch while the
  // PREVIOUS load's "OK" lingers — snapshotting file A's frame under file
  // B's key.
  useEffect(() => {
    if (previewStatus.type === "OK" && canvasRef.current) {
      // Copy the canvas into an image Blob; the callback gets null if the browser could not make one.
      snapshotCanvasAsThumbnail({
        targetNode: canvasRef.current,
        resultCallback: (blob) => {
          // The file this snapshot belongs to (the row on screen when the picture came back).
          const currentFile = fileEntries[previewIndex]?.file;
          if (blob && currentFile) {
            // Functional update on a copy of the map, so overlapping snapshots never overwrite each other.
            setThumbnails((prev) => new Map(prev).set(currentFile, blob));
          }
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewStatus]);

  // Keep the chosen subtype in step with the dialog's list: no choices means no subtype; a new list resets it to
  // the first choice.
  useEffect(() => {
    if (!fileSubtypes || fileSubtypes.length === 0) {
      setSubtype(undefined);
      return;
    }
    setSubtype(
      Object.values(fileSubtypes[0])[0] as MediaFileAnimationType | undefined,
    );
  }, [fileSubtypes]);

  // Status updates are keyed by FILE IDENTITY, never by row index: async
  // upload/parse callbacks outlive list mutations (removing a row, re-picks),
  // and a positional index captured before an await would land the status on
  // whatever row shifted into that slot.
  const updateFileStatusByFile = (
    file: File,
    status: FileEntryStatus,
    errorMessage?: string,
  ) => {
    // Functional update: it always starts from the latest list, so overlapping status reports do not overwrite each other.
    setFileEntries((prev) =>
      prev.map((entry) =>
        entry.file === file ? { ...entry, status, errorMessage } : entry,
      ),
    );
  };

  // Drop a row from the list (the X button, shown only on rows that have not started uploading).
  const removeFile = (index: number) => {
    setFileEntries((prev) => {
      // The list without the removed row.
      const next = prev.filter((_, i) => i !== index);
      // Keep the preview pointing at a row that still exists (the last one if the previewed row was the last).
      setPreviewIndex((prevIdx) =>
        Math.min(prevIdx, Math.max(0, next.length - 1)),
      );
      return next;
    });
    // Restart the preview even if the index number did not change (a different file now sits at that index).
    setFilesVersion((v) => v + 1);
  };

  // Resolve the backend-required clip durations for an animation upload.
  // Files with no clips are marked as errors (the backend would reject them)
  // and excluded from the returned map.
  const resolveAnimationDurations = async (
    files: File[],
  ): Promise<Map<File, number>> => {
    // File -> clip length in milliseconds, filled in below for every file that has a clip.
    const durations = new Map<File, number>();
    // Read all the files at the same time and wait for every one to finish.
    await Promise.all(
      files.map(async (file) => {
        // A parse REJECTION (corrupt file) and a clip-less null are
        // different problems — conflating them sent users hunting for
        // missing clips in files that simply couldn't be read.
        let millis: number | null;
        let unreadable = false;
        try {
          millis = await readGlbAnimationDurationMillis(file);
        } catch {
          millis = null;
          unreadable = true;
        }
        if (millis === null) {
          // No usable duration: mark this row red with the matching message.
          updateFileStatusByFile(
            file,
            "error",
            unreadable
              ? "Couldn't read this file — it may be corrupt."
              : "No animation clips found in this file.",
          );
        } else {
          durations.set(file, millis);
        }
      }),
    );
    return durations;
  };

  // True when this dialog is the "Upload animation" one (the files must then carry a clip duration).
  const isAnimationUpload =
    engineCategory === FilterEngineCategories.ANIMATION;

  // The small Retry arrow on a failed row: upload just that file again (or, for an FBX, convert it again).
  const retrySingleFile = async (index: number) => {
    // The row to retry; ignore a stale click for a row that is gone or is already busy.
    const entry = fileEntries[index];
    if (!entry || entry.status === "uploading" || entry.status === "converting")
      return;
    // A failed FBX conversion retries the conversion, not an upload — the
    // raw FBX must never reach the backend.
    if (isFbx(entry.file)) {
      updateFileStatusByFile(entry.file, "converting");
      beginFbxConversion(entry.file);
      return;
    }
    // Mark uploading BEFORE the duration parse: leaving the row on "error"
    // through that await kept the retry button live, so rapid clicks ran
    // duplicate uploads.
    updateFileStatusByFile(entry.file, "uploading");
    // The clip length, only needed (and only read) for animation uploads.
    let durationMillis: number | undefined;
    if (isAnimationUpload) {
      let millis: number | null;
      let unreadable = false;
      try {
        millis = await readGlbAnimationDurationMillis(entry.file);
      } catch {
        millis = null;
        unreadable = true;
      }
      if (millis === null) {
        // No usable duration: put the row back to red with the matching message and do not upload.
        updateFileStatusByFile(
          entry.file,
          "error",
          unreadable
            ? "Couldn't read this file — it may be corrupt."
            : "No animation clips found in this file.",
        );
        return;
      }
      durationMillis = millis;
    }
    // Upload with the same call a lone-file upload uses, but turn its progress into this row's status instead of
    // passing it to the dialog. (This path never calls `onUploadProgress`; see N-101 in BUGS.md.)
    await upload3DObjects({
      // The library title is the file name without its extension.
      title: entry.file.name.slice(0, entry.file.name.lastIndexOf(".")),
      assetFile: entry.file,
      engineCategory,
      animationType: subtype,
      durationMillis,
      // The cover picture taken earlier for this file, if the person previewed it (otherwise undefined: no cover).
      thumbnailSnapshot: thumbnails.get(entry.file),
      progressCallback: (state) => {
        if (state.status === UploaderStates.success) {
          updateFileStatusByFile(entry.file, "success");
        } else if (
          // Any of the three failure states turns the row red: the file itself, or making / attaching its cover.
          state.status === UploaderStates.assetError ||
          state.status === UploaderStates.coverCreateError ||
          state.status === UploaderStates.coverSetError
        ) {
          updateFileStatusByFile(entry.file, "error", state.errorMessage);
        }
      },
    });
  };

  // Called by the file chooser with the complete new selection (it replaces the list, it does not append).
  const handleFilesChange = (files: File[]) => {
    // A submission is being set up (the clip lengths are still being read), a batch is running, or a single-row Retry
    // is uploading. Swapping the list now would leave the running upload with no rows on screen, keep the new list's
    // Upload button disabled until the old batch ends, and then let that batch's finish replace the new list with its
    // success or error screen. Keep the current list until the upload ends; the chooser is not disabled because the
    // react-drag-drop-files drop handler ignores its `disabled` flag, so this guard is the only thing that holds.
    // (The Image and Splat pickers have the same guard, B-153.)
    if (
      isSubmittingRef.current ||
      isUploading ||
      fileEntries.some((e) => e.status === "uploading")
    )
      return;
    // Start a fresh list: every row idle (an FBX "converting"), preview back on the first row, old pictures,
    // messages and counters cleared.
    setFileEntries(
      files.map((f) => ({
        file: f,
        status: isFbx(f) ? "converting" : "idle",
      })),
    );
    setPreviewIndex(0);
    setFilesVersion((v) => v + 1);
    setThumbnails(new Map());
    setSelectionError(undefined);
    setOverallProgress(null);
    setIsUploading(false);
    // Start converting every FBX in the new selection.
    files.filter(isFbx).forEach(beginFbxConversion);
  };

  // The Upload button.
  const handleSubmit = async () => {
    // Animation submissions await GLB parsing for hundreds of ms before any
    // state changes, so a second click in that window would run the whole
    // submission twice (duplicate backend assets).
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Nothing chosen: ask for a file instead of starting an upload.
    if (fileEntries.length === 0) {
      setSelectionError("Please select a file to upload.");
      releaseSubmitGuard();
      return;
    }
    // An FBX is still being converted: wait for it rather than silently leaving it out.
    if (fileEntries.some((e) => e.status === "converting")) {
      setSelectionError("Still converting FBX files — one moment.");
      releaseSubmitGuard();
      return;
    }

    // Un-converted FBX entries (conversion failed) are excluded — the raw
    // FBX must never be uploaded.
    const pendingEntries = fileEntries.filter(
      (entry) =>
        entry.status !== "success" &&
        entry.file !== undefined &&
        !isFbx(entry.file),
    );
    // Entries dropped from the submission (failed FBX conversions here,
    // clip-less animation files below) still count against the run's
    // outcome — a run that silently skips files must not report success.
    let excludedCount =
      fileEntries.filter((e) => e.status !== "success").length -
      pendingEntries.length;
    // The files that will actually be uploaded, in list order.
    let files = pendingEntries.map((entry) => entry.file!);

    // Everything was excluded (every file is a failed FBX): say so and stop.
    if (files.length === 0) {
      setSelectionError(
        excludedCount > 0
          ? `${excludedCount} file(s) could not be converted and cannot be uploaded.`
          : "Please select a file to upload.",
      );
      releaseSubmitGuard();
      return;
    }

    // Animation uploads must carry the clip duration; clip-less files are
    // flagged and dropped from the submission.
    let durations: Map<File, number> | undefined;
    if (isAnimationUpload) {
      durations = await resolveAnimationDurations(files);
      // Which of the files got a duration (the others were marked red by `resolveAnimationDurations`).
      const keep = files.map((file) => durations!.has(file));
      excludedCount += keep.filter((kept) => !kept).length;
      files = files.filter((_, i) => keep[i]);
      if (files.length === 0) {
        setSelectionError("No animation clips found in the selected file(s).");
        releaseSubmitGuard();
        return;
      }
    }

    // The cover pictures for those files. A file the person never previewed has none and is left out of the map.
    const pendingThumbnails = new Map<File, Blob>(
      files
        .map((file) => [file, thumbnails.get(file) ?? undefined])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined),
    );

    // Exclusions force fileEntries.length > files.length, so this fast path
    // can only ever be a clean single-file submission; the excludedCount
    // check makes that invariant explicit rather than incidental.
    // Exactly one file in the whole list: upload it directly and let the DIALOG show the progress screens
    // ("Uploading...", success, or the error screen) by passing the dialog's callback straight through.
    if (excludedCount === 0 && files.length === 1 && fileEntries.length === 1) {
      upload3DObjects({
        title: files[0].name.slice(0, files[0].name.lastIndexOf(".")),
        assetFile: files[0],
        engineCategory,
        animationType: subtype,
        durationMillis: durations?.get(files[0]),
        thumbnailSnapshot: thumbnails.get(files[0]),
        progressCallback: onUploadProgress,
      });
      // upload3DObjects reports uploadingAsset synchronously, so the modal
      // has already switched off this view — safe to release the guard.
      releaseSubmitGuard();
      return;
    }

    // Several files: stay on this screen, show the counter, and start all the uploads at once (every row turns
    // to "uploading" immediately; the batch helper reports each row as its own upload finishes).
    setIsUploading(true);
    setOverallProgress({ current: 0, total: files.length });

    upload3DObjectsBatch({
      files,
      thumbnails: pendingThumbnails,
      engineCategory,
      animationType: subtype,
      // The clip lengths (animation uploads only).
      durationsMillis: durations,
      // Per-file status goes to that file's row (looked up by file, not by position).
      onFileStatusChange: (batchIndex, status, errorMessage) =>
        updateFileStatusByFile(files[batchIndex], status, errorMessage),
      // Drives the "Uploading n / total..." line.
      onOverallProgress: (completed, total) =>
        setOverallProgress({ current: completed, total }),
      // Runs once, after the last file finished.
      onComplete: (allSucceeded, anySucceeded) => {
        setIsUploading(false);
        releaseSubmitGuard();
        // allSucceeded only covers the files actually submitted; excluded
        // entries count as failures, so a partial run stays on the list
        // view where per-row errors and the failure count tell the truth.
        if (allSucceeded && excludedCount === 0) {
          // Everything saved: the dialog shows its success screen.
          onUploadProgress({ status: UploaderStates.success });
        } else if (!anySucceeded) {
          // Nothing saved: the dialog shows its error screen.
          onUploadProgress({
            status: UploaderStates.assetError,
            errorMessage: "All uploads failed.",
          });
        }
        // Otherwise some saved and some failed: stay here with the per-row marks and the Retry Failed button.
        // The dialog is not told (see N-101 in BUGS.md).
      },
    });
  };

  // Lets the Upload button be used again (clears both the state that greys the button and the same-tick ref).
  const releaseSubmitGuard = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  // The Retry Failed button: upload again only the rows that are currently red.
  const retryAllFailed = async () => {
    // Same in-flight guard as handleSubmit. An animation retry awaits GLB parsing before any row changes state, so the
    // button stays visible and a second press in that window would start a second batch for the same files
    // (duplicate backend assets). The ref blocks that second press at once; it is released on every way out below.
    if (isSubmittingRef.current) return;
    // FBX conversion failures are excluded (they retry per-row as a
    // re-conversion); this batch path only re-uploads real GLBs.
    let failedFiles = fileEntries
      .filter((e) => e.status === "error" && !isFbx(e.file))
      .map((e) => e.file);
    // Nothing to retry (a stale click): nothing to do.
    if (failedFiles.length === 0) return;
    // Take the guard only now that there is something to retry, so the early return above leaves nothing held.
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Animation uploads need the clip lengths again; files that still have none are marked red and left out.
    let durations: Map<File, number> | undefined;
    if (isAnimationUpload) {
      durations = await resolveAnimationDurations(failedFiles);
      failedFiles = failedFiles.filter((file) => durations!.has(file));
      if (failedFiles.length === 0) {
        // No file could be retried (none has a readable clip): the rows are red again, so let the button be used again.
        releaseSubmitGuard();
        return;
      }
    }

    // Their cover pictures (only the ones that were taken).
    const failedThumbnails = new Map<File, Blob>(
      failedFiles
        .map((file): [File, Blob | undefined] => [
          file,
          thumbnails.get(file) ?? undefined,
        ])
        .filter((pair): pair is [File, Blob] => pair[1] !== undefined),
    );

    // Rows that were already saved before this retry started. `anySucceeded` below only describes the retried files,
    // so without this check a failed retry would report "All uploads failed." even though these rows are in the
    // library (and would swap the picker, with its Retry Failed button, for the error screen).
    const hadEarlierSuccess = fileEntries.some((e) => e.status === "success");

    // Same screen-state set-up as a first batch, but for the failed files only.
    setIsUploading(true);
    setOverallProgress({ current: 0, total: failedFiles.length });

    upload3DObjectsBatch({
      files: failedFiles,
      thumbnails: failedThumbnails,
      engineCategory,
      animationType: subtype,
      durationsMillis: durations,
      // Write each result back to the failed row it belongs to (looked up by file).
      onFileStatusChange: (batchIndex, status, errorMessage) =>
        updateFileStatusByFile(failedFiles[batchIndex], status, errorMessage),
      onOverallProgress: (completed, total) =>
        setOverallProgress({ current: completed, total }),
      onComplete: (allSucceeded, anySucceeded) => {
        setIsUploading(false);
        // The retry batch has ended: Retry Failed (and a new file pick) can be used again.
        releaseSubmitGuard();
        if (allSucceeded) {
          // The retried files all saved. Every earlier row was either saved or is in this batch, so the whole list
          // is now saved and the dialog shows its success screen.
          onUploadProgress({ status: UploaderStates.success });
        } else if (!anySucceeded && !hadEarlierSuccess) {
          // Nothing in the list was ever saved: the error screen is true.
          onUploadProgress({
            status: UploaderStates.assetError,
            errorMessage: "All uploads failed.",
          });
        }
      },
    });
  };

  // Overlayed on the preview canvas: bone toggle for rigged models and the
  // clip picker for models with baked animations; still models get no extra
  // chrome. Shared by the single and multi layouts.
  const animationPicker = (previewAnimations.length > 0 ||
    previewHasRig) && (
    <div className="pointer-events-auto absolute right-2 top-2 z-10 flex items-start gap-2">
      {/* The bone button (rigged models only); outlined white while the skeleton is shown. */}
      {previewHasRig && (
        <button
          type="button"
          title={
            previewSkeletonVisible ? "Hide skeleton" : "Show skeleton"
          }
          onClick={handleSkeletonToggle}
          className={`flex h-10 w-10 items-center justify-center rounded-[3px] border transition-colors ${
            previewSkeletonVisible
              ? "border-white bg-white/10 text-white"
              : "border-ui-controls-border bg-ui-controls text-white/70 hover:text-white"
          }`}
        >
          <BoneIcon />
        </button>
      )}
      {/* The clip chooser (models with baked animations only): each clip by name, plus "T-pose (none)" as -1. */}
      {previewAnimations.length > 0 && (
        <div className="w-44">
          <Select
            value={String(previewClip)}
            onChange={handlePreviewClipChange}
            options={[
              ...previewAnimations.map((name, index) => ({
                label: name,
                value: String(index),
              })),
              { label: "T-pose (none)", value: "-1" },
            ]}
          />
        </div>
      )}
    </div>
  );

  // Facts about the list that decide what to draw below.
  // More than one file chosen: show the list-plus-preview layout instead of a single preview.
  const isMulti = fileEntries.length > 1;
  // At least one red row.
  const anyFailed = fileEntries.some((e) => e.status === "error");
  // At least one row is mid-upload (a batch row or a single-row Retry).
  const anyUploading = fileEntries.some((e) => e.status === "uploading");
  // At least one FBX is still being converted (the Upload button waits for it).
  const anyConverting = fileEntries.some((e) => e.status === "converting");
  // "Started" means an actual upload — FBX conversion (and its failures)
  // must not hide the Upload button.
  const hasUploadStarted = fileEntries.some(
    (e) => e.status === "uploading" || e.status === "success",
  );
  // Every row has finished, one way or the other (used to show the failure summary and Retry Failed).
  const allDone =
    fileEntries.length > 0 &&
    fileEntries.every((e) => e.status === "success" || e.status === "error");
  // The file in the previewed row (undefined when the list is empty); decides whether to show the "no model yet" hint.
  const currentFile = fileEntries[previewIndex]?.file;
  // True while the previewed row is an FBX that is still being converted.
  const isConvertingCurrent =
    fileEntries[previewIndex]?.status === "converting";

  // Overlayed on the preview canvas while the current FBX is normalizing,
  // or when its conversion failed (the sidebar only exists in multi mode).
  const currentEntry = fileEntries[previewIndex];
  const convertingOverlay = isConvertingCurrent ? (
    <h6 className="pointer-events-none absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-60">
      <LoaderIcon  className="animate-spin" />
      Converting FBX to GLB...
    </h6>
  ) : currentEntry?.status === "error" && isFbx(currentEntry.file) ? (
    <h6 className="pointer-events-none absolute left-0 top-1/2 -mt-5 w-full px-4 text-center text-red-400">
      {currentEntry.errorMessage ?? "FBX conversion failed."}
    </h6>
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      {/* The subtype drop-down, only when the dialog offered more than one choice. */}
      {fileSubtypes && fileSubtypes.length > 1 && (
        <ListDropdown
          list={fileSubtypes}
          onSelect={(value) => setSubtype(value as MediaFileAnimationType)}
        />
      )}

      {/* The drop area / browse button. It is given the current files so it can show them, and it hands back the whole new selection. */}
      <FileUploader
        fileTypes={fileTypes}
        files={fileEntries.map((e) => e.file)}
        handleChange={handleFilesChange}
        multiple={true}
        fileIcon={BoxIcon}
      />

      {/* The red message when Upload could not start (nothing chosen, still converting, ...). */}
      {selectionError && <h6 className="z-10 text-red">{selectionError}</h6>}

      {isMulti ? (
        // Several files: file list on the left, resizable against the preview on the right.
        <PanelGroup direction="horizontal">
          <Panel defaultSize={33} minSize={20}>
          {/* The file list. Clicking a row previews that file. */}
          <ul className="flex h-full flex-col gap-1 overflow-y-auto rounded-none border border-white/15 bg-black/30 p-2">
            {fileEntries.map((entry, i) => (
              <li
                // Index keys are fine here: rows are only removed before the upload starts, and the status is kept
                // in `fileEntries`, not in the row component.
                key={i}
                // `group` lets the Retry button (below) appear when the mouse is over this row; the previewed row is highlighted.
                className={`group flex cursor-pointer items-center justify-between gap-1.5 rounded-[3px] px-2 py-1 text-sm transition-colors ${
                  i === previewIndex ? "bg-white/10" : "hover:bg-white/5"
                }`}
                onClick={() => setPreviewIndex(i)}
              >
                {/* The file name without its extension; the full name is in the tooltip. */}
                <span className="flex-1 truncate" title={entry.file.name}>
                  {entry.file.name.slice(0, entry.file.name.lastIndexOf("."))}
                </span>
                {/* The status mark. Exactly one of the cases below is drawn for each row. */}
                <span className="shrink-0">
                  {/* Not started: a cross to take the file out of the list. stopPropagation keeps the click from also selecting the row. */}
                  {entry.status === "idle" && (
                    <button
                      className="opacity-40 transition-opacity hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      title="Remove"
                    >
                      <XIcon />
                    </button>
                  )}
                  {/* Uploading or converting an FBX: a spinner. */}
                  {(entry.status === "uploading" ||
                    entry.status === "converting") && (
                    <LoaderIcon

                      className="animate-spin opacity-60" />
                  )}
                  {/* Saved: a green tick. */}
                  {entry.status === "success" && (
                    <CheckIcon

                      className="text-green-400" />
                  )}
                  {/* Failed: a red alert mark plus a Retry arrow that only shows while the mouse is over the row. */}
                  {entry.status === "error" && (
                    <span className="flex items-center gap-1">
                      <CircleAlertIcon

                        className="text-red-400" />
                      <button
                        className="hidden items-center text-xs text-white/60 transition-colors hover:text-white group-hover:inline-flex"
                        onClick={(e) => {
                          e.stopPropagation();
                          retrySingleFile(i);
                        }}
                        title="Retry"
                      >
                        <RotateCwIcon />
                      </button>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          </Panel>

          {/* The draggable divider between the list and the preview. */}
          <PanelResizeHandle className="flex w-4 items-center justify-center">
            <div
              className="h-8 w-1 rounded-none bg-white/20 transition-colors hover:bg-white/40"
              // The library listens for pointerdown on the page in the capture phase, so this does not stop a
              // resize from starting; it only keeps the event from reaching anything above the grip.
              onPointerDown={(e) => e.stopPropagation()}
            />
          </PanelResizeHandle>

          <Panel defaultSize={67} minSize={25}>
          {/* The preview column: the 3D canvas, then previous / next arrows with a "2 / 5" position label. */}
          <div className="flex h-full flex-col gap-2">
            <div className="relative w-full min-h-48 overflow-hidden rounded-none border border-white/15 bg-black/30">
              {/* The canvas the model is drawn on. pointer-events-none so it cannot catch clicks meant for the dialog. */}
              <canvas
                className="pointer-events-none h-full min-h-48 !w-full"
                ref={canvasCallbackRef}
              />
              {/* The bone button and clip chooser (drawn only for models that have a rig or clips). */}
              {animationPicker}
              {/* "Converting FBX to GLB..." or the conversion's error text. */}
              {convertingOverlay}
              {/* A hint shown while there is no file to preview. */}
              {!currentFile && (
                <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
                  <BoxIcon />
                  Your model preview will appear here
                </h6>
              )}
              {/* The loader's error text (for example "Error" plus a message) drawn over the canvas. */}
              {previewStatus.type.includes("Error") && (
                <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
                  {previewStatus.type}
                  {previewStatus.message && <br />}
                  {previewStatus.message}
                </h6>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              {/* Previous file (disabled on the first). */}
              <Button
                variant="secondary"
                onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                disabled={previewIndex === 0}
              >
                <ChevronLeftIcon />
              </Button>
              {/* Position label, counting from 1 for people. */}
              <span className="text-sm opacity-60">
                {previewIndex + 1} / {fileEntries.length}
              </span>
              {/* Next file (disabled on the last). */}
              <Button
                variant="secondary"
                onClick={() =>
                  setPreviewIndex((p) =>
                    Math.min(fileEntries.length - 1, p + 1),
                  )
                }
                disabled={previewIndex === fileEntries.length - 1}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
          </Panel>
        </PanelGroup>
      ) : (
        // One file (or none): just the preview, no list.
        <div className="relative m-auto w-full min-h-48 overflow-hidden rounded-none border border-white/15 bg-black/30">
          {/* The canvas the model is drawn on (same ref callback as the multi-file layout). */}
          <canvas
            className="pointer-events-none h-full min-h-48 !w-full"
            ref={canvasCallbackRef}
          />
          {/* The bone button and clip chooser (drawn only for models that have a rig or clips). */}
          {animationPicker}
          {/* "Converting FBX to GLB..." or the conversion's error text. */}
          {convertingOverlay}
          {/* A hint shown while there is no file to preview. */}
          {!currentFile && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 flex w-full items-center justify-center gap-2.5 text-center opacity-50">
              <BoxIcon />
              Your model preview will appear here
            </h6>
          )}
          {/* The loader's error text drawn over the canvas. */}
          {previewStatus.type.includes("Error") && (
            <h6 className="pointer-events-auto absolute left-0 top-1/2 -mt-5 w-full text-center">
              {previewStatus.type}
              {previewStatus.message && <br />}
              {previewStatus.message}
            </h6>
          )}
        </div>
      )}

      {/* The "Uploading 2 / 5..." line, shown during a multi-file upload. */}
      {(isUploading || anyUploading) && overallProgress && isMulti && (
        <p className="text-center text-sm opacity-60">
          Uploading {overallProgress.current} / {overallProgress.total}...
        </p>
      )}

      {/* After a multi-file upload ends with some red rows: how many failed. */}
      {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
        <p className="text-center text-sm text-red-400">
          {fileEntries.filter((e) => e.status === "error").length} file(s)
          failed to upload.
        </p>
      )}

      {/* The button row. */}
      <div className="flex justify-end gap-2">
        {/* Cancel closes the dialog at any time. */}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {/* Retry Failed appears only when a multi-file upload has fully finished with at least one red row. */}
        {!isUploading && !anyUploading && allDone && anyFailed && isMulti && (
          <Button
            variant="secondary"
            onClick={retryAllFailed}
            // Greyed while a retry is being set up (the clip lengths are being read) so a second press is visibly refused.
            disabled={isSubmitting}
          >
            Retry Failed
          </Button>
        )}
        {/* Upload appears only before any upload has started; it is disabled while the list is empty, an FBX converts, or a submission is in flight. */}
        {!hasUploadStarted && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={fileEntries.length === 0 || anyConverting || isSubmitting}
          >
            {anyConverting
              ? "Converting..."
              : isSubmitting
                ? "Uploading..."
                : "Upload"}
          </Button>
        )}
      </div>
    </div>
  );
};
