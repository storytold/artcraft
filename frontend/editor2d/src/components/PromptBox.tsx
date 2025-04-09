import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSignals } from "@preact/signals-react/runtime";
import { toast } from "sonner";
import {
  UploaderStates,
  // UploaderState,
  uploadImage,
} from "~/components/UploadImage";

import { PopoverMenu } from "~/components/reusable/Popover";
import { Tooltip } from "~/components/reusable/Tooltip";
import { Button } from "~/components/reusable/Button";
import { ToggleButton } from "~/components/reusable/ToggleButton";
import { Toaster } from "~/components/ui/Toast";
import {
  faMessageXmark,
  faMessageCheck,
  faSparkles,
  faSpinnerThird,
  faTimes,
  faPlus,
  faUpload,
  faImages,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleWide,
  faRectangleVertical,
  faSquare,
  faRectangle,
} from "@fortawesome/pro-regular-svg-icons";
import { getCanvasRenderBitmap } from "~/signal/canvasRenderBitmap";
import { EncodeImageBitmapToBase64 } from "~/utilities/EncodeImageBitmapToBase64";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverItem } from "~/components/reusable/Popover";
import { Api, ApiManager } from "~/KonvaApp/Api";
import { useJobContext } from "~/components/JobContext";
interface ReferenceImage {
  id: string;
  url: string;
  file: File;
  mediaToken: string;
}

