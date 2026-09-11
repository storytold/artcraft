import { signal, computed } from "@preact/signals-core";
import deepEqual from "deep-equal";

import { JobStatus, JobType } from "~/enums";
import { PollRecentJobs } from "~/hooks/useActiveJobs/utilities";
import { Job } from "~/models";
import { isJobStatusTerminal } from "~/utilities";

export const recentJobs = signal<Job[] | undefined>(undefined);
export const setJobs = (newJobList: Job[]) => {
  if (!deepEqual(setJobs, newJobList)) {
    recentJobs.value = [...newJobList];
  }
  //else, same list, do nothing.
};

export const activeJobs = computed(() => {
  if (!recentJobs.value) {
    return undefined;
  }
  return recentJobs.value.filter((job) => {
    // if job is not terminal, it's an active job
    return !isJobStatusTerminal(job.status.status);
  });
});

export const activeWorkflowJobs = computed(() => {
  if (!activeJobs.value) {
    return undefined;
  }
  return activeJobs.value.filter((job) => {
    return job.request.inference_category === JobType.VideoStyleTransfer;
  });
});

export const activeImageGenerationJobs = computed(() => {
  if (!activeJobs.value) {
    return undefined;
  }
  return activeJobs.value.filter((job) => {
    return job.request.inference_category === JobType.ImageGeneration;
  });
});

export const activeAudioJobs = computed(() => {
  if (!activeJobs.value) {
    return undefined;
  }
  return activeJobs.value.filter((job) => {
    return (
      job.request.inference_category === JobType.TextToSpeech ||
      job.request.inference_category === JobType.VoiceConversion
    );
  });
});

export const completedJobs = computed(() => {
  if (!recentJobs.value) {
    return undefined;
  }
  return recentJobs.value.filter((job) => {
    return job.status.status === JobStatus.COMPLETE_SUCCESS;
  });
});

export const completedWorkflowJobs = computed(() => {
  if (!completedJobs.value) {
    return undefined;
  }
  return completedJobs.value.filter((job) => {
    return job.request.inference_category === JobType.VideoStyleTransfer;
  });
});

export const completedAudioJobs = computed(() => {
  if (!completedJobs.value) {
    return undefined;
  }
  return completedJobs.value.filter((job) => {
    return (
      job.request.inference_category === JobType.TextToSpeech ||
      job.request.inference_category === JobType.VoiceConversion
    );
  });
});

export const shouldPollActiveJobs = signal<boolean>(false);

export const startPollingActiveJobs = () => {
  PollRecentJobs(); //poll once regardless of polling intervals
  shouldPollActiveJobs.value = true;
};

export const stopPollingActiveJobs = () => {
  shouldPollActiveJobs.value = false;
};
