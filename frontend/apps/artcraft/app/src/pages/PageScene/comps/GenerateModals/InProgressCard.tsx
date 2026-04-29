import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals";
import { JobState } from "~/pages/PageScene/enums";
import { ActiveJob } from "~/pages/PageScene/models";
import { Tooltip } from "@storyteller/ui-tooltip";
import { JobsApi } from "~/Classes/ApiManager";
import { PollRecentJobs } from "~/hooks/useActiveJobs/utilities";
interface Props {
  job: ActiveJob;
}

function getPercent(status: JobState, percentage: number) {
  if (
    [
      JobState.COMPLETE_FAILURE,
      JobState.ATTEMPT_FAILED,
      JobState.DEAD,
    ].includes(status)
  ) {
    return 0;
  } else {
    return percentage;
  }
}

export function InProgressCard({ job }: Props) {
  const completePercent = getPercent(
    job.status.status as JobState,
    job.status.progress_percentage,
  );

  const deleteJob = useCallback(async (job: ActiveJob) => {
    const jobsApi = new JobsApi();

    const response = await jobsApi.DeleteJobByToken(job.job_token);
    if (response.success) {
      PollRecentJobs();
      addToast(ToastTypes.SUCCESS, "File successfully deleted.");
      return;
    }

    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Error deleting the file.",
    );
  }, []);

  return (
    <div className="flex w-full items-center justify-between rounded-lg p-2 text-start transition-all duration-150 hover:bg-white/10">
      <div className="flex gap-4">
        <div className="flex aspect-square h-14 w-14 items-center justify-center rounded-lg border border-[#A9A9A9]/50 bg-black/60 text-white">
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
          {/* {(job.status.status === JobState.STARTED ||
            job.status.status === JobState.PENDING) && (
            <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
          )}
          {(job.status.status === JobState.COMPLETE_FAILURE ||
            job.status.status === JobState.ATTEMPT_FAILED) && (
            <FontAwesomeIcon icon={faCircleExclamation} size={"lg"} />
          )} */}
        </div>
        <div className="flex flex-col justify-center gap-1">
          <div className="font-medium">
            {job.request.maybe_model_title || "Image Generation"}
          </div>

          <div className="text-sm capitalize text-white/60">
            {job.status.status.replaceAll("_", " ")}... {completePercent}%
          </div>
        </div>
      </div>

      {job.status.status !== JobState.STARTED && (
        <div className="pr-5">
          <Tooltip content="Cancel" position="left">
            <button
              onClick={() => deleteJob(job)}
              className="text-[15px] font-medium text-white/50 transition-all duration-150 hover:text-white/100"
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
