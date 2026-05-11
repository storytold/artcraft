import { DiscordButton } from "../discord-button";

export const ReallyAI = () => {
  return (
    <>
      <div className="relative flex overflow-visible xl:items-center xl:pt-0 px-2 sm:px-4 md:px-0 md:-mt-36 min-[1980px]:-mt-64">
        {/* Gradient Orb for Section */}
        <div className="absolute left-[-200px] top-[-100px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-blue-700 opacity-15 blur-[80px] md:blur-[120px] z-0 pointer-events-none transform-gpu" />
        <div
          className="w-full flex flex-col items-center justify-center text-center pt-16 sm:pt-24 md:pt-32 px-2 sm:px-6 md:px-10"
          data-animate
        >
          <div className="relative">
            <h1 className="relative mb-4 sm:mb-6 md:mb-10 font-medium text-3xl sm:text-4xl md:text-[3rem] lg:text-[4rem] xl:text-[5rem] !leading-none text-shadow-lg">
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                "
              </span>
              Is this really AI?
              <span
                className="text-primary"
                style={{ textShadow: "0 0 15px var(--color-primary)" }}
              >
                "
              </span>
            </h1>
            <span className="absolute -right-6 sm:-right-5 -bottom-1 sm:bottom-4 md:-right-16 md:bottom-10 text-lg sm:text-xl md:text-3xl font-bold opacity-40 italic hover:opacity-80 transition-opacity duration-300">
              — You
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] sm:px-4 md:px-16 lg:px-12 xl:px-32 pb-8 sm:pb-16 md:pb-24 lg:pb-32 overflow-visible px-4">
        {/* Gradient Orb for Section */}
        <div className="absolute right-[-250px] top-[-150px] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-700 via-[#00AABA] to-pink-500 opacity-[0.1] blur-[100px] md:blur-[140px] z-0 pointer-events-none transform-gpu" />
        <div
          className="items-center gap-8 sm:gap-12 md:gap-16 mb-8 sm:mb-12 p-2 sm:p-4 bg-white/10 backdrop-blur-md rounded-[24px] sm:rounded-[40px] shadow-xl"
          data-animate
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
        </div>
        <div
          className="flex justify-center"
          data-animate
        >
          <DiscordButton />
        </div>
      </div>
    </>
  );
}