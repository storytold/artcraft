import React, {
  useState,
  useCallback,
  useRef,
  useContext,
  useEffect,
} from "react";
import { FileUploader } from "react-drag-drop-files";
import {
  ReactCrop,
  Crop,
  centerCrop,
  makeAspectCrop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrop,
  faExpand,
  faFileImage,
  faImage,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { Label, P } from "~/components";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { MediaFilesApi } from "~/Classes/ApiManager/MediaFilesApi";
import { BucketConfig } from "~/api/BucketConfig";
import { useShallow } from "zustand/shallow";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

export const IPAdapter: React.FC = () => {
  const editorEngine = useContext(EngineContext);
  const {
    adapterImage,
    globalIPAMediaToken,
    setAdapterImage,
    setGlobalIPAMediaToken,
  } = usePageEnigmaStore(
    useShallow((s) => ({
      adapterImage: s.adapterImage,
      globalIPAMediaToken: s.globalIPAMediaToken,
      setAdapterImage: s.setAdapterImage,
      setGlobalIPAMediaToken: s.setGlobalIPAMediaToken,
    })),
  );
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpandedDialogOpen, setIsExpandedDialogOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const FILE_TYPES = ["JPG", "PNG", "JPEG"];
  const bucketConfig = new BucketConfig();

  useEffect(() => {
    const fetchMediaFile = async () => {
      const mediaFilesApi = new MediaFilesApi();
      if (editorEngine && adapterImage === null && globalIPAMediaToken) {
        try {
          const response = await mediaFilesApi.GetMediaFileByToken({
            mediaFileToken: globalIPAMediaToken,
          });
          if (response.success && response.data) {
            const imageUrl = bucketConfig.getGcsUrl(
              response.data.public_bucket_path,
            );
            setAdapterImage(imageUrl);
          } else {
            console.error("Failed to fetch media file:", response.errorMessage);
          }
        } catch (error) {
          console.error("Error fetching media file:", error);
        }
      }
    };

    fetchMediaFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorEngine, globalIPAMediaToken, adapterImage]);

  const onFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
      setIsDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const crop = centerCrop(
        makeAspectCrop({ unit: "%", width: 100 }, 1, width, height),
        width,
        height,
      );
      setCrop(crop);
    },
    [],
  );

  const onCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const createCroppedImage = async (
    image: HTMLImageElement,
    crop: PixelCrop,
  ) => {
    if (!crop || !image) {
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }

    return new Promise<string>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
        } else {
          reject(new Error("Canvas is empty"));
        }
      }, "image/jpeg");
    });
  };

  // this is the function that outputs the cropped image
  const onSaveCrop = async () => {
    if (completedCrop && imageSrc && imgRef.current) {
      const croppedImageUrl = await createCroppedImage(
        imgRef.current,
        completedCrop,
      );

      if (croppedImageUrl) {
        // converts base64 cropped image into a file for upload
        const croppedImageFile = base64ToFile(
          croppedImageUrl,
          "cropped-image.jpg",
        );
        setAdapterImage(URL.createObjectURL(croppedImageFile));
        if (editorEngine) {
          editorEngine.globalIpAdapterImage = croppedImageFile;
        }
      }
      setIsDialogOpen(false);
      setCrop(undefined);
    }
  };

  const onDeleteImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setImageSrc(null);
    setCrop(undefined);
    setAdapterImage(null);
    setGlobalIPAMediaToken(null);
    if (editorEngine) {
      editorEngine.globalIpAdapterImage = undefined;
    }
  };

  const DragAndDropZone = () => {
    return (
      <div className="flex cursor-pointer items-center gap-3.5 rounded-lg border border-dashed border-[#363636] bg-brand-secondary p-3 transition-all duration-150 hover:bg-ui-controls-button/40">
        <FontAwesomeIcon icon={faFileImage} className="text-3xl" />
        <div className="flex flex-col gap-0 text-sm">
          <P className="font-medium">
            <u>Upload an image</u> or drop it here
          </P>
          <P className="flex items-center gap-2 text-sm font-normal opacity-50">
            {FILE_TYPES.join(", ").toString()} supported
          </P>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-2">
        <Label className="mb-0">
          Additional Style Reference Image{" "}
          <span className="text-xs font-normal text-white/70">(Optional)</span>
        </Label>
      </div>

      {!adapterImage && (
        <FileUploader
          handleChange={onFileChange}
          name="file"
          types={FILE_TYPES}
        >
          <DragAndDropZone />
        </FileUploader>
      )}
      {adapterImage && (
        <div className="relative">
          <FileUploader
            handleChange={onFileChange}
            name="file"
            types={FILE_TYPES}
          >
            <div className="relative h-[88px] cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/25">
              <img
                src={adapterImage}
                alt="IPAdapter"
                width={512}
                height={512}
                className="aspect-square h-full w-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
          </FileUploader>
          <Button
            className="text-md absolute right-2 top-2 z-10 h-6 w-6 rounded-full font-medium"
            onClick={onDeleteImage}
            icon={faXmark}
            variant="action"
          />

          <Button
            className="text-md absolute bottom-2 left-2 z-10 h-6 w-6 rounded bg-transparent font-medium hover:bg-white/10"
            onClick={() => setIsExpandedDialogOpen(true)}
            icon={faExpand}
            variant="action"
          />
        </div>
      )}

      <Modal
        title="Crop Reference Image"
        titleIcon={faCrop}
        className="max-w-4xl"
        childPadding={true}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setCrop(undefined);
        }}
      >
        <div className="flex flex-col items-center gap-3 overflow-hidden rounded bg-black/25">
          {imageSrc && (
            <ReactCrop
              key={imageSrc}
              crop={crop}
              onChange={(newCrop) => setCrop(newCrop)}
              onComplete={(c) => onCropComplete(c)}
              aspect={1}
              keepSelection={true}
              className="max-h-[600px]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                onLoad={onImageLoad}
                alt="Source"
                className="max-h-full object-contain"
                crossOrigin="anonymous"
              />
            </ReactCrop>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => {
              setIsDialogOpen(false);
              setCrop(undefined);
            }}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button onClick={onSaveCrop} variant="primary">
            Confirm
          </Button>
        </div>
      </Modal>

      <Modal
        title="Reference Image Preview"
        titleIcon={faImage}
        className="max-w-fit"
        childPadding={true}
        isOpen={isExpandedDialogOpen}
        onClose={() => setIsExpandedDialogOpen(false)}
      >
        <div className="flex items-center justify-center">
          {adapterImage && (
            <img
              src={adapterImage}
              alt="Expanded"
              className="max-h-full max-w-full rounded object-contain"
              crossOrigin="anonymous"
            />
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => setIsExpandedDialogOpen(false)}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};
