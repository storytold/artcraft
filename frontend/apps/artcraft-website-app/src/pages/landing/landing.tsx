import { Button } from "@storyteller/ui-button";
import { DownloadButton } from "../../components/download-button";
import { faArrowDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { SOCIAL_LINKS } from "../../config/links";

const Landing = () => {
  const videos = [
    {
      src: "https://www.youtube.com/embed/H4NFXGMuwpY?si=U2_m5Ic1YBn6176D",
    },
    {
      src: "https://www.youtube.com/embed/pGn-1BKo3nY?si=q4dm0ICb6wF1JW8N",
    },
    {
      src: "https://www.youtube.com/embed/7x7IZkHiGD8?si=tL8nK4CULigpfHQR",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      {/* Hero Section */}
      <div className="relative flex overflow-hidden xl:items-center xl:pt-0">
        <div className="w-full flex flex-col items-center justify-center text-center pt-40 pb-20 px-10">
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg blur-xl"></div>
            <h1 className="relative mb-10 font-bold text-5xl lg:text-7xl">
              AI Canvas & Scene Editor
              <br />
              <span>On your </span>
              <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[9px] after:bg-primary/60 after:mb-1.5">
                local machine
              </span>
              <span>.</span>
            </h1>
          </div>

          <p className="mb-12 max-w-2xl text-lg lg:text-xl leading-relaxed text-gray-300">
            Create stunning artwork with the power of AI. Perfect for artists,
            designers, and creators who want to push the boundaries of their
            creativity.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <DownloadButton />
            <Button
              icon={faDiscord}
              className="rounded-xl px-8 py-4 text-md border-2 border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
              as="link"
              href={SOCIAL_LINKS.DISCORD}
              target="_blank"
            >
              Join Discord
            </Button>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse-slow" />
        </div>
      </div>

      {/* Video Sections */}
      <div className="relative z-10 mx-auto max-w-[1920px] px-4 py-20 md:px-16 lg:px-12 xl:px-32">
        {/* First Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-16 mb-32 p-5 lg:pr-16 bg-white/10 backdrop-blur-md lg:rounded-[80px] rounded-[40px]">
          <div className="lg:col-span-3 rounded-[30px] lg:rounded-[60px] overflow-hidden bg-[#1C1C20]">
            <video
              muted
              autoPlay
              loop
              className="w-full aspect-[4/3] object-cover"
            >
              <source src="/videos/artcraft-canvas-demo.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="lg:col-span-2 space-y-9">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight">
                Draw it, Dream it, AI it
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Draw freely, arrange images, and create collages on our
                intuitive 2D canvas. Once your composition is ready, use AI to
                generate a polished artwork that matches your exact layout and
                vision. Perfect for sketching ideas and turning them into
                stunning finished pieces.
              </p>
            </div>
            <Button
              icon={faArrowDownToLine}
              className="rounded-lg px-5 py-3.5 text-md bg-[#2D81FF] hover:bg-[#438AF6]"
              as="link"
              href="/download"
            >
              Download App
            </Button>
          </div>
        </div>

        {/* Second Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-16 p-5 lg:pl-16 bg-white/10 backdrop-blur-md lg:rounded-[80px] rounded-[40px]">
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-9">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight">
                Compose in 3D, Bring your ideas to life
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Compose your perfect 3D scene by arranging elements and
                positioning your camera. Our AI understands your scene layout
                and generates consistent, high-quality 3D artwork that matches
                your composition, including maintaining character consistency
                throughout your scenes.
              </p>
            </div>
            <Button
              icon={faArrowDownToLine}
              className="rounded-lg px-5 py-3.5 text-md bg-[#2D81FF] hover:bg-[#438AF6]"
              as="link"
              href="/download"
            >
              Download App
            </Button>
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2 rounded-[30px] lg:rounded-[60px] overflow-hidden bg-[#1C1C20]">
            <video
              muted
              autoPlay
              loop
              className="w-full aspect-[4/3] object-cover"
            >
              <source src="/videos/artcraft-3d-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1920px] px-4 py-24 sm:px-24 lg:px-32">
        {/* Videos Section */}
        <div className="space-y-12">
          <div className="text-center">
            <h1 className="mb-4 text-5xl font-bold">
              Made using{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[6px] after:bg-primary/60 after:mb-1">
                ArtCraft
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              See examples of artwork created using ArtCraft.
            </p>
          </div>
          <div className="grid gap-8 xl:grid-cols-3">
            {videos.map((video, index) => (
              <div
                key={index}
                className="group relative rounded-2xl bg-white/10 backdrop-blur-md p-1.5 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
              >
                <div className="aspect-video overflow-hidden rounded-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={video.src}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1920px] px-4 pt-20 pb-40 sm:px-24 lg:px-32">
        {/* Discord CTA Section */}
        <div className="flex flex-col items-center justify-center text-center p-12 py-20 rounded-[40px] bg-primary/10 backdrop-blur-md border-[6px] border-primary/30">
          <h2 className="text-5xl font-bold mb-6">Join Our Community</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl">
            Connect with other creators, share your work, get feedback, and stay
            updated with the latest features and updates.
          </p>
          <Button
            icon={faDiscord}
            className="rounded-xl px-8 py-4 text-md bg-[#5865F2] hover:bg-[#6a76ff] transition-all duration-300 backdrop-blur-md"
            as="link"
            href={SOCIAL_LINKS.DISCORD}
            target="_blank"
          >
            Join Discord
          </Button>
        </div>
      </div>

      <div></div>
    </div>
  );
};

export default Landing;
