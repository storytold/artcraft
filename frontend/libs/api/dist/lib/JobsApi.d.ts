import { ApiManager, ApiResponse } from './ApiManager.js';
import { Job, JobPreview } from './models/Job.js';
import { JobState } from './models/JobState.js';
export declare class JobsApi extends ApiManager {
    GetPreviewStatusByJobToken({ token, }: {
        token: string;
    }): Promise<ApiResponse<JobPreview>>;
    GetJobByToken({ token, }: {
        token: string;
    }): Promise<ApiResponse<JobState>>;
    ListJobs(): Promise<ApiResponse<JobState[]>>;
    ListRecentJobs(): Promise<ApiResponse<Job[]>>;
    DeleteJobByToken(jobToken: string): Promise<ApiResponse<undefined>>;
}
//# sourceMappingURL=JobsApi.d.ts.map