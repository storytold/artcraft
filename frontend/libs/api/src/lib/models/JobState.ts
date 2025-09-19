interface MaybeResult {
  entity_token: string;
  entity_type: string;
  maybe_public_bucket_media_path: string;
  maybe_successfully_completed_at: string;
}

interface Request {
  inference_category: string;
  maybe_model_title?: string;
  maybe_model_token: string;
  maybe_model_type: string;
  maybe_raw_inference_text: string;
  maybe_style_name: string;
}

interface Status {
  attempt_count: number;
  maybe_assigned_cluster?: string;
  maybe_assigned_worker?: string;
  maybe_extra_status_description?: string;
  maybe_failure_category?: string;
  maybe_first_started_at: string;
  requires_keepalive: boolean;
  status: string;
}

export interface JobState {
  created_at: string;
  job_token: string;
  maybe_result?: MaybeResult;
  request: Request;
  status: Status;
  updated_at: string;
}
