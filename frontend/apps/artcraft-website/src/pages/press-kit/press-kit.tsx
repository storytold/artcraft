import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faPlay,
  faImage,
  faVideo,
  faFileZipper,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import Footer from "../../components/footer";
import Seo from "../../components/seo";
import { PRESS_KIT_CATEGORIES, type PressKitAsset } from "./press-kit-data";

// ============================================================================
// ASSET CARD COMPONENT
// ============================================================================

const AssetCard = ({
  asset,
  onOpenMedia,
}: {
  asset: PressKitAsset;
  onOpenMedia: (asset: PressKitAsset) => void;
}) => {
  const getTypeIcon = () => {
    switch (asset.type) {
      case "video":
      case "embed":
        return faVideo;
      case "image":
        return faImage;
      case "link":
        return faFileZipper;
      default:
        return faImage;
    }
  };

  const handleThumbnailClick = () => {
    if (asset.type === "embed" && asset.embedUrl) {
      onOpenMedia(asset);
    } else if (asset.type === "video") {
      onOpenMedia(asset);
    }
  };

  return (
    <div className="group relative flex flex-col bg-[#28282C] rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:shadow-primary/5">
      {/* Thumbnail */}
      <div
        className={`relative aspect-video bg-black/40 overflow-hidden ${
          asset.type === "embed" || asset.type === "video"
            ? "cursor-pointer"
            : ""
        }`}
        onClick={handleThumbnailClick}
      >
        {asset.thumbnail ? (
          <img
            src={asset.thumbnail}
            alt={asset.title}
            className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
              asset.containThumbnail
                ? "object-contain p-6 bg-[#1a1a1e]"
                : "object-cover"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <FontAwesomeIcon
              icon={getTypeIcon()}
              className="text-4xl text-white/30"
            />
          </div>
        )}

        {/* Play button overlay for videos and embeds */}
        {(asset.type === "embed" || asset.type === "video") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 group-hover:bg-black/40">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform duration-300 group-hover:scale-110">
              <FontAwesomeIcon
                icon={faPlay}
                className="text-white text-xl ml-1"
              />
            </div>
          </div>
        )}

        {/* Type badge - show "Video" for both video and embed types */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium text-white/80 flex items-center gap-1.5">
          <FontAwesomeIcon icon={getTypeIcon()} className="text-[10px]" />
          <span className="capitalize">
            {asset.type === "embed" ? "Video" : asset.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
          {asset.title}
        </h3>
        {asset.description && (
          <p className="text-sm text-white/60 mb-4 line-clamp-2">
            {asset.description}
          </p>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Download button */}
        {asset.downloadUrl ? (
          <a
            href={asset.downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full mt-3 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-medium text-sm transition-all duration-200"
          >
            <FontAwesomeIcon icon={faArrowDownToLine} />
            <span>{asset.downloadLabel || "Download"}</span>
            {asset.fileSize && (
              <span className="text-black/50 ml-1">({asset.fileSize})</span>
            )}
          </a>
        ) : (
          <div className="inline-flex items-center justify-center gap-2 w-full mt-3 px-4 py-2.5 rounded-xl bg-white/10 text-white/40 font-medium text-sm cursor-not-allowed">
            <FontAwesomeIcon icon={faArrowDownToLine} />
            <span>Download Coming Soon</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// VIDEO MODAL COMPONENT
// ============================================================================

const VideoModal = ({
  asset,
  onClose,
}: {
  asset: PressKitAsset;
  onClose: () => void;
}) => {
  const isEmbed = asset.type === "embed" && asset.embedUrl;
  const videoSrc = asset.videoUrl || asset.downloadUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isEmbed ? (
          <iframe
            src={`${asset.embedUrl}?autoplay=1`}
            title={asset.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <video
            src={videoSrc}
            className="w-full h-full"
            controls
            autoPlay
            playsInline
          />
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
          aria-label="Close video"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PRESS KIT PAGE
// ============================================================================

export default function PressKitPage() {
  const [activeMedia, setActiveMedia] = useState<PressKitAsset | null>(null);

  const handleOpenMedia = (asset: PressKitAsset) => {
    setActiveMedia(asset);
  };

  const handleCloseMedia = () => {
    setActiveMedia(null);
  };

  // Filter out empty categories
  const categoriesWithAssets = PRESS_KIT_CATEGORIES.filter(
    (cat) => cat.assets.length > 0,
  );

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-x-hidden bg-dots">
      <Seo
        title="Press Kit | ArtCraft"
        description="Download ArtCraft press assets including logos, promotional videos, screenshots, and branding materials for media coverage."
      />

      {/* Hero Section */}
      <main className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Glowing Gradient Orb Background */}
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-0 overflow-hidden">
          <div className="w-[800px] h-[600px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-20 blur-[100px] md:blur-[150px] transform-gpu -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Press Kit
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Everything you need for press coverage, reviews, and content
              creation. Download high-quality assets and promotional materials.
            </p>
          </div>

          {/* Categories */}
          {categoriesWithAssets.length > 0 ? (
            <div className="space-y-16">
              {categoriesWithAssets.map((category) => (
                <section key={category.name}>
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-white/60">{category.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.assets.map((asset, index) => (
                      <AssetCard
                        key={`${category.name}-${index}`}
                        asset={asset}
                        onOpenMedia={handleOpenMedia}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faFileZipper}
                  className="text-3xl text-white/30"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Press Kit Coming Soon
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                We're preparing our press assets. Check back soon for logos,
                videos, and promotional materials.
              </p>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-20 text-center py-12 px-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Need Something Specific?
            </h2>
            <p className="text-white/70 mb-6 max-w-lg mx-auto">
              For specific press inquiries, interview requests, or custom
              assets, reach out to us on Discord.
            </p>
            <a
              href="https://discord.gg/artcraft"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              Contact Us on Discord
            </a>
          </div>
        </div>
      </main>

      <Footer />

      {/* Video Modal */}
      {activeMedia && (
        <VideoModal asset={activeMedia} onClose={handleCloseMedia} />
      )}
    </div>
  );
}