export const PromptBox = () => {
  useSignals();
  const isDesktopApp = window.navigator.userAgent.includes("Tauri");
  console.log("Is this a desktop app?", isDesktopApp);

  const { jobToken, setJobToken } = useJobContext();

  //const { lastRenderedBitmap } = useCanvasSignal();
  const [prompt, setPrompt] = useState("");
  const [isEnqueueing, setisEnqueueing] = useState(false);
  const [useSystemPrompt, setUseSystemPrompt] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "3:2",
      selected: true,
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "2:3",
      selected: false,
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "1:1",
      selected: false,
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
    {
      label: "16:9",
      selected: false,
      icon: <FontAwesomeIcon icon={faRectangleWide} className="h-4 w-4" />,
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const uploadId = Math.random().toString(36).substring(7);
        setUploadingImages((prev) => [...prev, { id: uploadId, file }]);

        const reader = new FileReader();
        reader.onloadend = () => {
          uploadImage({
            title: `reference-image-${Math.random().toString(36).substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState) => {
              console.debug("Upload progress:", newState.data);
              if (newState.status === UploaderStates.success && newState.data) {
                const referenceImage: ReferenceImage = {
                  id: Math.random().toString(36).substring(7),
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data || "",
                };
                setReferenceImages((prev) => [...prev, referenceImage]);
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId),
                );
                console.log("Reference image added:", referenceImage);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId),
                );
                console.error("Upload failed");
              }
            },
          });
        };

        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveReference = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLibrarySelect = () => {
    console.log("Opening library selector");
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "upload":
        handleUploadClick();
        break;
      case "library":
        handleLibrarySelect();
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").trim();
    setPrompt(pastedText);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleEnqueue = async () => {
    if (!prompt.trim()) return;

    setisEnqueueing(true);

    try {
      console.log(
        "Enqueuing with prompt:",
        prompt,
        "and reference images:",
        referenceImages,
      );

      if (isDesktopApp) {
        let image = getCanvasRenderBitmap();
        if (image === undefined) {
          return;
        }
        const base64Bitmap = await EncodeImageBitmapToBase64(image);
        const generateResponse = await invoke("image_generation_command", {
          image: base64Bitmap,
          prompt: prompt,
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!isDesktopApp) {
        const api = new Api();
        let image = getCanvasRenderBitmap();
        if (image === undefined) {
          console.error(
            "Error: Unable to generate image. Please check the input and try again.",
          );
          return;
        }
        const base64Bitmap = await EncodeImageBitmapToBase64(image);
        const byteString = atob(base64Bitmap);
        const mimeString = "image/png";
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        const uuid = crypto.randomUUID(); // Generate a new UUID
        const file = new File([ab], `${uuid}.png`, { type: mimeString });

        const snapshotMediaToken = await api.uploadSceneSnapshot({
          screenshot: file,
        });

        if (snapshotMediaToken.data === undefined) {
          console.error("Error: Unable to upload scene snapshot.");
          return;
        }

        console.log("Snapshot media token:", snapshotMediaToken.data);

        const response = await api.enqueueImageGeneration({
          prompt: prompt,
          snapshotMediaToken: snapshotMediaToken.data,
          additionalImages: referenceImages.map((image) => image.mediaToken),
        });

        if (response.success === true) {
          console.error("Successfully enqueued image generation.");

          if (response.data) {
            console.log("Response:", response.data);
            setJobToken(response.data);
          }

          return;
        } else {
          console.log("Image generation Not Successful.");
          toast.error("Failed to generate image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error during image generation:", error);
      toast.error(
        "An error occurred while generating the image. Please try again.",
      );
    } finally {
      setisEnqueueing(false);
    }
  };

  const getCurrentAspectRatioIcon = () => {
    const selected = aspectRatioList.find((item) => item.selected);
    if (!selected || !selected.icon) return faRectangle;
    const iconElement = selected.icon as React.ReactElement;
    return iconElement.props.icon;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
      {(referenceImages.length > 0 || uploadingImages.length > 0) && (
        <div className="flex w-full gap-2">
          {referenceImages.map((image) => (
            <div
              key={image.id}
              className="glass relative aspect-square w-20 rounded-lg"
            >
              <img
                src={image.url}
                alt="Reference"
                className="h-full w-full rounded-lg object-cover"
              />
              <button
                onClick={() => handleRemoveReference(image.id)}
                className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black"
              >
                <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {uploadingImages.map(({ id, file }) => {
            const previewUrl = URL.createObjectURL(file);
            return (
              <div
                key={id}
                className="glass relative aspect-square w-20 overflow-hidden rounded-lg"
              >
                <div className="absolute inset-0">
                  <img
                    src={previewUrl}
                    alt="Uploading preview"
                    className="h-full w-full object-cover blur-sm"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="h-6 w-6 animate-spin text-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="glass w-[730px] rounded-xl p-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          multiple
        />
        <div className="flex justify-center gap-2">
          <PopoverMenu
            mode="button"
            panelTitle="Add Image"
            items={[
              {
                label: "Upload from device",
                selected: false,
                icon: <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />,
                action: "upload",
              },
              {
                label: "Choose from library",
                selected: false,
                icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
                action: "library",
                disabled: true,
              },
            ]}
            onPanelAction={handleAction}
            showIconsInList
            buttonClassName="backdrop-blur-none bg-transparent hover:bg-transparent py-1.5 px-0 pr-1 m-0 hover:opacity-50 transition-opacity duration-100 ring-0 border-none focus:ring-0 outline-none"
            triggerIcon={<FontAwesomeIcon icon={faPlus} className="text-xl" />}
          />

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Describe your image..."
            className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-white placeholder-white placeholder:text-white/60 focus:outline-none"
            value={prompt}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onFocus={() => {}}
            onBlur={() => {}}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tooltip
              content="Aspect ratio"
              position="top"
              className="z-50"
              closeOnClick={true}
            >
              <PopoverMenu
                items={aspectRatioList}
                onSelect={handleAspectRatioSelect}
                mode="toggle"
                panelTitle="Aspect Ratio"
                showIconsInList
                triggerIcon={
                  <FontAwesomeIcon
                    icon={getCurrentAspectRatioIcon()}
                    className="h-4 w-4"
                  />
                }
              />
            </Tooltip>
            <Tooltip
              content={
                useSystemPrompt
                  ? "Use system prompt: ON"
                  : "Use system prompt: OFF"
              }
              position="top"
              className="z-50"
              delay={200}
            >
              <ToggleButton
                isActive={useSystemPrompt}
                icon={faMessageXmark}
                activeIcon={faMessageCheck}
                onClick={() => setUseSystemPrompt(!useSystemPrompt)}
              />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              icon={!isEnqueueing ? faSparkles : undefined}
              onClick={handleEnqueue}
              disabled={isEnqueueing || !prompt.trim()}
            >
              {isEnqueueing ? (
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  className="animate-spin text-lg"
                />
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
