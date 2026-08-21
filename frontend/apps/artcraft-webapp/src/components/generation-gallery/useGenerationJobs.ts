// Moved to the shared generation-list lib (used by both webapp and desktop).
// Re-exported so every webapp consumer shares the lib's module-level caches.
export { useGenerationJobs } from "@storyteller/ui-generation-list";
export type { InProgressJob, FailedJob } from "@storyteller/ui-generation-list";
