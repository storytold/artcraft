import { JobStatus } from "../enums/Job.js";

export interface Job {
  created_at: string;
  job_token: string;
  maybe_result: JobMaybeResult;
  request: JobRequest;
  status: JobStatusResponse;
  updated_at: string;
}

export interface JobMaybeResult {
  entity_token: string;
  entity_type: string;
  // maybe_public_bucket_media_path: string;
  maybe_successfully_completed_at: string;
  media_links: {
    cdn_url: string;
  };
}
export interface JobRequest {
  inference_category: string;
  maybe_model_title: string;
  maybe_model_token: string;
  maybe_model_type: string;
  maybe_raw_inference_text: string;
  maybe_style_name: string;
}

export interface JobStatusResponse {
  attempt_count: number;
  maybe_assigned_cluster: string;
  maybe_assigned_worker: string;
  maybe_extra_status_description: string;
  maybe_failure_category: string;
  maybe_first_started_at: string;
  requires_keepalive: boolean;
  progress_percentage: number;
  status: JobStatus;
}

export interface JobPreview {
  success: boolean;
  state: {
    job_token: string;
    request: Record<string, unknown>;
    status: {
      status: string;
      maybe_extra_status_description: string | null;
      maybe_assigned_worker: string;
      maybe_assigned_cluster: string;
      maybe_first_started_at: string;
      attempt_count: number;
      requires_keepalive: boolean;
      maybe_failure_category: string;
      progress_percentage: number;
    };
    maybe_result: {
      expected_stages: number;
      currently_active_stage: number;
      per_stage_frame_count: number;
      stages: Array<{
        stage_progress: number;
        expected_frame_count: number;
        stage_complete: boolean;
        frames: string[];
      }>;
    };
    created_at: string;
    updated_at: string;
  };
}
