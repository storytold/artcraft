import {
  ArrowRightIcon,
  BoxIcon,
  CircleCheckIcon,
  DownloadIcon,
  ImageIcon,
  MonitorIcon,
  VideoIcon,
  WandSparklesIcon,
} from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { Button } from "@storyteller/ui-button";
import { Link } from "react-router-dom";
import { isMobile, isMacOs } from "react-device-detect";
import { DOWNLOAD_LINKS } from "../../config/github_download_links";
import Seo from "../../components/seo";
import { PricingTable } from "@storyteller/ui-pricing-table";

const Welcome = () => {
  const downloadUrl = isMacOs ? DOWNLOAD_LINKS.MACOS : DOWNLOAD_LINKS.WINDOWS;

  return (
    <div className="relative min-h-full bg-ui-background text-white">
      <Seo
        title="Welcome - ArtCraft"
        description="Welcome to ArtCraft. Get started with your subscription."
      />

      <main className="relative z-10 pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/15 px-6 py-3 mb-6">
            <CircleCheckIcon className="text-xl text-green-400" />
            <span className="text-white font-medium">
              Account created successfully!
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium mb-4 tracking-tight">
            Welcome to <span className="text-primary">ArtCraft</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto px-2.5">
            Support open-source development and unlock premium AI art features.
            <br className="hidden sm:block" />
            Your subscription keeps ArtCraft free for everyone.
          </p>
        </div>

        {/* Pricing Table */}
        <div className="mb-16">
          <PricingTable
            showHeader={false}
            compact={true}
            className="max-w-5xl mx-auto"
          />
        </div>

        {/* Create-in-browser CTA — desktop download is optional */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-[#101014] border border-white/15 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <WandSparklesIcon className="text-white/70 text-lg" />
              </div>
              <h2 className="text-2xl font-medium text-white">
                Start creating right here
              </h2>
            </div>
            <p className="text-white/60 mb-6">
              No download needed - jump straight in from your browser.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: "/create-image", icon: ImageIcon, label: "Image" },
                { to: "/create-video", icon: VideoIcon, label: "Video" },
                {
                  to: "/background-change",
                  icon: WandSparklesIcon,
                  label: "BG Change",
                },
                { to: "/edit-3d", icon: BoxIcon, label: "Edit 3D" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-3 rounded-[3px] bg-ui-controls hover:bg-white/10 border border-white/15 hover:border-white/30 px-4 py-3 transition-all"
                >
                  <DynamicIcon
                    icon={item.icon}
                    className="text-white/70 text-base shrink-0"
                  />
                  <span className="text-white/90 font-medium flex-1">
                    {item.label}
                  </span>
                  <ArrowRightIcon className="text-white/30 text-[11px] transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop app alternative */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#101014] border border-white/15 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <MonitorIcon className="text-white/70 text-lg" />
              </div>
              <h2 className="text-2xl font-medium text-white">
                Want the desktop app too?
              </h2>
            </div>

            <p className="text-white/60 mb-6">
              Install ArtCraft on Windows or Mac to unlock the full creative
              suite. After installing:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { step: 1, text: "Open the installer" },
                { step: 2, text: "Follow setup instructions" },
                { step: 3, text: "Log in to your account" },
                { step: 4, text: "Start creating!" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-ui-controls border border-white/15 p-4 flex items-center gap-4"
                >
                  <div className="w-8 h-8 shrink-0 bg-white/10 border border-white/15 flex items-center justify-center font-mono text-[11px] font-semibold text-white">
                    {item.step}
                  </div>
                  <div className="text-white/90 font-medium">{item.text}</div>
                </div>
              ))}
            </div>

            {/* Download Contingency */}
            {!isMobile && (
              <div className="pt-6 border-t border-white/15">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-white/50 text-sm">
                    Download didn't start?
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      as="link"
                      href={downloadUrl}
                      className="bg-white text-black hover:bg-white/80 px-6 py-2.5"
                    >
                      <DownloadIcon className="mr-2" />
                      Download for {isMacOs ? "Mac" : "Windows"}
                    </Button>
                    <div className="flex gap-4 text-sm font-medium text-white/30">
                      <a
                        href={DOWNLOAD_LINKS.WINDOWS}
                        className="hover:text-white transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-current"></span>
                        Windows
                      </a>
                      <a
                        href={DOWNLOAD_LINKS.MACOS}
                        className="hover:text-white transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-current"></span>
                        Mac
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isMobile && (
              <div className="bg-[#431407] border border-orange-900/50 p-6 text-orange-200 text-sm leading-relaxed">
                <div className="flex items-center justify-center mb-3 text-orange-400">
                  <MonitorIcon className="text-2xl" />
                </div>
                ArtCraft is a powerful desktop experience. <br />
                Please head to your computer to download and install.
              </div>
            )}
          </div>

          {/* Footer Link */}
          <div className="text-center mt-8">
            <Link
              to="/"
              className="text-white/40 hover:text-white text-sm font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Welcome;
