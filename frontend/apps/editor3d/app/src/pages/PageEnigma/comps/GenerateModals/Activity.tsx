import { useSignals } from "@preact/signals-react/runtime";
import { faBell, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu } from "@storyteller/ui-popover";
import { CompletedCard } from "./CompletedCard";
import { InProgressCard } from "./InProgressCard";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect, useState, useRef, useCallback } from "react";
import { JobsApi } from "~/Classes/ApiManager/JobsApi";
import { toast } from "@storyteller/ui-toaster";
import { ActiveJob } from "~/pages/PageEnigma/models";
import { IsJobPollingDisabled } from "~/flags/DevConsoleFlags";

// TODO ensure we de-dupe all this extra code.
interface CompletedItem {
  token: string;
  maybe_title: string;
  public_bucket_path: string; // TODO: STOP USING THIS.
  maybe_media_links_thumbnail?: string;
  updated_at: string;
  maybe_result?: {
    entity_token?: string;
  };
}

// {
//   "job_token": "jinf_421nnr6rj8wy2sj0s11v9fns32s",
//   "request": {
//       "inference_category": "image_generation",
//       "maybe_model_type": "image_gen_api",
//       "maybe_model_token": null,
//       "maybe_model_title": "Image Generation",
//       "maybe_raw_inference_text": null,
//       "maybe_style_name": null,
//       "maybe_live_portrait_details": null,
//       "maybe_lipsync_details": null
//   },
//   "status": {
//       "status": "complete_success",
//       "maybe_extra_status_description": null,
//       "maybe_assigned_worker": "inference-job-4o-image-848c55d5dd-555kn",
//       "maybe_assigned_cluster": "storyteller-eks-1",
//       "maybe_first_started_at": "2025-04-15T04:41:01Z",
//       "maybe_current_execution_duration_seconds": null,
//       "attempt_count": 1,
//       "requires_keepalive": false,
//       "maybe_failure_category": null,
//       "progress_percentage": 100
//   },
//   "maybe_result": {
//       "entity_type": "media_file",
//       "entity_token": "m_ytrjp1fcd5tb43ebcs3ewhq6y05tfb",
//       "maybe_public_bucket_media_path": "/media/p/t/7/y/g/pt7yg2xfv4ynemssfv1mwb7yxe26e2nb/image_pt7yg2xfv4ynemssfv1mwb7yxe26e2nb.png",
//       "media_links": {
//           "cdn_url": "https://cdn-2.fakeyou.com/media/p/t/7/y/g/pt7yg2xfv4ynemssfv1mwb7yxe26e2nb/image_pt7yg2xfv4ynemssfv1mwb7yxe26e2nb.png",
//           "maybe_thumbnail_template": "https://cdn-2.fakeyou.com/cdn-cgi/image/width={WIDTH},quality=95/media/p/t/7/y/g/pt7yg2xfv4ynemssfv1mwb7yxe26e2nb/image_pt7yg2xfv4ynemssfv1mwb7yxe26e2nb.png",
//           "maybe_video_previews": null
//       },
//       "maybe_successfully_completed_at": "2025-04-15T04:42:14Z"
//   },
//   "created_at": "2025-04-15T04:41:01Z",
//   "updated_at": "2025-04-15T04:42:14Z"
// }

