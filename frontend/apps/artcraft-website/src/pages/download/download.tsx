import { faApple, faWindows } from "@fortawesome/free-brands-svg-icons";
import { faArrowDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { DOWNLOAD_LINKS } from "../../config/downloads";
import { isMobile } from "react-device-detect";

const Download = () => {
  const systemRequirements = [
    {
      os: "Windows",
      icon: faWindows,
      requirements: [
        "Windows 10 (64-bit) or newer",
        "16GB RAM recommended",
        "Dedicated GPU recommended",
      ],
    },
    {
      os: "macOS",
      icon: faApple,
      requirements: [
        "macOS 12.0 or newer",
        "16GB RAM recommended",
        "Apple Silicon recommended",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[900px] h-[900px] rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-30 blur-[120px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative flex overflow-hidden">
        <div className="w-full flex flex-col items-center justify-center text-center pt-40 pb-20 px-10">
          <h1 className="relative mb-10 font-bold text-5xl lg:text-7xl">
            Download ArtCraft
          </h1>

          <p className="mb-12 max-w-xl text-lg lg:text-xl leading-relaxed text-gray-300">
            Use ArtCraft to easily create AI-powered artwork on your computer,
            with canvas editing and 3D scene composition.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row items-center justify-center mb-20">
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
                  href={DOWNLOAD_LINKS.WINDOWS}
                >
                  <FontAwesomeIcon icon={faWindows} />
                  Download Windows
                </Button>
                <Button
                  className="text-md px-4 py-3 font-semibold rounded-xl shadow-lg gap-3"
                  as="link"
                  href={DOWNLOAD_LINKS.MACOS}
                >
                  <FontAwesomeIcon icon={faApple} />
                  Download Mac
                </Button>
              </>
            )}
          </div>

          <div className="w-full max-w-7xl mb-20">
            <img
              src="/images/3d-interface-preview.jpg"
              alt="ArtCraft Interface Preview"
              className="w-full rounded-xl border-2 border-white/10"
            />
          </div>

          {/* Recommended System Requirements */}
          <div className="w-full max-w-6xl mb-20">
            <h2 className="text-3xl font-bold mb-10">
              Recommended System Requirements
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {systemRequirements.map((system, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 flex flex-col gap-4 items-center"
                >
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <FontAwesomeIcon
                      icon={system.icon}
                      className="text-2xl text-white/80"
                    />
                    <h3 className="text-2xl font-semibold">{system.os}</h3>
                  </div>
                  <ul className="space-y-3 mb-5">
                    {system.requirements.map((req, idx) => (
                      <li key={idx} className="text-gray-300">
                        {req}
                      </li>
                    ))}
                  </ul>
                  {isMobile ? (
                    <Button className="w-fit" icon={faArrowDownToLine} disabled>
                      Download on a desktop
                    </Button>
                  ) : (
                    <Button
                      className="w-fit"
                      onClick={() => {
                        const downloadLink =
                          system.os === "Windows"
                            ? DOWNLOAD_LINKS.WINDOWS
                            : DOWNLOAD_LINKS.MACOS;
                        window.open(downloadLink, "_blank");
                      }}
                      icon={faArrowDownToLine}
                    >
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
