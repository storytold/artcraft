import {
  faArrowAltUp,
  faTriangleExclamation,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { gtagEvent } from "@storyteller/google-analytics";
import { GetAppInfo, OpenUrl } from "@storyteller/tauri-api";
import { useTauriPlatform } from "@storyteller/tauri-utils";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MiscApi, VersionApi, NewVersionInfo } from "~/Classes/ApiManager";

export const AppStatusCheck = () => {
  const [updateInfo, setUpdateInfo] = useState<NewVersionInfo | null>(null);
  const platform = useTauriPlatform();

  useEffect(() => {
    let active = true;
    const checkAppStatus = async () => {
      try {
        const appInfo = await GetAppInfo();
        const version = appInfo.payload.artcraft_version;
        const currentPlatform =
          platform || appInfo.payload.os_platform || "windows";

        let versionRes = await VersionApi.getInstance().getVersionInfo(
          currentPlatform,
          version,
        );

        // TODO: Remove this mock once the API is working!
        if (!versionRes.success || !versionRes.data) {
          console.log(
            "API not working - injecting mock version info for testing",
          );
          versionRes = {
            success: true,
            data: {
              is_up_to_date: false,
              new_version: {
                version_label: "v1.5.0-beta",
                features_description:
                  "New AI generation tools, UI polish, and bug fixes!",
                direct_download_link: "https://getartcraft.com/download/direct",
                website_download_link: "https://getartcraft.com/download",
              },
            },
          };
        }

        if (
          active &&
          versionRes.success &&
          versionRes.data &&
          !versionRes.data.is_up_to_date &&
          versionRes.data.new_version
        ) {
          const newVersion = versionRes.data.new_version;
          setUpdateInfo(newVersion);

          setTimeout(() => {
            if (active) {
              toast(
                (t) => (
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      toast.dismiss(t.id);
                      if (newVersion.direct_download_link) {
                        OpenUrl(newVersion.direct_download_link);
                      } else {
                        OpenUrl(newVersion.website_download_link);
                      }
                      gtagEvent("click_update_button");
                    }}
                  >
                    Update available: {newVersion.version_label}
                  </div>
                ),
                {
                  duration: 10000,
                  icon: (
                    <FontAwesomeIcon
                      icon={faArrowAltUp}
                      className="text-blue-600"
                    />
                  ),
                  style: {
                    background: "#eff6ff",
                    color: "#1e3a8a",
                    border: "1px solid #bfdbfe",
                  },
                },
              );
            }
          }, 1000);
        }

        let outageRes = await new MiscApi().GetStatusAlertCheck();

        // TODO: Remove this mock once the API is working!
        if (!outageRes.success || !outageRes.data?.maybe_alert?.maybe_message) {
          console.log(
            "API not working - injecting mock outage info for testing",
          );
          outageRes = {
            success: true,
            data: {
              refresh_interval_millis: 60000,
              maybe_alert: {
                maybe_category: "outage",
                maybe_message:
                  "We are currently experiencing a brief outage. The team is actively investigating.",
              },
            },
          };
        }

        if (
          active &&
          outageRes.success &&
          outageRes.data?.maybe_alert?.maybe_message
        ) {
          // Add a small delay for the toast to ensure it doesn't get hidden by initial loads
          setTimeout(() => {
            if (active) {
              toast(outageRes.data!.maybe_alert!.maybe_message!, {
                duration: 15000,
                icon: (
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="text-red-700"
                  />
                ),

                style: {
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #f87171",
                },
              });
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to check app status", err);
      }
    };
    checkAppStatus();
    return () => {
      active = false;
    };
  }, [platform]);

  if (!updateInfo) {
    return null;
  }

  return (
    <Tooltip
      content={`Update: ${updateInfo.version_label} - ${updateInfo.features_description}`}
      position="bottom"
      delay={300}
    >
      <Button
        variant="primary"
        className="h-[38px] transition-all duration-300 hover:animate-none hover:shadow-none"
        onClick={() => {
          if (updateInfo.direct_download_link) {
            OpenUrl(updateInfo.direct_download_link);
          } else {
            OpenUrl(updateInfo.website_download_link);
          }
          gtagEvent("click_update_button");
        }}
      >
        <FontAwesomeIcon icon={faArrowAltUp} className="animate-bounce" />
        Update
      </Button>
    </Tooltip>
  );
};
