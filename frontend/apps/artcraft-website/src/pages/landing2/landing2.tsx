import { DiscordButton } from "../../components/discord-button";
import { motion } from "framer-motion";
import { Button } from "@storyteller/ui-button";
import { isMobile } from "react-device-detect";
import { faWindows, faApple } from "@fortawesome/free-brands-svg-icons";
import { faVolumeMute, faVolumeHigh } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Footer from "../../components/footer";
import { useState, useRef, useEffect } from "react";

//const MAC_LINK = "https://pub-3b58c874772a4e04b9c291815224128c.r2.dev/mac/ArtCraft_0.0.1_universal_2025.06.04.dmg";
const MAC_LINK = "https://pub-3b58c874772a4e04b9c291815224128c.r2.dev/mac/ArtCraft_0.0.1_universal_2025.07.13.dmg";

//const WINDOWS_LINK = "https://pub-3b58c874772a4e04b9c291815224128c.r2.dev/windows/ArtCraft_0.0.1_x64-setup_2025.06.04.exe";
const WINDOWS_LINK = "https://pub-3b58c874772a4e04b9c291815224128c.r2.dev/windows/ArtCraft_0.0.1_x64-setup_2025.07.13.exe";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

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

  const [isMuted, setIsMuted] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = 0.14;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      {/* Hero Section */}
      <main className="relative mb-8 md:mb-12 pt-24 sm:pt-24 min-h-[400px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center px-2 sm:px-4 md:px-0">
        {/* Glowing Gradient Orb Background */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
        >
          <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-40 blur-[120px]"></div>
        </motion.div>

        <div className="relative z-10 px-2 sm:px-4 md:px-6 py-8 w-full flex flex-col items-center justify-center">
          <div className="max-w-full md:max-w-[1200px] mx-auto text-center flex flex-col items-center">
            {/* Main Heading */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-4 sm:mb-6 drop-shadow-[0_4px_32px_rgba(80,80,255,0.25)]"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              <span className="text-white">
                Controllable AI
                <br />
                for Artists
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-xl md:text-2xl lg:text-2xl text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_12px_rgba(80,80,255,0.10)]"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              Text prompting sucks. Bring your true vision to life with 
              unparalleled control and precision.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-4 mb-10 sm:mb-16 w-full max-w-xs sm:max-w-none mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              {isMobile ? (
                <Button
                  className="text-lg font-semibold rounded-xl shadow-lg"
                  disabled
                >
                  Download on a desktop
                </Button>
              ) : (
                <>
                  <Button
                    className="text-md px-4 py-3 font-semibold rounded-xl shadow-lg gap-3"
                    as="link"
                    href={WINDOWS_LINK}
                  >
                    <FontAwesomeIcon icon={faWindows} />
                    Download Windows
                  </Button>
                  <Button
                    className="text-md px-4 py-3 font-semibold rounded-xl shadow-lg gap-3"
                    as="link"
                    href={MAC_LINK}
                  >
                    <FontAwesomeIcon icon={faApple} />
                    Download Mac
                  </Button>
                </>
              )}
            </motion.div>

            {/* Glassy Video Mockup */}
            <motion.div
              className="relative mx-auto mt-4 w-full max-w-full"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              <div
                className="relative rounded-[20px] sm:rounded-[32px] overflow-hidden bg-white/10 backdrop-blur-xl shadow-2xl p-2 sm:p-4 aspect-[16/9] w-full max-w-full md:max-w-[1200px] mx-auto transition-transform duration-300"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                  src="https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/artcraft_commercial.mp4"
                >
                  <source
                    src="https://pub-f7441936e5804042a1ea2bdc92e4dc71.r2.dev/artcraft_commercial.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
                <button
                  onClick={toggleMute}
                  className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 bg-black bg-opacity-40 rounded-full w-10 h-10 md:w-12 md:h-12 text-white transition-opacity duration-200 hover:bg-opacity-80 text-md md:text-xl
                              ${
                                isMuted
                                  ? "opacity-100"
                                  : isHovering
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  <FontAwesomeIcon
                    icon={isMuted ? faVolumeMute : faVolumeHigh}
                  />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <div className="relative flex overflow-visible xl:items-center xl:pt-0 mb-4 md:mb-12 px-2 sm:px-4 md:px-0">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-200px] top-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-15 blur-[120px] z-0 pointer-events-none" />
        <motion.div
          className="w-full flex flex-col items-center justify-center text-center pt-16 sm:pt-24 md:pt-32 px-2 sm:px-6 md:px-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <motion.div className="relative" variants={fadeUpVariants}>
            <h1 className="relative mb-4 sm:mb-6 md:mb-10 font-bold text-3xl sm:text-4xl md:text-[3rem] lg:text-[4rem] xl:text-[5rem] !leading-none text-shadow-lg">
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                “
              </span>
              Is this really AI?
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                ”
              </span>
            </h1>
            <span className="absolute -right-6 sm:-right-5 -bottom-1 sm:bottom-4 md:-right-16 md:bottom-10 text-lg sm:text-xl md:text-3xl font-bold opacity-40 italic hover:opacity-80 transition-opacity duration-300">
              — You
            </span>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-2 sm:px-4 md:px-16 lg:px-12 xl:px-32 pb-8 sm:pb-16 md:pb-24 lg:pb-32 overflow-visible px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute right-[-250px] top-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-700 via-[#00AABA] to-pink-500 opacity-[0.1] blur-[140px] z-0 pointer-events-none" />
        <motion.div
          className="items-center gap-8 sm:gap-12 md:gap-16 mb-8 sm:mb-12 p-2 sm:p-4 bg-white/10 backdrop-blur-md rounded-[24px] sm:rounded-[40px] shadow-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="rounded-[16px] sm:rounded-[24px] overflow-hidden bg-[#1C1C20] shadow-inner">
            <video
              muted
              autoPlay
              loop
              playsInline
              className="w-full aspect-[16/9] object-cover"
            >
              <source src="/videos/hero-video.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>
        <motion.div
          className="flex justify-center"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <DiscordButton />
        </motion.div>
      </div>

      <div className="overflow-visible py-10 sm:py-20 md:py-28 lg:py-32 relative px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-150px] bottom-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-10 blur-[110px] z-0 pointer-events-none" />
        <motion.div
          className="mx-auto max-w-[88rem] md:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="grid grid-cols-1 gap-10 sm:gap-20 lg:grid-cols-2 lg:items-center">
            <motion.div
              className="px-2 sm:px-6 lg:px-0 lg:pt-4 lg:pr-4"
              variants={fadeUpVariants}
            >
              <div className="max-w-2xl lg:mx-0 mb-10 md:mb-16">
                <h2 className="relative font-bold text-4xl md:text-5xl lg:text-6xl !leading-tight">
                  Our tool lets you design, control, and achieve{" "}
                  <span className="text-primary">perfect consistency</span>
                </h2>
              </div>
              <DiscordButton />
            </motion.div>
            <div className="sm:px-2 sm:mx-auto lg:px-0">
              <div className="relative isolate overflow-hidden bg-indigo-500 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pr-0 lg:mx-0 lg:max-w-none">
                <div className="mx-auto max-w-full sm:max-w-2xl sm:mx-0 sm:max-w-none p-2 sm:p-4 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                  <video
                    src="/videos/artcraft-3d-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-square w-full max-w-none rounded-lg bg-gray-800 object-cover h-full overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="overflow-visible py-10 sm:py-20 md:py-28 lg:py-32 relative px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute right-[-200px] top-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-700 via-[#00AABA] to-pink-500 opacity-10 blur-[120px] z-0 pointer-events-none" />
        <motion.div
          className="mx-auto max-w-[88rem] md:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="grid grid-cols-1 gap-10 sm:gap-20 lg:grid-cols-2 lg:items-center">
            <div className="sm:px-2 sm:mx-auto lg:px-0 order-2 lg:order-1">
              <motion.div
                className="relative isolate overflow-hidden bg-indigo-500 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pr-0 lg:mx-0 lg:max-w-none"
                variants={fadeUpVariants}
              >
                <div className="mx-auto max-w-full sm:max-w-2xl sm:mx-0 sm:max-w-none p-2 sm:p-4 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                  <video
                    src="/videos/artcraft-canvas-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-square w-full max-w-none rounded-lg bg-gray-800 object-cover h-full overflow-hidden"
                  />
                </div>
              </motion.div>
            </div>
            <motion.div
              className="px-2 sm:px-6 lg:px-0 lg:pt-4 lg:pr-4 order-1 lg:order-2"
              variants={fadeUpVariants}
            >
              <div className=" max-w-2xl lg:mx-0 mb-10 md:mb-16">
                <h2 className="relative font-bold text-4xl md:text-5xl lg:text-6xl xl:text-[3.8rem] !leading-tight">
                  <span className="text-primary">Patented</span> Brain to Art
                  Interface lets you Sketch and Composite 
                </h2>
              </div>
              <DiscordButton />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen px-2 sm:px-4 py-10 sm:py-20 md:py-32 sm:px-8 lg:px-32 overflow-visible px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-250px] top-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-[0.07] blur-[150px] z-0 pointer-events-none" />
        {/* Videos Section */}
        <motion.div
          className="space-y-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="text-center">
            <h1 className="md:mb-8 text-2xl sm:text-4xl md:text-6xl font-bold">
              Made using{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[5px] md:after:h-[12px] after:bg-primary/60 after:mb-1">
                ArtCraft
              </span>
            </h1>
          </div>
          <div className="grid gap-6 sm:gap-8 xl:grid-cols-3">
            {videos.map((video, index) => (
              <motion.div
                key={index}
                className="group relative rounded-2xl bg-white/10 backdrop-blur-md p-2 sm:p-4 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
                variants={fadeUpVariants}
              >
                <div className="aspect-video overflow-hidden rounded-xl shadow-lg w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    src={video.src}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02] w-full h-full min-h-[180px]"
                    style={{ minHeight: "180px" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-2 sm:px-4 pt-10 sm:pt-20 md:pt-32 pb-12 sm:pb-24 md:pb-40 lg:pb-56 sm:px-8 lg:px-32 overflow-visible px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute right-[-300px] bottom-[-100px] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-700 via-[#00AABA] to-pink-500 opacity-10 blur-[160px] z-0 pointer-events-none" />
        {/* Discord CTA Section */}
        <motion.div
          className="flex flex-col items-center justify-center text-center p-4 sm:p-8 md:p-24 py-10 sm:py-20 rounded-[24px] sm:rounded-[40px] bg-gradient-to-br from-primary/30 to-primary/50 backdrop-blur-lg border-[3px] sm:border-[6px] border-primary/70 shadow-2xl shadow-primary/30"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <h2 className="relative mb-4 sm:mb-8 font-bold text-2xl sm:text-4xl lg:text-5xl max-w-3xl !leading-tight">
            Why haven't you joined our Discord yet?
          </h2>
          <p className="text-base sm:text-lg text-gray-200 mb-6 sm:mb-10 max-w-2xl leading-relaxed">
            Connect with other creators, share your work, get feedback, and stay
            updated with the latest features and updates.
          </p>
          <DiscordButton />
        </motion.div>
      </div>

      <div className="pb-8 sm:pb-12"></div>

      <Footer />
    </div>
  );
};

export default Landing;