export function Activity() {
  useSignals();
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const processedJobs = useRef(new Set<string>());
  const isFirstLoad = useRef(true);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced toast function
  const showToast = useCallback((items: CompletedItem[]) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      const count = items.length;
      toast.success(
        count === 1
          ? `${items[0].maybe_title} completed successfully`
          : `${count} images completed successfully`,
      );
      toastTimeoutRef.current = null;
    }, 100); // Small delay to catch potential double calls
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchJobs() {
      if (IsJobPollingDisabled()) {
        return;
      }
      try {
        const jobsApi = new JobsApi();
        const response = await jobsApi.ListRecentJobs();

        if (!mounted || !response.success || !response.data) return;

        // Handle active jobs
        const activeJobs = response.data
          .filter((job) => {
            const status = job.status?.status?.toLowerCase();
            return (
              status && status !== "complete_success" && status !== "failed"
            );
          })
          .map(
            (job) =>
              ({
                job_token: job.job_token,
                request: {
                  maybe_model_title:
                    job.request?.maybe_model_title || "Image Generation",
                },
                status: {
                  status: job.status?.status?.toUpperCase() || "",
                  progress_percentage: job.status?.progress_percentage || 0,
                },
                created_at: job.created_at || new Date().toISOString(),
                updated_at: job.updated_at || new Date().toISOString(),
                maybe_result: job.maybe_result || null,
              }) as ActiveJob,
          );

        // Handle completed jobs
        const newlyCompleted = response.data.filter(
          (job) =>
            job.status?.status?.toLowerCase() === "complete_success" &&
            !processedJobs.current.has(job.job_token),
        );

        if (newlyCompleted.length > 0) {
          // Add to processed set
          newlyCompleted.forEach((job) =>
            processedJobs.current.add(job.job_token),
          );

          // Create completed items
          const newItems = newlyCompleted.map((job) => ({
            token: job.job_token,
            maybe_title: job.request?.maybe_model_title || "Image Generation",
            public_bucket_path:
              job.maybe_result?.maybe_public_bucket_media_path || "",
            maybe_media_links_thumbnail: ((job) => {
              // Try the video thumbnail first, then the regular thumbnail.
              const maybeVideoThumb =
                job.maybe_result?.media_links?.maybe_video_previews?.animated;
              const maybeGenericThumb = (
                job.maybe_result?.media_links?.maybe_thumbnail_template || ""
              ).replace("{WIDTH}", "500");
              return maybeVideoThumb || maybeGenericThumb;
            })(job),
            updated_at: job.updated_at || new Date().toISOString(),
            maybe_result: job.maybe_result,
          }));

          // NB(bt,2025-07-28): Don't use eventing from here anymore.
          // Tauri is sending direct events we can bind toasts to.
          // // Show toast only if not first load
          // if (!isFirstLoad.current) {
          //   showToast(newItems);
          // }

          // Update state
          setCompletedItems((prev) => {
            const combined = [...newItems, ...prev];
            return combined
              .filter(
                (item, index, self) =>
                  index === self.findIndex((t) => t.token === item.token),
              )
              .sort(
                (a, b) =>
                  new Date(b.updated_at).getTime() -
                  new Date(a.updated_at).getTime(),
              )
              .slice(0, 50);
          });
        }

        setJobs(activeJobs);
        isFirstLoad.current = false;
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    }

    // Initial fetch
    fetchJobs();

    // Set up polling
    const interval = setInterval(fetchJobs, 5000);

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(interval);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [showToast]);

  return (
    <Tooltip content="Activity" position="bottom" closeOnClick={true}>
      <PopoverMenu
        mode="default"
        buttonClassName="h-[38px] w-[38px] !p-0"
        panelClassName="w-[360px] p-2 bg-ui-panel"
        position="bottom"
        align="end"
        triggerIcon={
          <div>
            {jobs.length > 0 ? (
              <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faBell} />
            )}
            {jobs.length > 0 && (
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-brand-primary-400" />
            )}
          </div>
        }
      >
        {(close) => (
          <div className="max-h-[480px] overflow-y-auto">
            {jobs.length > 0 && (
              <div>
                {jobs.map((job) => (
                  <InProgressCard key={job.job_token} job={job} />
                ))}
              </div>
            )}

            {isFirstLoad.current ? (
              <div className="flex h-48 w-full flex-col justify-center gap-4 p-4 text-center align-middle">
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  spin
                  size="2x"
                  className="text-base-fg/40"
                />
                <h3 className="text-base-fg/60">Retrieving Activities</h3>
              </div>
            ) : jobs.length === 0 && completedItems.length === 0 ? (
              <div className="flex h-48 w-full flex-col justify-center gap-4 p-4 text-center align-middle">
                <h3 className="text-base-fg/60 text-lg">No activities yet</h3>
              </div>
            ) : (
              <div>
                <div className="flex flex-col">
                  {completedItems.map((item) => (
                    <div key={item.token} onClick={close}>
                      <CompletedCard job={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PopoverMenu>
    </Tooltip>
  );
}
