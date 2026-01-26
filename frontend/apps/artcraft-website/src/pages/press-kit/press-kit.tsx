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

// ============================================================================
// PRESS KIT ASSET DATA - TEMPLATE FOR EASY EDITING
// ============================================================================
//
// To add a new asset, copy one of the existing objects and modify:
// - type: "video" | "image" | "embed" | "link"
// - title: Display title for the asset
// - description: Optional short description
// - thumbnail: URL to thumbnail image (can be YouTube thumbnail or custom)
// - embedUrl: For YouTube embeds (use embed format: youtube.com/embed/VIDEO_ID)
// - downloadUrl: Direct link to the downloadable file (e.g., Cloudflare R2 URL)
// - downloadLabel: Optional custom label for download button (default: "Download")
// - fileSize: Optional file size display (e.g., "1.2 GB")
//
// ============================================================================

interface PressKitAsset {
  type: "video" | "image" | "embed" | "link";
  title: string;
  description?: string;
  thumbnail?: string;
  embedUrl?: string;
  downloadUrl: string;
  downloadLabel?: string;
  fileSize?: string;
  /** If true, thumbnail uses object-contain with padding (good for logos) */
  containThumbnail?: boolean;
}

interface PressKitCategory {
  name: string;
  description?: string;
  assets: PressKitAsset[];
}

// ============================================================================
// EDIT THIS DATA TO ADD PRESS KIT ASSETS
// ============================================================================

const PRESS_KIT_CATEGORIES: PressKitCategory[] = [
  {
    name: "Promotional Videos",
    description: "High-quality promotional videos for press coverage",
    assets: [
      // ArtCraft Commercial / Trailer
      {
        type: "embed",
        title: "ArtCraft Commercial",
        description: "Official ArtCraft commercial showcasing the app",
        thumbnail: "/images/video-thumbnails/artcraft-commercial.png",
        embedUrl: "https://www.youtube.com/embed/H4NFXGMuwpY",
        downloadUrl:
          "https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/artcraft_website_v2.mp4",
        fileSize: "125 MB",
      },
      // Grinch: The Anime
      {
        type: "embed",
        title: "Grinch: The Anime",
        description: "Made using ArtCraft",
        thumbnail: "https://img.youtube.com/vi/oqoCWdOwr2U/maxresdefault.jpg",
        embedUrl: "https://www.youtube.com/embed/oqoCWdOwr2U",
        downloadUrl: "", // Add R2 download link here
      },
    ],
  },
  {
    name: "Logos & Branding",
    description: "Official ArtCraft logos and branding assets",
    assets: [
      // EXAMPLE: Image asset
      {
        type: "image",
        title: "ArtCraft Logo (PNG)",
        thumbnail: "/images/artcraft-logo.png",
        downloadUrl: "/images/artcraft-logo.png",
        containThumbnail: true, // Use contain so logo is fully visible with padding
      },
      // EXAMPLE: Zip bundle
      // {
      //   type: "link",
      //   title: "Full Logo Pack (ZIP)",
      //   description: "All logos in PNG, SVG, and EPS formats",
      //   downloadUrl: "https://your-r2-bucket.r2.dev/artcraft-logo-pack.zip",
      //   fileSize: "12 MB",
      // },
    ],
  },
  {
    name: "Screenshots & Media",
    description: "High-resolution screenshots and promotional images",
    assets: [
      // EXAMPLE: Screenshot image
      // {
      //   type: "image",
      //   title: "Editor Interface",
      //   thumbnail: "/images/screenshot-editor.jpg",
      //   downloadUrl: "https://your-r2-bucket.r2.dev/screenshot-editor-hires.png",
      // },
    ],
  },
  // Add more categories as needed:
  // {
  //   name: "Tutorial Videos",
  //   description: "Step-by-step tutorials",
  //   assets: [],
  // },
];

// ============================================================================
// PRESS KIT PAGE COMPONENT
// ============================================================================

const AssetCard = ({
  asset,
  onOpenEmbed,
}: {
  asset: PressKitAsset;
  onOpenEmbed: (embedUrl: string, title: string) => void;
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
      onOpenEmbed(asset.embedUrl, asset.title);
    }
  };

  return (
    <div className="group relative flex flex-col bg-[#28282C] rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:shadow-primary/5">
      {/* Thumbnail */}
      <div
        className={`relative aspect-video bg-black/40 overflow-hidden ${
          asset.type === "embed" ? "cursor-pointer" : ""
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

        {/* Play button overlay for embeds */}
        {asset.type === "embed" && (
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

const VideoModal = ({
  embedUrl,
  title,
  onClose,
}: {
  embedUrl: string;
  title: string;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`${embedUrl}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
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

export default function PressKitPage() {
  const [activeEmbed, setActiveEmbed] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const handleOpenEmbed = (embedUrl: string, title: string) => {
    setActiveEmbed({ url: embedUrl, title });
  };

  const handleCloseEmbed = () => {
    setActiveEmbed(null);
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
                        onOpenEmbed={handleOpenEmbed}
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
      {activeEmbed && (
        <VideoModal
          embedUrl={activeEmbed.url}
          title={activeEmbed.title}
          onClose={handleCloseEmbed}
        />
      )}
    </div>
  );
}
