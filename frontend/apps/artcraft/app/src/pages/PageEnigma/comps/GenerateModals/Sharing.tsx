import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { MediaFile } from "~/pages/PageEnigma/models";
import { Input } from "@storyteller/ui-input";
import { Label } from "@storyteller/ui-label";
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  faArrowDownToLine,
  faArrowRight,
  faChevronLeft,
  faFilm,
  faLink,
} from "@fortawesome/pro-solid-svg-icons";
import SocialButton from "./SocialButton";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";
import dayjs from "dayjs";
import { downloadFile } from "~/pages/PageEnigma/comps/GenerateModals/utils/downloadFile";
import { GetCdnOrigin } from "~/api/GetCdnOrigin";

interface Props {
  mediaFile: MediaFile;
  setMediaFile: (file: MediaFile | null) => void;
}

export function Sharing({ mediaFile, setMediaFile }: Props) {
  const { generateMovieId, viewMyMovies, setViewMyMovies } = usePageEnigmaStore(
    useShallow((s) => ({
      generateMovieId: s.generateMovieId,
      viewMyMovies: s.viewMyMovies,
      setViewMyMovies: s.setViewMyMovies,
    })),
  );

  const mediaTitle = mediaFile?.maybe_title ?? mediaFile?.token;
  // TODO: ApiManager should provide all endpoints
  const shareUrl = `https://storyteller.ai/media/${mediaFile?.token || ""}`;
  const shareText = "Check out this media on StoryTeller.ai";
  const [buttonLabel, setButtonLabel] = useState("Copy");
  const media_api_base_url = GetCdnOrigin();
  const downloadLink = `${media_api_base_url}${mediaFile?.public_bucket_path}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    setButtonLabel("Copied!");
    setTimeout(() => setButtonLabel("Copy"), 2000);
  };

  const generateTitle = () => {
    return (
      <div className="flex items-center gap-2.5">
        <span className="font-xl font-bold">{mediaTitle}</span>
        <span className="text-sm font-medium text-white/60">
          {dayjs(mediaFile?.updated_at).format("MMM DD, YYYY HH:mm:ss")}
        </span>
      </div>
    );
  };

  return (
    <Modal
      title={generateTitle()}
      titleIcon={generateMovieId ? faChevronLeft : faFilm}
      titleIconClassName="text-white/60 hover:text-white/80 transition-colors duration-150"
      onTitleIconClick={
        generateMovieId ? () => setMediaFile(null) : undefined
      }
      className="max-w-6xl"
      childPadding={false}
      isOpen={viewMyMovies}
      width={1049}
      onClose={() => {
        setViewMyMovies(false);
        setMediaFile(null);
      }}
    >
      <div className="flex gap-6 px-5 pb-5">
        <div className="max-h-[420px] w-full overflow-hidden rounded-lg">
          <video controls crossOrigin="anonymous" className="h-full w-full">
            <source src={downloadLink} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="flex w-[500px] flex-col">
          <Label>Share movie to:</Label>
          <div className="flex w-full flex-wrap justify-between">
            <SocialButton
              social="x"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="whatsapp"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="facebook"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="reddit"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="email"
              shareUrl={shareUrl}
              shareText={shareText}
            />
          </div>
          <div className="my-6 flex w-full gap-2">
            <div className="w-full">
              <Input type="text" value={shareUrl} readOnly />
            </div>

            <Button icon={faLink} onClick={handleCopyLink} variant="primary">
              {buttonLabel}
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              icon={faArrowDownToLine}
              className="h-10 w-full"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                downloadFile({
                  url: downloadLink,
                  title: mediaTitle,
                });
              }}
              variant="secondary"
            >
              Download
            </Button>
            <Button
              className="h-10 w-full"
              onClick={() => {
                window.open(shareUrl, "_blank");
              }}
              icon={faArrowRight}
              iconFlip={true}
              variant="secondary"
            >
              View on Media Page
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
