import { Job } from "~/models";

export type WindowExtended = typeof window & {
  stopPollingActiveJobs: () => void;
};

export type GetJobsResponse = {
  success: boolean;
  error_message?: string;
  jobs?: Job[];
};
