export interface StatusAlert {
  maybe_alert?: MaybeAlert;
  refresh_interval_millis: number;
}

interface MaybeAlert {
  maybe_category?: string;
  maybe_message?: string;
}
