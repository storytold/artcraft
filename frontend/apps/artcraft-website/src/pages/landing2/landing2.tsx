import { DiscordButton } from "../../components/discord-button";
import { motion } from "framer-motion";
import { Button } from "@storyteller/ui-button";
import { isMobile } from "react-device-detect";
import { faWindows, faApple } from "@fortawesome/free-brands-svg-icons";
import {
  faVolumeMute,
  faVolumeHigh,
  faFilm,
  faPaintBrush,
  faCamera,
  faMapMarkerAlt,
  faCube,
  faLayerGroup,
  faUser,
  faTools,
  faShapes,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Footer from "../../components/footer";
import { useState, useRef, useEffect } from "react";
import ModelBadgeGrid from "../../components/model-badge-grid";
import Seo from "../../components/seo";
import { DOWNLOAD_LINKS } from "../../config/downloads";

// Versions and links are now centralized in downloads config - BFlat
const MAC_LINK = DOWNLOAD_LINKS.MACOS;
const WINDOWS_LINK = DOWNLOAD_LINKS.WINDOWS;

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: "easeOut" as const,
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
  const [activeFeature, setActiveFeature] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const features = [
    {
      icon: faMapMarkerAlt,
      title: "Image to Location",
      description: "Placing virtual actors into physical environments establishes single-location consistency. You can film multiple shots within a room without having things disappear.",
      src: "https://github.com/user-attachments/assets/21f103e3-cc19-4882-a630-9caa1b76ae31"
    },
    {
      icon: faCube,
      title: "3D Image Compositing",
      description: "Use images (backdrops, foreground elements, props, etc.) in scenes with depth and blend them naturally together. Just a couple of images usually leads to great compositions.",
      src: "https://github.com/user-attachments/assets/f93a616f-571d-474e-bcc0-53736de7303d"
    },
    {
      icon: faLayerGroup,
      title: "2D Image Compositing",
      description: "Use images, background removal, layers, and simple drawing tools to precisely compose a scene.",
      src: "https://github.com/user-attachments/assets/d6f99391-e496-4c62-9e37-29734ba5f899"
    },
    {
      icon: faShapes,
      title: "Image to 3D Mesh",
      description: "It's almost impossible to lay out complicated objects or block complicated scenes; turning images into 3D helps position elements exactingly and intentionally.",
      src: "https://github.com/user-attachments/assets/600a405c-e360-48c1-9b42-6e657ae6243b"
    },
    {
      icon: faTools,
      title: "Mixed Asset Crafting",
      description: "You can use image cutouts, worlds, and simple 3D meshes all together to precisely and intentionally lay out your scenes.",
      src: "https://raw.githubusercontent.com/storytold/github-media/main/ship-editing.gif"
    },
    {
      icon: faUser,
      title: "Character Posing",
      description: "You can dynamically pose your characters to achieve the precise character, scene, and camera blocking before calling \"action\".",
      src: "https://github.com/user-attachments/assets/52a8e983-7c8f-42d2-be8b-25296ab9ed57"
    }
  ];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = 0.1;
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden bg-dots">
      <Seo
        title="ArtCraft. AI Video and Images. Fast and Open Desktop App."
        description="ArtCraft is an Open Desktop app for generating AI Video and Images. You own ArtCraft!"
      />
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
          <div className="w-full max-w-[1200px] mx-auto text-center flex flex-col items-center">
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
                for{" "}
                <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[6px] md:after:h-[11px] after:bg-primary/80 after:mb-0 after:xl:mb-2">
                  Artists
                </span>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base mt-4 sm:text-xl md:text-2xl lg:text-2xl text-white/70 mb-8 sm:mb-14 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_12px_rgba(80,80,255,0.10)]"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              Text prompting sucks. Bring your true vision to life with
              unparalleled control and precision.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="relative flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-4 mb-10 sm:mb-16 w-fit max-w-xs sm:max-w-none mx-auto"
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
              <img src="/images/try-free.png" alt="Try Free" draggable={false} className="absolute -left-[45%] -top-5 h-40 pointer-events-none select-none hidden md:block" />
            </motion.div>

            {/* Glassy Video Mockup */}
            <motion.div
              className="relative mx-auto mt-4 w-full max-w-[1200px]"
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
            >
              <div
                className="relative rounded-[20px] sm:rounded-[32px] overflow-hidden bg-white/10 backdrop-blur-xl shadow-2xl p-2 sm:p-4 aspect-[16/9] w-full mx-auto transition-transform duration-300"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover rounded-2xl bg-white"
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
            <h1 className="relative mb-4 sm:mb-6 md:mb-10 font-bold text-3xl sm:text-4xl md:text-[3rem] lg:text-[4rem] xl:text-[4.5rem] !leading-tight text-shadow-lg">
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                Five Reasons{" "}
              </span>
              Why
              <br />
              ArtCraft is the
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                {" "}
                Best Tool
              </span>
            </h1>
          </motion.div>
        </motion.div>
      </div>

      {/* Bento Box Grid Section */}
      <div className="overflow-visible pb-10 sm:pb-20 md:pb-28 lg:pb-32 relative px-4">
        {/* Gradient Orbs for Section */}
        <div className="absolute right-[-150px] top-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-10 blur-[110px] z-0 pointer-events-none" />
        {/* <div className="absolute right-[-200px] bottom-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-700 via-[#00AABA] to-pink-500 opacity-8 blur-[120px] z-0 pointer-events-none" /> */}

        <motion.div
          className="mx-auto max-w-[88rem] md:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          {/* Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 sm:gap-8">
            {/* Reason #1 - Large Box */}
            <motion.div
              className="xl:col-span-6 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300 group"
              variants={fadeUpVariants}
            >
              <div className="flex xl:flex-col gap-4 lg:gap-8 h-full flex-col-reverse">
                <div className="grow h-40">
                  <img
                    src="/images/2d-3d.png"
                    alt="2D and 3D"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                      Text Prompting Sucks
                    </h3>
                    <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                      <span className="text-primary-400 font-semibold">
                        Create images and videos with our easy-to-use AI tool.
                      </span>{" "}
                      Draw on a canvas or work in a 3D space as if you're
                      playing a video game.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Reason #2 - Medium Box */}
            <motion.div
              className="xl:col-span-6 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 pb-0 lg:pb-0 shadow-2xl transition-all duration-300 group"
              variants={fadeUpVariants}
            >
              <div className="relative flex flex-col h-full">
                <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight ">
                  Desktop App
                </h3>
                <p className="text-white/80 text-sm sm:text-base mb-4 sm:mb-6 lg:text-lg leading-relaxed">
                  <span className="text-primary-400 font-semibold">
                    No more hunting for the hundredth tab.
                  </span>{" "}
                  Works on Windows, Mac, and soon Linux and Tablets. First class
                  experience for real artists.
                </p>
                <div className="h-20 md:h-24 lg:h-36 xl:h-36 bg-white/[3%] border-[5px] border-white/[2%] rounded-t-2xl relative mt-12 lg:mt-16 xl:mt-24 select-none">
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-9 items-center justify-center drop-shadow-2xl z-20 scale-50 lg:scale-75 xl:scale-100">
                    <img
                      src="/images/windows-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      className="h-32 rotate-6"
                    />
                    <img
                      src="/images/apple-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      className="h-36 -rotate-6"
                    />
                    <img
                      src="/images/linux-logo.png"
                      alt="Windows Logo"
                      draggable={false}
                      className="h-36 rotate-6"
                    />
                  </div>
                </div>
                <div className="absolute left-0 bottom-0 w-full h-28 bg-gradient-to-t from-[#28282C] to-transparent z-10 pointer-events-none" />
              </div>
            </motion.div>

            {/* Reason #3 - Medium Box */}
            <motion.div
              className="xl:col-span-4 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300 group"
              variants={fadeUpVariants}
            >
              <div className="flex flex-col h-full">
                <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                  It's Open Source
                </h3>
                <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed flex-1">
                  Our desktop app's code and infrastructure are all{" "}
                  <a 
                    href="https://github.com/storytold/artcraft" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-400 font-semibold hover:text-primary-300 underline underline-offset-2 transition-colors"
                  >
                    open source on GitHub.
                  </a>{" "}
                  Join us and contribute!
                </p>
                <div className="flex justify-center items-center h-full p-4 lg:p-6 select-none">
                  <img
                    src="/images/github-logo.png"
                    alt="GitHub Logo"
                    className="h-20 md:h-32 lg:h-36"
                    draggable={false}
                  />
                </div>
              </div>
            </motion.div>

            {/* Reason #4 - Large Box */}
            <motion.div
              className="xl:col-span-8 bg-[#28282C] rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-300 group overflow-hidden"
              variants={fadeUpVariants}
            >
              <div className="lg:flex-1 flex flex-col justify-between">
                <div className="p-6 lg:p-8">
                  <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                    Use Every Model
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                    You'll be able to use{" "}
                    <span className="text-primary-400 font-semibold">
                      EVERY image and video model
                    </span>{" "}
                    all in one place. Log in with your existing subscriptions.
                  </p>
                </div>
                <ModelBadgeGrid
                  highlight="gpt-image-1"
                  rowOffsets={[-70, -90, -160]}
                  className="mt-3"
                />
              </div>
            </motion.div>

            {/* Reason #5 - Full Width Box */}
            <motion.div
              className="xl:col-span-12 md:col-span-2 bg-[#28282C] rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-2xl transition-all duration-300 group"
              variants={fadeUpVariants}
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center">
                <div className="lg:flex-1">
                  <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 leading-tight">
                    Created by Artists and Filmmakers
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                    <span className="text-primary-400 font-semibold">
                      The other leading platforms were created by the Google ad
                      team, crypto bros, and other non-artists.
                    </span>{" "}
                    <br />
                    Not us. We're one of you.
                  </p>
                </div>
                <div className="flex justify-center items-center h-24 lg:h-28">
                  {/* Film icon */}
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-pink-900 rounded-full flex items-center justify-center border-2 border-pink-600 shadow-lg z-10">
                    <FontAwesomeIcon
                      icon={faFilm}
                      className="text-white text-xl lg:text-2xl"
                    />
                  </div>

                  {/* Paint brush icon - center, most prominent */}
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-400 shadow-lg -ml-2 z-30">
                    <FontAwesomeIcon
                      icon={faPaintBrush}
                      className="text-white text-2xl lg:text-3xl"
                    />
                  </div>

                  {/* Camera icon */}
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-purple-900 rounded-full flex items-center justify-center border-2 border-purple-600 shadow-lg -ml-2 z-20">
                    <FontAwesomeIcon
                      icon={faCamera}
                      className="text-white text-xl lg:text-2xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="relative flex overflow-visible xl:items-center xl:pt-0 px-2 sm:px-4 md:px-0">
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

      <div className="relative z-10 mx-auto w-full max-w-[1200px] sm:px-4 md:px-16 lg:px-12 xl:px-32 pb-8 sm:pb-16 md:pb-24 lg:pb-32 overflow-visible px-4">
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

      <div className="relative z-10 py-12 md:py-24 px-4 sm:px-8 lg:px-12 max-w-[1400px] mx-auto overflow-visible">
         {/* Gradient Orb for Section */}
         <div className="absolute left-[-200px] top-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-15 blur-[120px] z-0 pointer-events-none" />

         {/* Title Area */}
         <div className="relative z-10 mb-16 md:mb-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariants}
              className="max-w-3xl"
            >
              <h2 className="text-primary font-bold text-sm md:text-base mb-6 tracking-widest uppercase">
                Advanced Crafting Features
              </h2>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
                We're Pulling You <br /> <span className="text-white">Out of Prompting</span>
              </h1>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl">
                Text-to-image is great, but artists <em>need control</em>. Achieve consistency and repeatability with our advanced toolset.
              </p>
            </motion.div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-20 items-start relative">
            {/* Mobile Navigation (Tabs) */}
            <div className="lg:hidden col-span-1 w-full overflow-x-auto pb-4 no-scrollbar flex gap-3 snap-x">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`snap-center shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-300 whitespace-nowrap ${
                    activeFeature === index
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                   {feature.title}
                </button>
              ))}
            </div>

            {/* Desktop Navigation (List) */}
            <motion.div 
              className="hidden lg:flex lg:col-span-5 flex-col min-h-[600px]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariants}
            >
              {features.map((feature, index) => (
                <div 
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`cursor-pointer border-l-2 pl-6 py-4 transition-all duration-500 group ${
                    activeFeature === index 
                      ? "border-primary" 
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <h3 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                    activeFeature === index ? "text-primary" : "text-white/40 group-hover:text-white/80"
                  }`}>
                    {feature.title}
                  </h3>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    activeFeature === index ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
                  }`}>
                    <p className="text-base text-white/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Media Preview */}
            <motion.div 
              className="col-span-1 lg:col-span-7 sticky top-24"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: {
                  opacity: 1, 
                  x: 0,
                  transition: { duration: 0.8, delay: 0.2, ease: "circOut" }
                }
              }}
            >
                <div className="relative aspect-[4/3] w-full bg-[#050505] rounded-xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5">
                  {features.map((feature, index) => (
                      <div 
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                          activeFeature === index 
                            ? "opacity-100 z-10" 
                            : "opacity-0 z-0"
                        }`}
                      >
                            <img 
                                src={feature.src}
                                alt={feature.title}
                                className="w-full h-full object-cover select-none"
                                draggable={false}
                            />
                         {/* Overlay Gradient for depth */}
                         <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      </div>
                  ))}
                </div>
            </motion.div>

            {/* Mobile Description */}
            <div className="lg:hidden col-span-1">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                 <h3 className="text-lg font-bold text-white mb-2">
                    {features[activeFeature].title}
                 </h3>
                 <p className="text-white/70 text-sm leading-relaxed">
                    {features[activeFeature].description}
                 </p>
              </motion.div>
            </div>
         </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen py-10 sm:py-20 md:py-32 sm:px-8 lg:px-32 overflow-visible px-4">
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

      <div className="relative z-10 mx-auto w-full max-w-[1400px] pt-10 sm:pt-20 md:pt-32 pb-12 sm:pb-24 md:pb-40 lg:pb-56 sm:px-8 lg:px-32 overflow-visible px-4">
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

      <Footer />
    </div>
  );
};

export default Landing;
