// ============================================================================
// PRESS KIT ASSET DATA
// ============================================================================
//
// To add a new asset, copy one of the existing objects and modify:
// - type: "video" | "image" | "embed" | "link"
// - title: Display title for the asset
// - description: Optional short description
// - thumbnail: URL to thumbnail image (can be YouTube thumbnail or custom)
// - embedUrl: For YouTube embeds (use embed format: youtube.com/embed/VIDEO_ID)
// - videoUrl: Direct video URL for type="video" (uses downloadUrl if not provided)
// - downloadUrl: Direct link to the downloadable file (e.g., Cloudflare R2 URL)
// - downloadLabel: Optional custom label for download button (default: "Download")
// - fileSize: Optional file size display (e.g., "1.2 GB")
// - containThumbnail: If true, thumbnail uses object-contain with padding (good for logos)
//
// ============================================================================

export interface PressKitAsset {
  type: "video" | "image" | "embed" | "link";
  title: string;
  description?: string;
  thumbnail?: string;
  embedUrl?: string;
  /** Direct video URL for type="video" - uses downloadUrl if not provided */
  videoUrl?: string;
  downloadUrl: string;
  downloadLabel?: string;
  fileSize?: string;
  /** If true, thumbnail uses object-contain with padding (good for logos) */
  containThumbnail?: boolean;
}

export interface PressKitCategory {
  name: string;
  description?: string;
  assets: PressKitAsset[];
}

// ============================================================================
// EDIT THIS DATA TO ADD PRESS KIT ASSETS
// ============================================================================

export const PRESS_KIT_CATEGORIES: PressKitCategory[] = [
  {
    name: "Promotional Videos",
    description: "High-quality promotional videos for press coverage",
    assets: [
      // ArtCraft Commercial / Trailer (direct video, same as homepage)
      {
        type: "video",
        title: "ArtCraft Commercial",
        description: "Official ArtCraft commercial showcasing the app",
        thumbnail: "/images/video-thumbnails/artcraft-commercial.png",
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
      {
        type: "image",
        title: "ArtCraft Logo (PNG)",
        thumbnail: "/images/artcraft-logo.png",
        downloadUrl: "/images/artcraft-logo.png",
        containThumbnail: true,
      },
      // Add more logo variants here:
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
      // Add screenshots here:
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
